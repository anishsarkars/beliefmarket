import type { AgentRole, AgentVerdict, Debate, VoteSide } from "./types";
import { clamp } from "./utils";
import { generateDebate, type BeliefSeed } from "./ai";

const ROLES: AgentRole[] = [
  "Advocate",
  "Skeptic",
  "Historian",
  "Analyst",
  "Contrarian",
  "Fact Checker",
  "Ethicist",
];

const VALID_STANCES: VoteSide[] = ["believe", "cope", "neutral"];

interface RawAgent {
  role?: string;
  stance?: string;
  summary?: string;
  arguments?: unknown;
  evidence?: unknown;
  probability?: unknown;
  confidence?: unknown;
}

interface RawDebate {
  agents?: RawAgent[];
  keyRisks?: unknown;
  keyCatalysts?: unknown;
  historicalSimilarities?: unknown;
}

function toStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, max);
}

function toNum(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStance(s: unknown): VoteSide {
  const v = String(s ?? "").toLowerCase();
  return (VALID_STANCES as string[]).includes(v) ? (v as VoteSide) : "neutral";
}

const SYSTEM_PROMPT = `You are the Belief Market debate engine. Given a user's belief about ANY topic (not just finance), you simulate a panel of 7 distinct AI analysts who debate whether the belief will prove true.

The 7 analysts, in order, with their leaning:
1. Advocate — argues in favor (tends to "believe")
2. Skeptic — pokes holes (tends to "cope")
3. Historian — reasons from precedent (neutral)
4. Analyst — reasons from data (neutral)
5. Contrarian — fades the consensus (tends to "cope")
6. Fact Checker — verifies claims (evidence-led)
7. Ethicist — weighs values and consequences (neutral)

Return ONLY valid minified JSON (no markdown, no prose) with this exact shape:
{
 "agents":[
  {"role":"Advocate","stance":"believe|cope|neutral","summary":"1-2 sentences in the analyst's voice","arguments":["short point","short point","short point"],"evidence":["2-4 word tag","2-4 word tag"],"probability":0-100,"confidence":0-100}
  // ...one object for EACH of the 7 roles above, same order, same role names
 ],
 "keyRisks":["why it might NOT hold","...","..."],
 "keyCatalysts":["why it might come TRUE","...","..."],
 "historicalSimilarities":[{"title":"short label","outcome":"Came true|Fell short|Mixed|Consensus held","detail":"1 sentence"}]
}
Rules: probability = that analyst's estimated % chance the belief proves true. Keep summaries and arguments concise, specific to the belief, and free of financial/investment framing unless the belief itself is financial. Output JSON only.`;

function buildDebateFromRaw(raw: RawDebate, seed: BeliefSeed): Debate {
  const byRole = new Map<string, RawAgent>();
  for (const a of raw.agents ?? []) {
    if (a && typeof a.role === "string") byRole.set(a.role.toLowerCase(), a);
  }

  const fallback = generateDebate(seed);

  const agents: AgentVerdict[] = ROLES.map((role, i) => {
    const r = byRole.get(role.toLowerCase());
    const fb = fallback.agents[i];
    if (!r) return fb;

    const args = toStringArray(r.arguments, 4);
    const ev = toStringArray(r.evidence, 4);
    return {
      id: `agent_${role.replace(/\s+/g, "_").toLowerCase()}`,
      role,
      stance: normalizeStance(r.stance),
      summary:
        typeof r.summary === "string" && r.summary.trim() ? r.summary.trim() : fb.summary,
      arguments: args.length ? args : fb.arguments,
      evidence: ev.length ? ev : fb.evidence,
      probability: clamp(Math.round(toNum(r.probability, fb.probability)), 2, 98),
      confidence: clamp(Math.round(toNum(r.confidence, fb.confidence)), 30, 99),
    };
  });

  const avgProb = agents.reduce((a, x) => a + x.probability, 0) / agents.length;
  const believe = clamp(Math.round(avgProb), 5, 95);
  const cope = 100 - believe;
  const avgConf = agents.reduce((a, x) => a + x.confidence, 0) / agents.length;
  const confidence: Debate["consensus"]["confidence"] =
    avgConf >= 82 ? "Very High" : avgConf >= 70 ? "High" : avgConf >= 58 ? "Moderate" : "Low";

  const keyRisks = toStringArray(raw.keyRisks, 4);
  const keyCatalysts = toStringArray(raw.keyCatalysts, 4);

  const historical = Array.isArray(raw.historicalSimilarities)
    ? raw.historicalSimilarities
        .filter((h): h is { title?: unknown; outcome?: unknown; detail?: unknown } =>
          !!h && typeof h === "object"
        )
        .map((h) => ({
          title: String((h as { title?: unknown }).title ?? "Historical parallel"),
          outcome: String((h as { outcome?: unknown }).outcome ?? (believe > 55 ? "Came true" : "Mixed")),
          detail: String((h as { detail?: unknown }).detail ?? ""),
        }))
        .filter((h) => h.detail)
        .slice(0, 3)
    : [];

  return {
    agents,
    consensus: { believe, cope, confidence, probability: believe },
    keyRisks: keyRisks.length ? keyRisks : fallback.keyRisks,
    keyCatalysts: keyCatalysts.length ? keyCatalysts : fallback.keyCatalysts,
    historicalSimilarities: historical.length
      ? historical
      : fallback.historicalSimilarities,
    generatedAt: new Date().toISOString(),
  };
}

function extractJson(text: string): RawDebate | null {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as RawDebate;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as RawDebate;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateDebateAI(seed: BeliefSeed): Promise<Debate> {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseUrl = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

  if (!apiKey) return generateDebate(seed);

  const userPrompt = `Belief: "${seed.title}"
Precise claim: ${seed.title}
Topic: ${seed.topic}
Category: ${seed.category}
Time horizon: ${seed.timeHorizon}
Author confidence: ${seed.confidence}%
${seed.description ? `Context: ${seed.description}` : ""}

Debate this belief and return the JSON described.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error("NVIDIA API error:", res.status, await res.text().catch(() => ""));
      return generateDebate(seed);
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return generateDebate(seed);

    const raw = extractJson(content);
    if (!raw || !Array.isArray(raw.agents) || raw.agents.length === 0) {
      return generateDebate(seed);
    }

    return buildDebateFromRaw(raw, seed);
  } catch (err) {
    console.error("NVIDIA debate generation failed:", err);
    return generateDebate(seed);
  }
}
