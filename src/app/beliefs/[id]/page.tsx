"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { similarBeliefs } from "@/lib/data";
import type { Belief } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { AIDebate } from "@/components/thesis/AIDebate";
import { WhereDoYouStand, Discussion } from "@/components/thesis/CommunityVoting";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Link2,
  Lock,
  Pin,
  ShieldAlert,
} from "lucide-react";

const MAX_CHALLENGES = 5;

const STATUS_META: Record<Belief["status"], { label: string; cls: string }> = {
  open: { label: "Open Belief", cls: "border-primary/25 bg-primary/10 text-primary" },
  debating: { label: "Active Debate", cls: "border-primary/25 bg-primary/10 text-primary" },
  market: { label: "Live Market", cls: "border-bullish/25 bg-bullish/10 text-bullish" },
  resolved: { label: "Resolved", cls: "border-white/15 bg-white/[0.06] text-content-secondary" },
};

export default function BeliefDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { beliefs } = useStore();
  const belief = beliefs.find((b) => b.id === id);

  if (!belief) {
    return (
      <div className="container-narrow py-24 text-center">
        <p className="text-content-secondary">Belief not found.</p>
        <Link href="/beliefs" className="btn-secondary mt-4 h-10 px-5">
          Back to beliefs
        </Link>
      </div>
    );
  }

  const similar = similarBeliefs(belief);

  return (
    <div className="container-narrow py-8">
      <Link
        href="/beliefs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Beliefs
      </Link>

      <div className="space-y-8">
        <PinnedBeliefCard belief={belief} />

        <AIDebate debate={belief.debate} title={belief.title} />

        <div className="border-t border-border" />

        <WhereDoYouStand belief={belief} />

        {belief.marketId && (
          <Link
            href={`/markets/${belief.marketId}`}
            className="btn-primary h-12 w-full text-base"
          >
            Trade this belief <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        <Details belief={belief} />

        <Discussion belief={belief} />

        {similar.length > 0 && (
          <div>
            <h3 className="section-label mb-3">Related beliefs</h3>
            <div className="card divide-y divide-border">
              {similar.map((s) => (
                <Link
                  key={s.id}
                  href={`/beliefs/${s.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <p className="min-w-0 truncate text-sm font-medium">{s.title}</p>
                  <span className="shrink-0 text-xs text-content-secondary">
                    {s.conviction}% conviction
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PinnedBeliefCard({ belief }: { belief: Belief }) {
  const status = STATUS_META[belief.status];
  const used = Math.min(
    belief.comments.filter((c) => c.isChallenge).length,
    MAX_CHALLENGES
  );
  const remaining = MAX_CHALLENGES - used;

  return (
    <div className="card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Pin className="h-3.5 w-3.5" /> Pinned Belief
        </div>

        <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {belief.title}
        </h1>
        <p className="mt-2 text-sm text-content-secondary">
          Being stress-tested by the Belief Market Engine.
        </p>
      </div>

      <div className="border-t border-border px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-content-secondary">
            Creator Attention · {remaining} / {MAX_CHALLENGES} challenges remaining
          </span>
          <Badge className={cn("border", status.cls)}>{status.label}</Badge>
        </div>
        <div className="mt-2 flex gap-1.5">
          {Array.from({ length: MAX_CHALLENGES }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i < remaining ? "bg-primary" : "bg-white/[0.08]"
              )}
            />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-content-secondary/60">
          <Lock className="h-3 w-3" />
          Read-only. Only the creator can challenge the agents until Attention runs out.
        </p>
      </div>
    </div>
  );
}

function Details({ belief }: { belief: Belief }) {
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-content-secondary">
          <CheckCircle2 className="h-4 w-4 text-primary" /> The Claim
        </h3>
        <p className="text-lg font-medium">{belief.prediction}</p>
        <p className="mt-3 leading-relaxed text-content-secondary">{belief.description}</p>
      </div>

      {belief.evidence && (
        <div className="card p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-content-secondary">
            <FileText className="h-4 w-4" /> Evidence
          </h3>
          <p className="leading-relaxed text-content-secondary">{belief.evidence}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {belief.sources.length > 0 && (
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-content-secondary">
              <Link2 className="h-4 w-4" /> Sources
            </h3>
            <ul className="space-y-2">
              {belief.sources.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-content-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-ai" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {belief.riskFactors.length > 0 && (
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-content-secondary">
              <ShieldAlert className="h-4 w-4 text-warning" /> Could Prove Wrong
            </h3>
            <ul className="space-y-2">
              {belief.riskFactors.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-content-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-content-secondary">
            Author Confidence
          </h3>
          <span className="font-mono text-sm font-semibold text-primary">
            {belief.confidence}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <div className="h-full rounded-full bg-primary" style={{ width: `${belief.confidence}%` }} />
        </div>
      </div>
    </div>
  );
}
