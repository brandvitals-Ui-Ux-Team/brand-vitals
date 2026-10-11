// /api/ai — AI help inside Vitals GO (members only).
//   { action: "summarize", workspace_id, messages: [{author, body, visibility}] } → { summary, open_items[], extra_work[] }
//   { action: "classify",  workspace_id, text }                                  → { kind: "revision"|"new_request"|"question"|"approval", reason }
//   { action: "draft",     workspace_id, messages, lang }                         → { reply }
//   { action: "transcribe", workspace_id, audio_base64, mime }                    → { text }   (ElevenLabs Scribe)
// Claude: model claude-opus-5-5 with server-side fallback ("default") so a safety
// decline is re-run on another model instead of failing.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { env, handle, json, readJson, requireMember } from "./_lib/server.js";

const MODEL = env("ANTHROPIC_MODEL") || "claude-opus-5-5";
const BETAS = ["server-side-fallback-2026-07-01"];

const SYSTEM = `You help a marketing/creative agency manage work with its clients inside "Vitals GO".
Clients write in Arabic (Egyptian, Gulf or Modern Standard) or English, sometimes mixed or in Franco-Arabic.
"Extra work" means a request outside what was already agreed: new deliverables, extra versions/sizes/formats, new scope. A "revision" changes existing work (colours, text, sizes, fixes).
Be concise and concrete. Never invent facts that are not in the conversation.`;

const Summary = z.object({
  summary: z.string().describe("2-4 sentence summary of the conversation, in the requested language"),
  open_items: z.array(z.string()).describe("Things still waiting on someone, each a short line"),
  extra_work: z.array(z.string()).describe("Client requests that look like extra work outside the agreement; empty if none")
});
const Classification = z.object({
  kind: z.enum(["revision", "new_request", "question", "approval"]),
  reason: z.string().describe("One short sentence explaining the decision")
});
const Draft = z.object({ reply: z.string().describe("A polite, short reply to the client, ready to send") });

const transcript = msgs => (Array.isArray(msgs) ? msgs : []).slice(-80)
  .map(m => `[${m.visibility === "internal" ? "INTERNAL" : "SHARED"}] ${String(m.author || "?").slice(0, 60)}: ${String(m.body || "").slice(0, 2000)}`).join("\n");

async function ask(client, schema, user, effort = "low") {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: BETAS,
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort, format: betaZodOutputFormat(schema) },
    messages: [{ role: "user", content: user }]
  });
  if (response.stop_reason === "refusal") throw Object.assign(new Error("The AI declined this request"), { status: 422 });
  if (!response.parsed_output) throw Object.assign(new Error("The AI returned an unexpected answer"), { status: 502 });
  return response.parsed_output;
}

async function transcribe(b) {
  const key = env("ELEVENLABS_API_KEY");
  if (!key) throw Object.assign(new Error("Voice transcription is not set up (ELEVENLABS_API_KEY)"), { status: 501 });
  const buf = Buffer.from(String(b.audio_base64 || ""), "base64");
  if (!buf.length || buf.length > 4_000_000) throw Object.assign(new Error("Audio must be under 4 MB"), { status: 400 });
  const fd = new FormData();
  fd.append("model_id", env("ELEVENLABS_STT_MODEL") || "scribe_v1");
  fd.append("file", new Blob([buf], { type: String(b.mime || "audio/webm") }), "voice-note");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.detail?.message || j.detail || "Transcription failed"), { status: 502 });
  return { text: j.text || "", language: j.language_code || "" };
}

export default handle(async (req, res) => {
  if (req.method === "GET") return json(res, 200, { ai: !!env("ANTHROPIC_API_KEY"), transcribe: !!env("ELEVENLABS_API_KEY"), model: MODEL });
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  const b = await readJson(req, 6_000_000);
  // Accounts are required: without them this would be an open AI proxy.
  await requireMember(req, String(b.workspace_id || ""));
  if (b.action === "transcribe") return json(res, 200, await transcribe(b));
  if (!env("ANTHROPIC_API_KEY")) return json(res, 501, { error: "AI is not set up (ANTHROPIC_API_KEY)" });
  const client = new Anthropic();
  const lang = b.lang === "ar" ? "Arabic (Egyptian-friendly)" : "English";
  try {
    if (b.action === "summarize") {
      return json(res, 200, await ask(client, Summary, `Summarize this conversation for the agency team. Write in ${lang}. INTERNAL lines are team-only notes.\n\n${transcript(b.messages)}`));
    }
    if (b.action === "classify") {
      return json(res, 200, await ask(client, Classification, `Classify this client message:\n\n${String(b.text || "").slice(0, 4000)}`));
    }
    if (b.action === "draft") {
      return json(res, 200, await ask(client, Draft, `Draft the agency's next reply to the client in ${lang}. Use only SHARED context for what the client knows; INTERNAL notes may guide you but must not be revealed. If the client asked for extra work, acknowledge it and say a quote will follow, without promising it is free.\n\n${transcript(b.messages)}`, "medium"));
    }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw Object.assign(new Error("AI is busy, try again in a moment"), { status: 429 });
    if (e instanceof Anthropic.AuthenticationError) throw Object.assign(new Error("AI key is invalid"), { status: 501 });
    if (e instanceof Anthropic.BadRequestError) throw Object.assign(new Error("AI request was rejected: " + e.message), { status: 400 });
    if (e instanceof Anthropic.APIError) throw Object.assign(new Error("AI service error"), { status: 502 });
    throw e;
  }
  json(res, 400, { error: "Unknown action" });
});
