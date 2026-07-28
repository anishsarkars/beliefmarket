// ─────────────────────────────────────────────────────────────
// Belief Market domain model — opinions & beliefs
// ─────────────────────────────────────────────────────────────

export type Category =
  | "Society"
  | "Technology"
  | "Politics"
  | "Science"
  | "Culture"
  | "Sports"
  | "Economy"
  | "Health"
  | "Business"
  | "Relationships"
  | "Entertainment";

export type SwarmRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B";

export type VoteSide = "believe" | "cope" | "neutral";

export type BeliefStatus = "open" | "debating" | "market" | "resolved";

export type MarketStatus = "open" | "closing" | "resolved";

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  accuracy: number; // % of resolved beliefs called correctly
  winRate: number; // % of markets won
  marketsCreated: number;
  totalWinnings: number; // points
  points: number; // current point balance
  rank: number;
  rating: SwarmRating;
  reputation: {
    research: number;
    debate: number;
    prediction: number;
    community: number;
    overall: number;
  };
  badges: Badge[];
  joined: string; // ISO
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "swarm";
}

export interface AgentVerdict {
  id: string;
  role: AgentRole;
  stance: VoteSide;
  summary: string;
  arguments: string[];
  evidence: string[];
  probability: number; // 0-100 chance the belief proves true
  confidence: number; // 0-100
}

export type AgentRole =
  | "Advocate"
  | "Skeptic"
  | "Historian"
  | "Analyst"
  | "Contrarian"
  | "Fact Checker"
  | "Ethicist";

export interface Debate {
  agents: AgentVerdict[];
  consensus: {
    believe: number; // %
    cope: number; // %
    confidence: "Low" | "Moderate" | "High" | "Very High";
    probability: number; // %
  };
  keyRisks: string[]; // reasons it might not hold
  keyCatalysts: string[]; // reasons it might come true
  historicalSimilarities: { title: string; outcome: string; detail: string }[];
  generatedAt: string;
}

export interface Comment {
  id: string;
  author: User;
  body: string;
  createdAt: string;
  side?: VoteSide;
  likes: number;
  isChallenge?: boolean;
  attachment?: { type: "chart" | "link"; label: string; url?: string };
}

export interface Belief {
  id: string;
  title: string;
  prediction: string; // the exact, resolvable claim
  topic: string; // short subject tag, e.g. "AI", "Mars"
  category: Category;
  author: User;
  createdAt: string;
  timeHorizon: string;
  description: string;
  evidence: string;
  sources: string[];
  confidence: number; // author's confidence
  riskFactors: string[];
  conviction: number; // 0-100 conviction score
  convictionLabel: string;
  votes: { believe: number; cope: number; neutral: number };
  status: BeliefStatus;
  debate: Debate;
  comments: Comment[];
  marketId?: string;
}

export interface PricePoint {
  t: number; // timestamp ms
  yes: number; // believe probability 0-100
}

export interface Order {
  id: string;
  side: "believe" | "cope";
  price: number;
  shares: number;
  user: User;
  createdAt: string;
}

export interface Market {
  id: string;
  question: string;
  topic: string;
  category: Category;
  status: MarketStatus;
  yes: number; // believe probability %
  createdAt: string;
  closesAt: string;
  participants: number;
  pool: number; // points staked
  liquidity: number; // points
  history: PricePoint[];
  resolutionSource: string;
  resolutionCriteria: string;
  beliefId?: string;
  creator: User;
  comments: Comment[];
  isPulse?: boolean;
  outcome?: "believe" | "cope";
}

export interface Notification {
  id: string;
  type:
    | "challenge"
    | "ai-update"
    | "resolved"
    | "comment"
    | "follower"
    | "market-created"
    | "achievement";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}
