"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Slider } from "@/components/ui/Slider";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import type { Category } from "@/lib/types";
import { Bot, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const HORIZONS = ["This week", "This month", "This year", "By 2030", "By 2035", "This decade", "Ongoing"];

const AGENT_NAMES = [
  "Advocate",
  "Skeptic",
  "Historian",
  "Analyst",
  "Contrarian",
  "Fact Checker",
  "Ethicist",
];

export function SubmitBeliefModal({
  open,
  onClose,
  initialTitle = "",
}: {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
}) {
  const { submitBelief } = useStore();
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState<Category>("Technology");
  const [horizon, setHorizon] = useState("By 2030");
  const [description, setDescription] = useState("");
  const [confidence, setConfidence] = useState(65);
  const [phase, setPhase] = useState<"form" | "spawning">("form");

  const canSubmit = title.trim().length > 8;

  const reset = () => {
    setCategory("Technology"); setHorizon("By 2030");
    setDescription(""); setConfidence(65);
    setPhase("form");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase("spawning");
    const belief = await submitBelief({
      title: title.trim(),
      prediction: title.trim(),
      topic: category,
      category,
      timeHorizon: horizon,
      description: description.trim() || "No context provided.",
      evidence: "",
      sources: [],
      confidence,
      riskFactors: [],
    });
    if (!belief) {
      setPhase("form");
      return;
    }
    onClose();
    reset();
    setTitle("");
    router.push(`/beliefs/${belief.id}`);
  };

  return (
    <Modal
      open={open}
      onClose={phase === "spawning" ? () => {} : onClose}
      title={phase === "form" ? "Share a belief" : undefined}
      subtitle={
        phase === "form"
          ? "Say what you believe. The swarm will debate it."
          : undefined
      }
      className="max-w-lg"
    >
      <AnimatePresence mode="wait">
        {phase === "form" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-h-[70vh] overflow-y-auto px-6 py-5"
          >
            <Field label="Belief" required>
              <textarea
                className="input min-h-[64px] resize-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="AI will write most of the world's code by 2030"
                suppressHydrationWarning
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select
                  className="input appearance-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-card">
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Time Horizon">
                <select
                  className="input appearance-none"
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                >
                  {HORIZONS.map((h) => (
                    <option key={h} value={h} className="bg-card">
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Context" hint="Optional">
              <textarea
                className="input min-h-[70px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a line of reasoning (optional)…"
                suppressHydrationWarning
              />
            </Field>

            <Field label="Confidence" hint={`${confidence}%`}>
              <Slider value={confidence} onChange={setConfidence} min={1} max={99} />
              <div className="mt-1 flex justify-between text-[11px] text-content-secondary/60">
                <span>Hunch</span>
                <span>Certain</span>
              </div>
            </Field>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
              <p className="flex items-center gap-1.5 text-xs text-content-secondary">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                7 AI analysts will debate this instantly.
              </p>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary h-11 px-6"
              >
                Share Belief
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="spawning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center px-6 py-12 text-center"
          >
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-ai/10">
              <Bot className="h-7 w-7 text-ai" />
              <span className="absolute inset-0 animate-ping rounded-2xl bg-ai/10" />
            </div>
            <h3 className="text-lg font-semibold">Spawning AI analysts…</h3>
            <p className="mt-1 text-sm text-content-secondary">
              The swarm is reading your belief and forming positions.
            </p>
            <div className="mt-6 grid w-full max-w-sm grid-cols-1 gap-2">
              {AGENT_NAMES.map((name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.22 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.02] px-4 py-2.5 text-sm"
                >
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ai" />
                  <span className="font-medium">{name}</span>
                  <span className="ml-auto text-xs text-content-secondary">analyzing…</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="label">
          {label} {required && <span className="text-primary">*</span>}
        </label>
        {hint && <span className="text-xs text-content-secondary">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
