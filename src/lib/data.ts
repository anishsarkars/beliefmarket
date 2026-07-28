import { generateDebate } from "./ai";
import type {
  Badge,
  Belief,
  Category,
  Comment,
  Market,
  Notification,
  PricePoint,
  User,
} from "./types";
import { convictionLabel } from "./utils";

function avatarFor(seed: string): string {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=111111,0d0d0d,1a1a1a`;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString();
}
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600_000).toISOString();
}
function daysAhead(n: number): string {
  return new Date(Date.now() + n * 86400_000).toISOString();
}

const BADGES: Record<string, Badge> = {
  oracle: { id: "oracle", label: "Oracle", description: "Top 1% prediction accuracy", tier: "swarm" },
  debater: { id: "debater", label: "Master Debater", description: "100+ winning challenges", tier: "gold" },
  researcher: { id: "researcher", label: "Deep Researcher", description: "Consistently high research scores", tier: "gold" },
  early: { id: "early", label: "Early Swarm", description: "Joined in the first cohort", tier: "silver" },
  streak: { id: "streak", label: "Hot Streak", description: "10 correct calls in a row", tier: "silver" },
  builder: { id: "builder", label: "Market Maker", description: "Created 25+ markets", tier: "bronze" },
};

// ── Users ──────────────────────────────────────────────────
export const users: User[] = [
  {
    id: "u1", username: "quantmaya", name: "Maya Chen", avatar: avatarFor("Maya Chen"),
    bio: "Forecaster. I turn hunches into probabilities. Calibration > vibes.",
    followers: 18420, following: 210, accuracy: 78, winRate: 71, marketsCreated: 64,
    totalWinnings: 148200, points: 512000, rank: 1, rating: "AAA",
    reputation: { research: 94, debate: 88, prediction: 91, community: 82, overall: 89 },
    badges: [BADGES.oracle, BADGES.researcher, BADGES.streak], joined: daysAgo(640),
  },
  {
    id: "u2", username: "firstprinciples", name: "Marcus Hale", avatar: avatarFor("Marcus Hale"),
    bio: "Reason from first principles or don't reason at all.",
    followers: 12980, following: 340, accuracy: 74, winRate: 68, marketsCreated: 41,
    totalWinnings: 96400, points: 388000, rank: 2, rating: "AA",
    reputation: { research: 91, debate: 84, prediction: 86, community: 79, overall: 85 },
    badges: [BADGES.researcher, BADGES.debater], joined: daysAgo(590),
  },
  {
    id: "u3", username: "thehistorian", name: "Priya Nair", avatar: avatarFor("Priya Nair"),
    bio: "History rhymes. I read the past to call the future.",
    followers: 9870, following: 180, accuracy: 72, winRate: 66, marketsCreated: 33,
    totalWinnings: 74100, points: 301000, rank: 3, rating: "AA",
    reputation: { research: 88, debate: 82, prediction: 83, community: 86, overall: 84 },
    badges: [BADGES.debater, BADGES.early], joined: daysAgo(610),
  },
  {
    id: "u4", username: "contrarian", name: "Diego Alvarez", avatar: avatarFor("Diego Alvarez"),
    bio: "If everyone agrees, someone isn't thinking. I take the other side.",
    followers: 7640, following: 90, accuracy: 69, winRate: 64, marketsCreated: 52,
    totalWinnings: 61200, points: 224000, rank: 4, rating: "A",
    reputation: { research: 76, debate: 74, prediction: 81, community: 72, overall: 76 },
    badges: [BADGES.builder, BADGES.streak], joined: daysAgo(410),
  },
  {
    id: "u5", username: "futurist", name: "Sam Whitfield", avatar: avatarFor("Sam Whitfield"),
    bio: "Techno-optimist. The future arrives faster than you think.",
    followers: 6230, following: 260, accuracy: 67, winRate: 63, marketsCreated: 28,
    totalWinnings: 52800, points: 198000, rank: 5, rating: "A",
    reputation: { research: 80, debate: 78, prediction: 77, community: 74, overall: 77 },
    badges: [BADGES.builder], joined: daysAgo(300),
  },
  {
    id: "u6", username: "skeptic", name: "Nora Kim", avatar: avatarFor("Nora Kim"),
    bio: "Extraordinary claims need extraordinary evidence. Show me.",
    followers: 5410, following: 140, accuracy: 71, winRate: 65, marketsCreated: 19,
    totalWinnings: 44300, points: 176000, rank: 6, rating: "BBB",
    reputation: { research: 79, debate: 76, prediction: 80, community: 70, overall: 76 },
    badges: [BADGES.early], joined: daysAgo(520),
  },
  {
    id: "u7", username: "factcheck", name: "Tobias Fischer", avatar: avatarFor("Tobias Fischer"),
    bio: "I read the primary sources so you don't have to.",
    followers: 4890, following: 310, accuracy: 66, winRate: 61, marketsCreated: 24,
    totalWinnings: 33900, points: 142000, rank: 7, rating: "BBB",
    reputation: { research: 82, debate: 71, prediction: 74, community: 68, overall: 74 },
    badges: [BADGES.researcher], joined: daysAgo(240),
  },
  {
    id: "u8", username: "zeitgeist", name: "Ava Robinson", avatar: avatarFor("Ava Robinson"),
    bio: "Reading the culture in real time. Vibes are data too.",
    followers: 3760, following: 400, accuracy: 63, winRate: 59, marketsCreated: 37,
    totalWinnings: 28100, points: 121000, rank: 8, rating: "BB",
    reputation: { research: 68, debate: 70, prediction: 72, community: 75, overall: 71 },
    badges: [BADGES.builder, BADGES.streak], joined: daysAgo(190),
  },
];

export const currentUser: User = {
  id: "me", username: "you", name: "You", avatar: avatarFor("belief-market-you"),
  bio: "Building conviction, one belief at a time.",
  followers: 128, following: 96, accuracy: 64, winRate: 58, marketsCreated: 3,
  totalWinnings: 4820, points: 18650, rank: 214, rating: "BB",
  reputation: { research: 61, debate: 55, prediction: 60, community: 66, overall: 60 },
  badges: [BADGES.early, BADGES.streak], joined: daysAgo(84),
};

const byId = (id: string) => users.find((u) => u.id === id)!;

// ── Price history generator ────────────────────────────────
function makeHistory(end: number, seed: number, points = 60): PricePoint[] {
  const out: PricePoint[] = [];
  let v = 50 + (seed % 20) - 10;
  const now = Date.now();
  const step = (30 * 86400_000) / points;
  let s = seed;
  for (let i = points; i >= 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const noise = (s / 233280 - 0.5) * 8;
    const drift = ((end - v) / (i + 1)) * 0.9;
    v = Math.max(4, Math.min(96, v + drift + noise));
    out.push({ t: now - i * step, yes: Math.round(v * 10) / 10 });
  }
  out[out.length - 1].yes = end;
  return out;
}

// ── Comments ───────────────────────────────────────────────
function seedComments(seed: number): Comment[] {
  const pool = [
    { u: "u2", side: "believe" as const, body: "The trend line here is undeniable. This is happening whether we like it or not.", challenge: false },
    { u: "u3", side: "neutral" as const, body: "Right direction, wrong timeline. Every shift like this took longer than the hype suggested.", challenge: false },
    { u: "u4", side: "cope" as const, body: "Every generation predicts this and it never arrives on schedule. Fade the consensus.", challenge: true, att: { type: "chart" as const, label: "Adoption S-curve" } },
    { u: "u7", side: "believe" as const, body: "Primary sources actually back this up — read past the headlines.", challenge: false, att: { type: "link" as const, label: "Source report", url: "#" } },
    { u: "u6", side: "neutral" as const, body: "Sizing my conviction small. The base rate on predictions this confident is a coin flip.", challenge: false },
  ];
  const n = 2 + (seed % 3);
  return pool.slice(0, n).map((c, i) => ({
    id: `c_${seed}_${i}`,
    author: byId(c.u),
    body: c.body,
    createdAt: hoursAgo(2 + i * 5 + (seed % 6)),
    side: c.side,
    likes: 4 + ((seed + i * 7) % 40),
    isChallenge: c.challenge,
    attachment: c.att,
  }));
}

// ── Beliefs ────────────────────────────────────────────────
interface BeliefSpec {
  id: string; title: string; prediction: string; topic: string; category: Category;
  authorId: string; days: number; horizon: string; description: string; evidence: string;
  sources: string[]; confidence: number; risks: string[]; conviction: number;
  votes: [number, number, number]; status: Belief["status"]; marketId?: string;
}

const beliefSpecs: BeliefSpec[] = [
  {
    id: "b1", title: "AI will write most of the world's code by 2030", prediction: "The majority of new production code is AI-generated",
    topic: "AI", category: "Technology", authorId: "u5", days: 1, horizon: "By 2030",
    description: "Coding assistants have gone from autocomplete to writing whole features. As models get cheaper and more capable, the default will flip: humans review and direct, models write.",
    evidence: "Assistant adoption is near-universal among developers; a rising share of merged code is AI-authored; capability keeps compounding.",
    sources: ["Developer surveys", "Assistant usage reports", "Model capability benchmarks"],
    confidence: 78, risks: ["Trust and review bottlenecks", "Regulation of AI-authored code", "Capability plateau"],
    conviction: 81, votes: [178, 41, 26], status: "market", marketId: "m1",
  },
  {
    id: "b2", title: "Remote work will remain the default for knowledge jobs", prediction: "Most knowledge roles stay remote-first",
    topic: "Remote Work", category: "Business", authorId: "u8", days: 2, horizon: "Next 3 years",
    description: "Return-to-office mandates keep colliding with worker preference and talent economics. The equilibrium is hybrid-to-remote, not a full return.",
    evidence: "Job postings advertising remote stay elevated; attrition spikes when mandates tighten; output metrics hold up.",
    sources: ["Job posting data", "Employee surveys", "Productivity studies"],
    confidence: 66, risks: ["Recession shifts leverage to employers", "Culture and mentorship concerns", "Big-company mandates"],
    conviction: 63, votes: [92, 74, 31], status: "market", marketId: "m2",
  },
  {
    id: "b3", title: "Humans will set foot on Mars before 2035", prediction: "A crewed mission lands on Mars",
    topic: "Mars", category: "Science", authorId: "u3", days: 3, horizon: "By 2035",
    description: "Launch cadence and reusable heavy-lift are advancing fast, but life support, radiation, and the long transit remain unsolved at crewed scale.",
    evidence: "Reusable heavy-lift maturing; funded Mars roadmaps exist; but no crewed deep-space life-support demo yet.",
    sources: ["Agency roadmaps", "Launch cadence data", "Life-support research"],
    confidence: 52, risks: ["Life-support unsolved", "Funding and politics", "Timeline slippage is the norm"],
    conviction: 47, votes: [88, 96, 44], status: "debating",
  },
  {
    id: "b4", title: "A four-day work week will become standard this decade", prediction: "The 4-day week is mainstream for full-time work",
    topic: "4-Day Week", category: "Society", authorId: "u2", days: 4, horizon: "By 2030",
    description: "Trials keep reporting steady output with happier, healthier workers. Adoption is spreading from pilots to policy in several regions.",
    evidence: "Large pilots report maintained productivity; several governments trialing; retention improves.",
    sources: ["Pilot program results", "Government trial reports", "HR surveys"],
    confidence: 58, risks: ["Uneven across industries", "Coordination costs", "Slower than advocates hope"],
    conviction: 55, votes: [121, 88, 55], status: "open",
  },
  {
    id: "b5", title: "Streaming has permanently killed traditional cable TV", prediction: "Cable never recovers its share",
    topic: "Streaming", category: "Entertainment", authorId: "u4", days: 0, horizon: "This decade",
    description: "Cord-cutting is structural, not cyclical. Bundles are fragmenting, live sports is migrating, and younger viewers never subscribed in the first place.",
    evidence: "Cable subscriptions in steady multi-year decline; sports rights moving to streaming; Gen Z barely subscribes.",
    sources: ["Subscription data", "Sports rights deals", "Viewership demographics"],
    confidence: 71, risks: ["Streaming re-bundling looks like cable", "Live sports fragmentation", "Price fatigue"],
    conviction: 68, votes: [140, 51, 22], status: "market", marketId: "m5",
  },
  {
    id: "b6", title: "Electric vehicles will outsell gas cars globally by 2030", prediction: "EVs exceed 50% of new car sales worldwide",
    topic: "EVs", category: "Technology", authorId: "u5", days: 5, horizon: "By 2030",
    description: "Battery costs keep falling and model choice is exploding, but charging infrastructure and grid capacity are the real constraints outside a few leading markets.",
    evidence: "EV share rising steeply in leading markets; battery costs declining; but global charging gaps remain.",
    sources: ["Auto sales data", "Battery cost curves", "Charging infrastructure reports"],
    confidence: 61, risks: ["Charging and grid gaps", "Policy rollbacks", "Uneven global adoption"],
    conviction: 59, votes: [156, 63, 41], status: "open",
  },
  {
    id: "b7", title: "Social media does more harm than good for society", prediction: "Net societal impact is negative",
    topic: "Social Media", category: "Society", authorId: "u3", days: 6, horizon: "Ongoing",
    description: "The connective benefits are real, but so are the documented harms to attention, mental health, and shared reality. The debate is where the balance nets out.",
    evidence: "Studies link heavy use to worse well-being; misinformation spreads fast; but it also organizes and connects.",
    sources: ["Psychology research", "Platform transparency data", "Public opinion polls"],
    confidence: 63, risks: ["Hard to measure 'net' impact", "Benefits are underrated", "Effects vary by person"],
    conviction: 58, votes: [77, 63, 29], status: "open",
  },
  {
    id: "b8", title: "Nuclear power is essential to solving climate change", prediction: "Deep decarbonization requires nuclear",
    topic: "Nuclear", category: "Science", authorId: "u7", days: 7, horizon: "This generation",
    description: "Firm, carbon-free baseload is hard to replace with intermittent sources alone. Advanced reactors could change the cost and safety story — if they scale.",
    evidence: "Grids with high renewables still need firm power; advanced reactor designs advancing; public opinion warming.",
    sources: ["Grid decarbonization studies", "Reactor development reports", "Opinion polling"],
    confidence: 64, risks: ["Cost and build timelines", "Waste and public perception", "Renewables + storage improve fast"],
    conviction: 60, votes: [98, 47, 33], status: "open",
  },
  {
    id: "b9", title: "Physical books will outlast e-books", prediction: "Print stays the dominant format",
    topic: "Books", category: "Culture", authorId: "u3", days: 8, horizon: "This generation",
    description: "Despite decades of digital, print sales are resilient and even growing among younger readers. Ownership, focus, and the tactile experience keep print alive.",
    evidence: "Print sales stable or rising; Gen Z favors physical books; e-book growth has plateaued.",
    sources: ["Publisher sales data", "Reader surveys", "Retail trends"],
    confidence: 62, risks: ["Audiobook growth", "Screen-native habits", "Cost and convenience of digital"],
    conviction: 61, votes: [102, 44, 28], status: "open",
  },
  {
    id: "b10", title: "Home-field advantage is overrated in modern sports", prediction: "Its measurable effect keeps shrinking",
    topic: "Sports", category: "Sports", authorId: "u4", days: 9, horizon: "Ongoing",
    description: "With neutral officiating tech, travel comfort, and empty-stadium data from recent seasons, the once-huge home edge looks smaller than the narrative suggests.",
    evidence: "Home win rates declined post-2020; empty-crowd games showed muted effects; officiating tech reduces bias.",
    sources: ["League results data", "Empty-stadium studies", "Officiating reports"],
    confidence: 57, risks: ["Crowd effects in playoffs", "Sport-specific differences", "Travel still matters"],
    conviction: 54, votes: [71, 66, 31], status: "debating",
  },
  {
    id: "b11", title: "Most long-distance relationships don't survive the distance", prediction: "The majority end within two years",
    topic: "Relationships", category: "Relationships", authorId: "u8", days: 10, horizon: "Ongoing",
    description: "Distance strains even strong couples — reduced shared experience, mismatched timelines, and the cost of visits add up. Some thrive, but the base rate is tough.",
    evidence: "Studies show elevated breakup rates; visit frequency strongly predicts survival; timelines often diverge.",
    sources: ["Relationship research", "Longitudinal surveys", "Dating platform data"],
    confidence: 55, risks: ["Selection bias in studies", "Remote-first era changes norms", "Communication tech improves"],
    conviction: 52, votes: [64, 58, 40], status: "open",
  },
  {
    id: "b12", title: "Eight hours of sleep is non-negotiable for peak performance", prediction: "Under-sleeping reliably degrades performance",
    topic: "Sleep", category: "Health", authorId: "u6", days: 11, horizon: "Ongoing",
    description: "The 'I do fine on 5 hours' crowd is mostly running on adaptation to impairment. The evidence that sustained short sleep hurts cognition and health is strong.",
    evidence: "Sleep-restriction studies show consistent cognitive decline; long-term risks well documented; true short-sleepers are rare.",
    sources: ["Sleep research", "Cognitive performance studies", "Public health data"],
    confidence: 74, risks: ["Individual variation", "Sleep quality vs. quantity", "Overstated 8-hour rule"],
    conviction: 70, votes: [149, 33, 25], status: "open",
  },
];

export const beliefs: Belief[] = beliefSpecs.map((s, i) => {
  const debate = generateDebate({
    title: s.title, topic: s.topic, category: s.category,
    confidence: s.confidence, timeHorizon: s.horizon, description: s.description,
  });
  return {
    id: s.id, title: s.title, prediction: s.prediction, topic: s.topic, category: s.category,
    author: byId(s.authorId), createdAt: hoursAgo(s.days * 24 + i), timeHorizon: s.horizon,
    description: s.description, evidence: s.evidence, sources: s.sources, confidence: s.confidence,
    riskFactors: s.risks, conviction: s.conviction, convictionLabel: convictionLabel(s.conviction),
    votes: { believe: s.votes[0], cope: s.votes[1], neutral: s.votes[2] },
    status: s.status, debate, comments: seedComments(i + 1), marketId: s.marketId,
  };
});

// ── Markets ────────────────────────────────────────────────
interface MarketSpec {
  id: string; question: string; topic: string; category: Category; yes: number;
  closesInDays: number; closesInMin?: number; participants: number; pool: number; liquidity: number;
  source: string; criteria: string; beliefId?: string; creatorId: string; pulse?: boolean;
  status?: Market["status"];
}

const marketSpecs: MarketSpec[] = [
  {
    id: "m1", question: "Will the majority of new production code be AI-generated by 2030?", topic: "AI", category: "Technology",
    yes: 64, closesInDays: 210, participants: 4820, pool: 1240000, liquidity: 320000,
    source: "Developer ecosystem reports", criteria: "Resolves BELIEVE if credible developer surveys show >50% of new production code is AI-generated before Jan 1, 2030.",
    beliefId: "b1", creatorId: "u5",
  },
  {
    id: "m2", question: "Will remote roles stay above 20% of knowledge-job postings next year?", topic: "Remote Work", category: "Business",
    yes: 57, closesInDays: 45, participants: 2140, pool: 486000, liquidity: 128000,
    source: "Job posting aggregators", criteria: "Resolves BELIEVE if remote-advertised roles exceed 20% of knowledge-job postings at the close date.",
    beliefId: "b2", creatorId: "u8",
  },
  {
    id: "m3", question: "Will humans land on Mars before 2035?", topic: "Mars", category: "Science",
    yes: 31, closesInDays: 160, participants: 6310, pool: 2010000, liquidity: 540000,
    source: "Space agency confirmation", criteria: "Resolves BELIEVE if a crewed mission is confirmed to have landed on Mars before Jan 1, 2035.",
    beliefId: "b3", creatorId: "u4",
  },
  {
    id: "m4", question: "Will a Fortune 500 company adopt a 4-day week this year?", topic: "4-Day Week", category: "Society",
    yes: 61, closesInDays: 60, participants: 3980, pool: 902000, liquidity: 260000,
    source: "Official company announcement", criteria: "Resolves BELIEVE if a Fortune 500 company formally adopts a company-wide 4-day work week this year.",
    beliefId: "b4", creatorId: "u2",
  },
  {
    id: "m5", question: "Will tonight's headline game go to the home team?", topic: "Sports", category: "Sports",
    yes: 55, closesInDays: 0, closesInMin: 14, participants: 1210, pool: 142000, liquidity: 48000,
    source: "Official league result", criteria: "Resolves BELIEVE if the home team wins tonight's featured game.",
    creatorId: "u4", pulse: true,
  },
  {
    id: "m6", question: "Will this weekend's #1 movie stay #1 next weekend?", topic: "Box Office", category: "Entertainment",
    yes: 49, closesInDays: 6, participants: 1890, pool: 233000, liquidity: 72000,
    source: "Box office tracker", criteria: "Resolves BELIEVE if the current #1 film retains the top box-office spot next weekend.",
    creatorId: "u8", pulse: true,
  },
  {
    id: "m7", question: "Will a major new AI model launch this month?", topic: "AI", category: "Technology",
    yes: 72, closesInDays: 20, participants: 2670, pool: 351000, liquidity: 96000,
    source: "Official lab announcement", criteria: "Resolves BELIEVE if a major AI lab publicly releases a new flagship model this month.",
    creatorId: "u5", pulse: true,
  },
  {
    id: "m8", question: "Will a major climate policy be announced this month?", topic: "Climate", category: "Politics",
    yes: 44, closesInDays: 18, participants: 4410, pool: 720000, liquidity: 210000,
    source: "Government announcement", criteria: "Resolves BELIEVE if a government announces major new climate legislation or policy this month.",
    creatorId: "u3", pulse: true,
  },
  {
    id: "m9", question: "Will EVs pass 50% of new car sales globally by 2030?", topic: "EVs", category: "Technology",
    yes: 38, closesInDays: 90, participants: 5120, pool: 1130000, liquidity: 300000,
    source: "Global auto sales data", criteria: "Resolves BELIEVE if EVs exceed 50% of global new-car sales in any year before 2031.",
    beliefId: "b6", creatorId: "u5",
  },
  {
    id: "m10", question: "Will cable TV subscriptions keep declining this year?", topic: "Streaming", category: "Entertainment",
    yes: 74, closesInDays: 62, participants: 2230, pool: 398000, liquidity: 110000,
    source: "Industry subscription reports", criteria: "Resolves BELIEVE if reported cable subscriptions decline year-over-year at the close date.",
    beliefId: "b5", creatorId: "u4",
  },
];

export const markets: Market[] = marketSpecs.map((s, i) => ({
  id: s.id, question: s.question, topic: s.topic, category: s.category,
  status: (s.status ?? (s.closesInMin != null || s.closesInDays <= 1 ? "closing" : "open")) as Market["status"],
  yes: s.yes, createdAt: daysAgo(20 - i),
  closesAt: s.closesInMin != null
    ? new Date(Date.now() + s.closesInMin * 60_000).toISOString()
    : daysAhead(s.closesInDays),
  participants: s.participants, pool: s.pool, liquidity: s.liquidity,
  history: makeHistory(s.yes, (i + 3) * 97, 60),
  resolutionSource: s.source, resolutionCriteria: s.criteria, beliefId: s.beliefId,
  creator: byId(s.creatorId), comments: seedComments(i + 20), isPulse: s.pulse,
}));

// ── Notifications ──────────────────────────────────────────
export const notifications: Notification[] = [
  { id: "n1", type: "challenge", title: "Marcus challenged your belief", body: "\"Reason from first principles…\" on the 4-day work week.", createdAt: hoursAgo(1), read: false, href: "/beliefs/b4" },
  { id: "n2", type: "ai-update", title: "AI updated a probability", body: "Consensus on 'AI writes most code by 2030' moved to 64% believe.", createdAt: hoursAgo(3), read: false, href: "/beliefs/b1" },
  { id: "n3", type: "market-created", title: "Your belief became a market", body: "'Streaming killed cable' is now live for trading.", createdAt: hoursAgo(6), read: false, href: "/markets/m5" },
  { id: "n4", type: "comment", title: "New comment on your market", body: "Diego commented on the Mars 2035 market.", createdAt: hoursAgo(9), read: true, href: "/markets/m3" },
  { id: "n5", type: "resolved", title: "Market resolved", body: "'A Fortune 500 adopts a 4-day week' resolved BELIEVE. You were right.", createdAt: hoursAgo(28), read: true, href: "/markets/m4" },
  { id: "n6", type: "follower", title: "New follower", body: "Nora Kim started following you.", createdAt: hoursAgo(30), read: true, href: "/profile/skeptic" },
  { id: "n7", type: "achievement", title: "Achievement unlocked", body: "Hot Streak — 10 correct calls in a row.", createdAt: daysAgo(2), read: true },
];

export const CATEGORIES: Category[] = [
  "Society", "Technology", "Politics", "Science", "Culture", "Sports", "Economy", "Health", "Business", "Relationships", "Entertainment",
];

// ── Lookups ────────────────────────────────────────────────
export function getBelief(id: string): Belief | undefined {
  return beliefs.find((b) => b.id === id);
}
export function getMarket(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}
export function getUserByUsername(username: string): User | undefined {
  if (username === currentUser.username) return currentUser;
  return users.find((u) => u.username === username);
}
export function relatedMarkets(m: Market): Market[] {
  return markets.filter((x) => x.id !== m.id && x.category === m.category).slice(0, 3);
}
export function similarBeliefs(b: Belief): Belief[] {
  return beliefs.filter((x) => x.id !== b.id && x.category === b.category).slice(0, 3);
}
