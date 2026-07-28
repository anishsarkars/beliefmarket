"use client";

import type { Debate, VoteSide } from "@/lib/types";
import { ConsensusBar, MeterBar } from "@/components/ui/Bars";
import { Avatar } from "@/components/ui/Avatar";
import { agentPersona, personaNames } from "@/lib/personas";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  History,
  LayoutGrid,
  Rocket,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const STANCE: Record<VoteSide, { label: string; cls: string; color: string }> = {
  believe: { label: "Believe", cls: "text-bullish border-bullish/20 bg-bullish/10", color: "#22C55E" },
  cope: { label: "Hood", cls: "text-bearish border-bearish/20 bg-bearish/10", color: "#EF4444" },
  neutral: { label: "Neutral", cls: "text-content-secondary border-white/10 bg-white/[0.04]", color: "#A1A1AA" },
};

export function AIDebate({ debate, title }: { debate: Debate; title: string }) {
  const roles = debate.agents.map((a) => a.role);
  return (
    <div className="space-y-8">
      <div>
        <h3 className="section-label mb-4 flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-ai" />
          The Debate · {debate.agents.length} AI analysts
        </h3>

        {roles.length > 0 && (
          <p className="mb-1 text-center text-xs text-content-secondary/50">
            Belief Market Engine added {personaNames(roles)}
          </p>
        )}

        <div className="space-y-1">
          <EngineMessage title={title} />
          {debate.agents.map((a, i) => (
            <DebateMessage key={a.id} agent={a} index={i} />
          ))}
        </div>
      </div>

      <ConsensusCard debate={debate} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InsightList
          title="Why it might not hold"
          icon={<AlertTriangle className="h-4 w-4 text-bearish" />}
          items={debate.keyRisks}
          accent="bearish"
        />
        <InsightList
          title="Why it might come true"
          icon={<Rocket className="h-4 w-4 text-bullish" />}
          items={debate.keyCatalysts}
          accent="bullish"
        />
      </div>

      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-content-secondary">
          <History className="h-4 w-4" />
          Historical Similarities
        </h3>
        <div className="space-y-3">
          {debate.historicalSimilarities.map((h, i) => {
            const good = /true|held/i.test(h.outcome);
            const bad = /short|fell/i.test(h.outcome);
            return (
              <div key={i} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-white/[0.02] p-4">
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="mt-1 text-sm text-content-secondary">{h.detail}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    good
                      ? "border-bullish/20 bg-bullish/10 text-bullish"
                      : bad
                      ? "border-bearish/20 bg-bearish/10 text-bearish"
                      : "border-white/10 bg-white/[0.04] text-content-secondary"
                  )}
                >
                  {h.outcome}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConsensusCard({ debate }: { debate: Debate }) {
  const c = debate.consensus;
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-gradient-to-b from-ai/[0.06] to-transparent px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Bot className="h-4 w-4 text-ai" />
            AI Consensus
          </h3>
          <span className="rounded-full border border-ai/20 bg-ai/10 px-2.5 py-0.5 text-xs font-semibold text-ai">
            Confidence: {c.confidence}
          </span>
        </div>
      </div>
      <div className="p-5">
        <ConsensusBar believe={c.believe} />
        <p className="mt-4 text-sm text-content-secondary">
          The swarm leans{" "}
          <span className={c.believe >= 50 ? "font-semibold text-bullish" : "font-semibold text-bearish"}>
            {c.believe >= 50 ? "believe" : "hood"}
          </span>{" "}
          with {c.confidence.toLowerCase()} confidence. Aggregated probability this belief
          proves true is <span className="font-semibold text-white">{c.probability}%</span>.
        </p>
      </div>
    </div>
  );
}

function EngineMessage({ title }: { title: string }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <LayoutGrid className="h-4 w-4 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-primary">Belief Market Engine</span>
        <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
          Let&apos;s dive into the belief that {title}. What makes it hold up — or are we
          just caught in the hype?
        </p>
      </div>
    </div>
  );
}

function DebateMessage({ agent, index }: { agent: Debate["agents"][number]; index: number }) {
  const [open, setOpen] = useState(false);
  const stance = STANCE[agent.stance];
  const persona = agentPersona(agent.role);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4) }}
      className="flex gap-3 py-3"
    >
      <Avatar src={persona.avatar} alt={persona.name} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{persona.name}</span>
          <span className="text-[11px] font-medium text-content-secondary/50">
            {agent.role}
          </span>
          <span className={cn("inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", stance.cls)}>
            {stance.label}
          </span>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
          {agent.summary}
        </p>

        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-content-secondary/70 transition-colors hover:text-white"
        >
          {open ? "Hide" : "Arguments & evidence"}
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="mt-3 rounded-xl border border-border bg-white/[0.02] p-3.5">
            <ul className="space-y-1.5">
              {agent.arguments.map((arg, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  {agent.stance === "cope" ? (
                    <ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bearish" />
                  ) : (
                    <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bullish" />
                  )}
                  <span className="text-content-secondary">{arg}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {agent.evidence.map((e, i) => (
                <span key={i} className="chip text-[11px]">
                  {e}
                </span>
              ))}
            </div>

            <div className="mt-3.5">
              <MeterBar value={agent.confidence} label="Confidence" color={stance.color} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InsightList({
  title,
  icon,
  items,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  accent: "bullish" | "bearish";
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-content-secondary">
        {icon}
        {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-content-secondary">
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                accent === "bullish" ? "bg-bullish" : "bg-bearish"
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
