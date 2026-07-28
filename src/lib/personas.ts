import type { AgentRole } from "./types";

// The debate is presented as a conversation between named personas — each of the
// seven analyst roles maps to a stable name + avatar so the thread reads like a
// real room debating the belief (kicked off by the Belief Market Engine).
const NAMES: Record<AgentRole, string> = {
  Advocate: "Mason",
  Skeptic: "Victor",
  Historian: "Logan",
  Analyst: "Theo",
  Contrarian: "Ava",
  "Fact Checker": "Noah",
  Ethicist: "Elena",
};

export interface Persona {
  name: string;
  role: AgentRole;
  avatar: string;
}

export function agentPersona(role: AgentRole): Persona {
  const name = NAMES[role] ?? role;
  return {
    name,
    role,
    avatar: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(
      name
    )}&backgroundColor=1f1f1f,141414,1a1a1a`,
  };
}

export function personaNames(roles: AgentRole[]): string {
  const names = roles.map((r) => NAMES[r] ?? r);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
