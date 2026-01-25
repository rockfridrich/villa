#!/usr/bin/env bun

const mins = parseInt(process.argv[2]) || 30;
const level = (process.argv[3] || "medium") as "light" | "medium" | "heavy";

const tokensPerMin = { light: 2000, medium: 5000, heavy: 10000 }[level];
const dist = { light: [60, 35, 5], medium: [40, 50, 10], heavy: [30, 50, 20] }[level];

const total = mins * tokensPerMin;
const [h, s, o] = dist.map(p => Math.round(total * p / 100));
const cost = (h / 1e6 * 0.25) + (s / 1e6 * 3) + (o / 1e6 * 15);

console.log(`
\x1b[33m━━━ Session Cost (${mins}min, ${level}) ━━━\x1b[0m

  Haiku:  ${h.toLocaleString().padStart(8)} tokens  $${(h/1e6*0.25).toFixed(2)}
  Sonnet: ${s.toLocaleString().padStart(8)} tokens  $${(s/1e6*3).toFixed(2)}
  Opus:   ${o.toLocaleString().padStart(8)} tokens  $${(o/1e6*15).toFixed(2)}
  ─────────────────────────────────
  TOTAL:  ${total.toLocaleString().padStart(8)} tokens  \x1b[32m$${cost.toFixed(2)}\x1b[0m

\x1b[33m━━━ Agent → Model Mapping ━━━\x1b[0m

  CHEAP ($0.25-0.50/1M):
    explore, librarian, test, ops → Haiku / Gemini Flash

  STANDARD ($2-3/1M):
    build, design, review, frontend → Sonnet / GPT-4o

  PREMIUM ($15-25/1M):
    oracle, architect, spec → Opus / GPT-5.2 Pro

\x1b[33m━━━ OpenRouter Alternatives ━━━\x1b[0m

  gemini-3-flash     $0.50/1M  (cheaper than Haiku)
  gpt-5.2-codex      $1.75/1M  (code specialist)
  claude-sonnet-4.5  $3.00/1M  (balanced)
  claude-opus-4.5    $5.00/1M  (cheaper than direct)

  \x1b[31m⚠ Use OpenRouter for 30-50% savings on premium models\x1b[0m
`);
