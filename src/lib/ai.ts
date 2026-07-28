import type {
  AgentRole,
  AgentVerdict,
  Category,
  Debate,
  VoteSide,
} from "./types";
import { clamp } from "./utils";

// ─────────────────────────────────────────────────────────────
// Belief Market AI debate engine.
// Generates a 7-agent debate for a belief. Runs fully offline with
// template synthesis; swap `generateDebate` for an OpenAI call by
// wiring OPENAI_API_KEY in a server action.
// ─────────────────────────────────────────────────────────────

export interface BeliefSeed {
  title: string;
  topic: string;
  category: Category;
  confidence: number;
  timeHorizon: string;
  description?: string;
}

const ROLES: AgentRole[] = [
  "Advocate",
  "Skeptic",
  "Historian",
  "Analyst",
  "Contrarian",
  "Fact Checker",
  "Ethicist",
];

// deterministic hash so the same belief yields the same debate
function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function rng(seed: number) {
  let s = seed * 1000;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

const ROLE_STANCE: Record<AgentRole, VoteSide> = {
  Advocate: "believe",
  Skeptic: "cope",
  Historian: "neutral",
  Analyst: "neutral",
  Contrarian: "cope",
  "Fact Checker": "believe",
  Ethicist: "neutral",
};

function buildAgent(
  role: AgentRole,
  seed: BeliefSeed,
  rand: () => number
): AgentVerdict {
  const base = ROLE_STANCE[role];
  const swing = rand();
  let stance: VoteSide = base;
  if (base === "neutral") {
    stance = swing > 0.55 ? "believe" : swing < 0.4 ? "cope" : "neutral";
  }
  const bias = stance === "believe" ? 1 : stance === "cope" ? -1 : 0;
  const probability = clamp(
    Math.round(50 + bias * (14 + rand() * 22) + (seed.confidence - 50) * 0.2),
    8,
    94
  );
  const confidence = clamp(Math.round(52 + rand() * 44), 45, 97);

  const libraries: Record<AgentRole, { summary: string[]; args: string[]; ev: string[] }> = {
    Advocate: {
      summary: [
        `There's a real, credible path for this to hold — the momentum and incentives line up.`,
        `The case here is stronger than it looks; the trend clearly favors this outcome.`,
      ],
      args: [
        `The underlying trend has been accelerating, not reversing.`,
        `Incentives point everyone in the same direction over this window.`,
        `Early adopters already behave as if this is inevitable.`,
        `The alternative outcome requires an unlikely reversal.`,
      ],
      ev: [
        `Clear multi-year trend line`,
        `Growing mainstream adoption signals`,
        `Expert forecasts clustering this way`,
      ],
    },
    Skeptic: {
      summary: [
        `This underrates how hard the last mile is — belief runs ahead of reality here.`,
        `The claim is plausible but the timeline is doing a lot of heavy lifting.`,
      ],
      args: [
        `Hype cycles routinely overshoot the actual timeline.`,
        `Structural friction (cost, habit, regulation) slows this down.`,
        `Past predictions like this quietly failed to land.`,
        `The bar set by the claim is higher than people assume.`,
      ],
      ev: [
        `History of over-optimistic timelines`,
        `Adoption S-curve still early`,
        `Cost or friction barriers unresolved`,
      ],
    },
    Historian: {
      summary: [
        `We've seen versions of this before — the pattern is instructive either way.`,
        `Historically, comparable claims resolved on a longer arc than expected.`,
      ],
      args: [
        `Similar shifts took a full generation, not a few years.`,
        `The base rate for this kind of prediction is mixed.`,
        `Precedent suggests the direction is right, the timing uncertain.`,
      ],
      ev: [
        `Analogous historical episodes`,
        `Long-run base rates`,
        `Prior adoption timelines`,
      ],
    },
    Analyst: {
      summary: [
        `On the numbers, this is a coin-flip that tilts with a few key variables.`,
        `The data is mixed; small changes in assumptions swing the answer.`,
      ],
      args: [
        `Current data supports part, but not all, of the claim.`,
        `The outcome is highly sensitive to one or two variables.`,
        `Aggregated indicators lean modestly toward this.`,
      ],
      ev: [
        `Trend and rate-of-change data`,
        `Survey and polling aggregates`,
        `Sensitivity to key assumptions`,
      ],
    },
    Contrarian: {
      summary: [
        `Everyone believes this, which is exactly why I'd fade it.`,
        `Consensus is crowded here — the interesting bet is the other side.`,
      ],
      args: [
        `When a view becomes consensus, it's usually already priced in.`,
        `The obvious outcome often gets disrupted by something unforeseen.`,
        `Crowded beliefs are fragile to a single counterexample.`,
      ],
      ev: [
        `Consensus is unusually one-sided`,
        `Counter-signals being ignored`,
        `History of crowded views reversing`,
      ],
    },
    "Fact Checker": {
      summary: [
        `The verifiable pieces mostly check out, though a few claims need caveats.`,
        `Sources broadly support the core claim; the edges are fuzzier.`,
      ],
      args: [
        `The central factual claim is supported by credible sources.`,
        `A couple of supporting details are overstated but not wrong.`,
        `No primary source directly contradicts the core claim.`,
      ],
      ev: [
        `Primary-source corroboration`,
        `Reputable reporting alignment`,
        `No direct contradicting evidence`,
      ],
    },
    Ethicist: {
      summary: [
        `Whether it happens and whether it should are different questions — both matter here.`,
        `The outcome is plausible; the second-order consequences are the real story.`,
      ],
      args: [
        `Incentives may push this forward regardless of whether it's wise.`,
        `Public sentiment could accelerate or block it on values alone.`,
        `The framing of the claim shapes how people will judge it.`,
      ],
      ev: [
        `Shifting public values`,
        `Stakeholder incentive map`,
        `Norms and policy pressure`,
      ],
    },
  };

  const lib = libraries[role];
  const args = [...lib.args].sort(() => rand() - 0.5).slice(0, 3);
  const ev = [...lib.ev].sort(() => rand() - 0.5).slice(0, 2);

  return {
    id: `agent_${role.replace(/\s+/g, "_").toLowerCase()}`,
    role,
    stance,
    summary: pick(lib.summary, rand()),
    arguments: args,
    evidence: ev,
    probability,
    confidence,
  };
}

export function generateDebate(seed: BeliefSeed): Debate {
  const rand = rng(seedFrom(seed.title + seed.topic + seed.category));
  const agents = ROLES.map((role) => buildAgent(role, seed, rand));

  const avgProb = agents.reduce((a, x) => a + x.probability, 0) / agents.length;
  const believe = clamp(Math.round(avgProb), 5, 95);
  const cope = 100 - believe;
  const avgConf = agents.reduce((a, x) => a + x.confidence, 0) / agents.length;
  const confidence: Debate["consensus"]["confidence"] =
    avgConf >= 82 ? "Very High" : avgConf >= 70 ? "High" : avgConf >= 58 ? "Moderate" : "Low";

  return {
    agents,
    consensus: { believe, cope, confidence, probability: believe },
    keyRisks: [
      `The timeline (${seed.timeHorizon}) may be too aggressive`,
      `Hidden friction — cost, habit, or regulation — could stall it`,
      `A single counterexample could break a crowded consensus`,
    ],
    keyCatalysts: [
      `The underlying ${seed.category} trend keeps accelerating`,
      `Mainstream adoption reaches a tipping point`,
      `Incentives align to push it forward within the window`,
    ],
    historicalSimilarities: [
      {
        title: `A prior ${seed.category} shift`,
        outcome: believe > 55 ? "Came true" : "Fell short",
        detail: `A comparable ${seed.category.toLowerCase()} claim played out on a similar arc.`,
      },
      {
        title: `Consensus vs. reality`,
        outcome: believe > 60 ? "Consensus held" : "Mixed",
        detail: `Historically, beliefs this confident held up about ${Math.round(
          believe
        )}% of the time.`,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

// Placeholder for a real OpenAI-backed generation path.
export async function generateDebateWithAI(seed: BeliefSeed): Promise<Debate> {
  return generateDebate(seed);
}
