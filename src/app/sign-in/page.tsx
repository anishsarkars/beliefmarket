"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/nav/Logo";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, AtSign, Bot, Lock, Mail, User, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || username, username },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback`
                : undefined,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-content flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary/[0.08] to-transparent p-8 md:flex">
          <div className="pointer-events-none absolute inset-0 grid-dots opacity-50" />
          <div className="relative">
            <div className="flex items-center gap-2.5 font-semibold">
              <LogoMark />
              <span className="text-lg">Belief Market</span>
            </div>
            <p className="mt-8 text-2xl font-bold leading-tight">
              Where conviction becomes markets.
            </p>
          </div>
          <div className="relative space-y-4">
            {[
              { icon: TrendingUp, text: "Share a belief on any topic" },
              { icon: Bot, text: "7 AI analysts debate it instantly" },
              { icon: Users, text: "The swarm validates and trades it" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-content-secondary">
                <f.icon className="h-4 w-4 text-primary" />
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right auth form */}
        <div className="p-8 sm:p-10">
          <div className="md:hidden">
            <LogoMark />
          </div>

          <div className="mb-6 mt-4 flex rounded-full border border-border bg-white/[0.02] p-1 md:mt-0">
            {(["signup", "signin"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={cn(
                  "flex-1 rounded-full py-2 text-sm font-semibold transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "text-content-secondary hover:text-white"
                )}
              >
                {m === "signup" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signup" ? "Join Belief Market" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-content-secondary">
            {mode === "signup"
              ? "Create an account to share beliefs and vote."
              : "Sign in to the internet's belief network."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            {mode === "signup" && (
              <>
                <Field
                  icon={User}
                  type="text"
                  placeholder="Display name"
                  value={name}
                  onChange={setName}
                  required
                />
                <Field
                  icon={AtSign}
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(v) => setUsername(v.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                  required
                />
              </>
            )}
            <Field
              icon={Mail}
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              icon={Lock}
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={setPassword}
              required
            />

            {error && (
              <p className="rounded-xl border border-bearish/30 bg-bearish/10 px-3 py-2 text-sm text-bearish">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {info}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-1 h-11 w-full">
              {loading
                ? "Please wait…"
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-content-secondary">
            {mode === "signup" ? "Already have an account? " : "New to Belief Market? "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
            {" · "}
            <Link href="/" className="text-primary hover:underline">
              Explore as guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="input pl-10"
      />
    </div>
  );
}
