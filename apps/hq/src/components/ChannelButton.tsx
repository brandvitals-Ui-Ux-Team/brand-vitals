// One button for every outgoing message: uses the client's preferred channel,
// with a small menu to pick another one this time.
import { ChevronDown, Hash, Link2, Mail, MessageCircle, MessageSquare, Users } from "lucide-react";
import type { ReactNode } from "react";
import { bestChannel, canUse, CHANNELS, deliver, type Outgoing } from "../lib/channels";
import { useI18n } from "../lib/i18n";
import type { Channel, Client } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { Popover, useAction, useToast } from "./ui";

export const ChannelIcon = ({ ch }: { ch: Channel }) =>
  ch === "email" ? <Mail /> : ch === "whatsapp" ? <MessageCircle /> : ch === "sms" ? <MessageSquare /> : ch === "slack" ? <Hash /> : ch === "teams" ? <Users /> : <Link2 />;

export function ChannelButton({ client, build, before, label, small, primary = true }: {
  client: Client; build: () => Outgoing | Promise<Outgoing>; before?: () => Promise<unknown>; label?: (ch: Channel) => ReactNode; small?: boolean; primary?: boolean;
}) {
  const { L } = useI18n();
  const { ws } = useWorkspace();
  const { busy, run } = useAction();
  const best = bestChannel(client);
  const others = (Object.keys(CHANNELS) as Channel[]).filter(ch => ch !== best && canUse(client, ch));
  const go = (ch: Channel) => run(async () => {
    if (before) await before();
    return deliver(ws, client, await build(), ch);
  });
  const verb = (ch: Channel) => ch === "link" ? L("Copy link", "نسخ اللينك") : ch === "email" ? L("Send by email", "ابعت بالإيميل") : ch === "sms" ? L("Send by SMS", "ابعت SMS") : L(`Send on ${CHANNELS[ch].en}`, `ابعت على ${CHANNELS[ch].ar}`);
  const cls = "btn " + (small ? "btn--sm " : "") + (primary ? (best === "whatsapp" ? "btn--wa" : "btn--primary") : "");
  const toastFor = useToastFor();
  return <span className="row" style={{ gap: 0, flexWrap: "nowrap" }}>
    <button className={cls} style={others.length ? { borderStartEndRadius: 0, borderEndEndRadius: 0 } : undefined} disabled={busy} onClick={() => go(best).then(r => r && toastFor(r.how, r.channel))}>
      <ChannelIcon ch={best} />{label ? label(best) : verb(best)}
    </button>
    {others.length > 0 && <Popover trigger={open => <button className={cls} style={{ borderStartStartRadius: 0, borderEndStartRadius: 0, paddingInline: 8, marginInlineStart: -1 }} onClick={open} aria-label={L("Other channels", "قنوات تانية")} disabled={busy}><ChevronDown /></button>}>{close => <>
      {others.map(ch => <button key={ch} onClick={() => { close(); go(ch).then(r => r && toastFor(r.how, r.channel)); }}><ChannelIcon ch={ch} />{verb(ch)}</button>)}
    </>}</Popover>}
  </span>;
}

function useToastFor() {
  const toast = useToast();
  const { L } = useI18n();
  return (how: "opened" | "sent" | "copied", ch: Channel) => {
    if (how === "sent") toast(L(`Sent on ${CHANNELS[ch].en}`, `اتبعتت على ${CHANNELS[ch].ar}`));
    else if (how === "copied") toast(L("Message and link copied", "اتنسخت الرسالة واللينك"));
  };
}
