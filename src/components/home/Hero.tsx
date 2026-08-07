"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { LogoMark } from "@/components/nav/Logo";
import { SubmitBeliefModal } from "@/components/thesis/SubmitThesisModal";
import { motion } from "framer-motion";

// Examples span every topic — beliefs about anything, not just one field.
const EXAMPLES = [
  "AI will write most of the world's code by 2030",
  "Physical books will outlast e-books",
  "Home-field advantage is overrated in modern sports",
  "The 4-day work week will become standard this decade",
  "Most long-distance relationships don't survive the distance",
  "Humans will set foot on Mars before 2035",
  "Streaming has permanently killed cable TV",
  "Eight hours of sleep is non-negotiable for peak performance",
];

export function Hero() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setExampleIdx((i) => (i + 1) % EXAMPLES.length), 3000);
    return () => clearInterval(id);
  }, []);

  const submit = () => setOpen(true);

  return (
    <section className="relative -mt-[72px] overflow-hidden">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.7]"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/45 to-background" />
      <div className="pointer-events-none absolute left-1/2 top-[-80px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[130px]" />

      <div className="container-narrow relative pt-32 pb-4 sm:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-7 flex h-14 w-14 items-center justify-center">
            <LogoMark className="h-14 w-14" />
          </div>

          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:_0_2px_24px_rgba(0,0,0,0.55)] sm:text-5xl">
            What do you believe?
          </h1>

          <div className="mt-8 w-full">
            <div className="group relative rounded-3xl border border-border bg-card p-2 transition-colors focus-within:border-primary/40">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                placeholder={EXAMPLES[exampleIdx]}
                suppressHydrationWarning
                className="max-h-40 min-h-[64px] w-full resize-none bg-transparent px-4 pt-3 pb-12 text-base text-white outline-none placeholder:text-content-secondary/60"
              />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-end">
                <button
                  onClick={submit}
                  aria-label="Submit belief"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:brightness-105 active:scale-95"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-content-secondary/80">
            Share a belief. Let the AI agents debate it.
          </p>
        </motion.div>
      </div>

      <SubmitBeliefModal
        open={open}
        onClose={() => setOpen(false)}
        initialTitle={value}
      />
    </section>
  );
}
