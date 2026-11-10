// Unit tests for assets/js/forecast.js (Vitals Forecast math). Run: npm run test:forecast
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

// forecast.js is a plain browser script (it sets self.Forecast); run it in a sandbox to test it.
const ctx = { self: {}, URLSearchParams };
vm.runInNewContext(fs.readFileSync(new URL("../assets/js/forecast.js", import.meta.url), "utf8"), ctx);
const F = ctx.self.Forecast;
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("cost per result from CPM, CTR and CVR", () => {
  // 100 per 1,000 impressions, 1% click, 2% convert → 100 / (1000 × 0.01 × 0.02) = 500
  near(F.costPerResult({ cpm: 100, ctr: 0.01, cvr: 0.02 }), 500);
});

test("a direct cost-per-result benchmark wins over CPM × CTR × CVR", () => {
  assert.equal(F.costPerResult({ cpm: 100, ctr: 0.01, cvr: 0.02, cpr: 320 }), 320);
});

test("missing benchmarks give null, not a made-up number", () => {
  assert.equal(F.costPerResult({ cpm: null, ctr: 0.01, cvr: 0.02 }), null);
  assert.equal(F.costPerResult({}), null);
  assert.equal(F.results(10000, null), null);
});

test("results = budget / cost per result", () => {
  near(F.results(50000, 500), 100);
});

test("revenue for sales = results × AOV", () => {
  near(F.revenue(100, { goal: "sales", aov: 800 }), 80000);
});

test("revenue for leads = results × close rate × deal value", () => {
  near(F.revenue(40, { goal: "leads", closeRate: 0.25, dealValue: 20000 }), 200000);
  assert.equal(F.revenue(40, { goal: "leads", dealValue: 20000 }), null);
});

test("ROAS = revenue / budget", () => {
  near(F.roas(80000, 50000), 1.6);
  assert.equal(F.roas(80000, 0), null);
});

test("profit = revenue × gross margin − budget", () => {
  near(F.profit(80000, 0.4, 50000), -18000);
  near(F.profit(200000, 0.5, 50000), 50000);
});

test("break-even ROAS = 1 / gross margin", () => {
  near(F.breakEvenRoas(0.4), 2.5);
  near(F.breakEvenRoas(1), 1);
  assert.equal(F.breakEvenRoas(0), null);
  assert.equal(F.breakEvenRoas(1.5), null);
});

test("required cost per result: sales = AOV / target ROAS", () => {
  near(F.requiredCpr({ goal: "sales", aov: 900 }, 3), 300);
});

test("required cost per result: leads = close rate × deal value / target ROAS", () => {
  near(F.requiredCpr({ goal: "leads", closeRate: 0.2, dealValue: 30000 }, 4), 1500);
});

test("required conversion rate at the benchmark CPM and CTR", () => {
  // CPR 300 at CPM 90 and CTR 1.5% → 90 / (1000 × 0.015 × 300) = 0.02
  near(F.requiredCvr(300, { cpm: 90, ctr: 0.015 }), 0.02);
  assert.equal(F.requiredCvr(300, { cpm: null, ctr: 0.015 }), null);
});

test("gap % = (benchmark CPR − required CPR) / benchmark CPR", () => {
  near(F.gapPct(400, 300), 0.25);
  near(F.gapPct(400, 500), -0.25);
});

test("reality label from the gap and the team's stretch rule", () => {
  assert.equal(F.reality(-0.1, 0.3), "realistic");
  assert.equal(F.reality(0, 0.3), "realistic");
  assert.equal(F.reality(0.2, 0.3), "stretch");
  assert.equal(F.reality(0.5, 0.3), "unrealistic");
  assert.equal(F.reality(0.2, null), null);
});

test("reverse mode: budget needed = target results × cost per result", () => {
  near(F.budgetNeeded(120, 450), 54000);
  assert.equal(F.budgetNeeded(120, null), null);
});

test("confidence drops with each 'I don't know' and without a benchmark", () => {
  assert.equal(F.confidence({ unknowns: 0, hasBenchmark: true }), "high");
  assert.equal(F.confidence({ unknowns: 1, hasBenchmark: true }), "medium");
  assert.equal(F.confidence({ unknowns: 2, hasBenchmark: true }), "low");
  assert.equal(F.confidence({ unknowns: 0, hasBenchmark: false }), "low");
});

test("scenarios apply the scenario factor, and the learning factor in month 1 only", () => {
  const out = F.scenarios({ cpr: 500, budget: 50000, input: { goal: "sales", aov: 800 }, factors: { conservative: 1.25, expected: 1, strong: 0.8 }, learning: 1.2 });
  near(out.expected[0].cpr, 600);
  near(out.expected[1].cpr, 500);
  near(out.expected[1].results, 100);
  near(out.expected[1].revenue, 80000);
  near(out.expected[1].roas, 1.6);
  near(out.conservative[2].cpr, 625);
  near(out.strong[2].cpr, 400);
});

test("scenarios in target mode give the budget needed", () => {
  const out = F.scenarios({ cpr: 500, input: { goal: "sales", aov: 800 }, factors: { conservative: 1.25, expected: 1, strong: 0.8 }, learning: 1.2, mode: "target", targetResults: 100 });
  near(out.expected[1].budget, 50000);
  near(out.expected[0].budget, 60000);
});

test("scenarios are null while factors or the learning factor are missing", () => {
  assert.equal(F.scenarios({ cpr: 500, budget: 50000, input: { goal: "sales", aov: 800 }, factors: { conservative: null, expected: 1, strong: 0.8 }, learning: 1.2 }), null);
  assert.equal(F.scenarios({ cpr: 500, budget: 50000, input: { goal: "sales", aov: 800 }, factors: { conservative: 1.2, expected: 1, strong: 0.8 }, learning: null }), null);
});

test("seasons in the next 60 days, by market, skipping undated ones", () => {
  const seasons = [
    { key: "a", start: "2026-11-01", end: "2026-11-05", markets: ["eg", "sa"] },
    { key: "b", start: "2027-03-01", markets: ["sa"] },
    { key: "c", start: null },
    { key: "d", start: "2026-10-20", markets: ["sa"] }
  ];
  assert.deepEqual(F.seasonsAhead(seasons, "2026-10-16", 60, "eg").map(s => s.key), ["a"]);
  assert.deepEqual(F.seasonsAhead(seasons, "2026-10-16", 60, "sa").map(s => s.key), ["a", "d"]);
});

test("query string round trip reopens the same inputs", () => {
  const s = { goal: "leads", market: "sa", industry: "real-estate", cur: "SAR", budget: "40000", aov: "", margin: "35", close: "20", mode: "target", tt: "roas", tv: "4", tr: "60" };
  const back = JSON.parse(JSON.stringify(F.fromQuery(F.toQuery(s))));
  assert.deepEqual(back, { goal: "leads", market: "sa", industry: "real-estate", cur: "SAR", budget: "40000", margin: "35", close: "20", mode: "target", tt: "roas", tv: "4", tr: "60" });
});

test("the shipped benchmark file holds no numbers the user didn't give", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../assets/data/forecast-benchmarks.json", import.meta.url), "utf8"));
  const found = [];
  const walk = (v, path) => {
    if (typeof v === "number") found.push(path);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, path + "." + k);
  };
  walk(data.benchmarks, "benchmarks");
  walk(data.scenario_factors, "scenario_factors");
  walk(data.learning_phase_factor, "learning_phase_factor");
  assert.deepEqual(found, []);
  // and every market × industry × goal row exists, so the page never has to guess a shape
  for (const m of data.markets) for (const i of data.industries) for (const g of F.GOALS) assert.ok(F.benchmark(data, m.key, i.key, g), `${m.key}/${i.key}/${g}`);
});
