"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateDebate } from "./ai";
import {
  markets as seedMarkets,
  notifications as seedNotifications,
  beliefs as seedBeliefs,
} from "./data";
import type {
  Belief,
  Category,
  Comment,
  Market,
  Notification,
  VoteSide,
} from "./types";
import { convictionLabel } from "./utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  avatarFor,
  beliefRowToBelief,
  commentRowToComment,
  profileToUser,
  type BeliefRow,
  type CommentRow,
  type ProfileRow,
} from "@/lib/supabase/mappers";
import type { User } from "./types";

interface Position {
  marketId: string;
  side: "believe" | "cope";
  shares: number;
  avgPrice: number;
}

interface SubmitBeliefInput {
  title: string;
  prediction: string;
  topic: string;
  category: Category;
  timeHorizon: string;
  description: string;
  evidence: string;
  sources: string[];
  confidence: number;
  riskFactors: string[];
}

interface StoreState {
  beliefs: Belief[];
  markets: Market[];
  notifications: Notification[];
  positions: Position[];
  votes: Record<string, VoteSide>; // beliefId -> side
  isAuthed: boolean;
  submitBelief: (input: SubmitBeliefInput) => Promise<Belief | null>;
  voteBelief: (beliefId: string, side: VoteSide) => void;
  addBeliefComment: (
    beliefId: string,
    body: string,
    side?: VoteSide,
    isChallenge?: boolean
  ) => void;
  addMarketComment: (marketId: string, body: string) => void;
  trade: (marketId: string, side: "believe" | "cope", shares: number) => void;
  markAllRead: () => void;
  unread: number;
}

const StoreContext = createContext<StoreState | null>(null);

function requireAuth(isAuthed: boolean): boolean {
  if (!isAuthed) {
    if (typeof window !== "undefined") window.location.href = "/sign-in";
    return false;
  }
  return true;
}

/** Resolve a posting author — uses the signed-in user or silent anonymous auth. */
async function resolvePostingAuthor(
  supabase: ReturnType<typeof createClient>,
  user: User | null,
  userId: string | null
): Promise<{ author: User; authorId: string | null }> {
  if (user && userId) return { author: user, authorId: userId };

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("Anonymous sign-in failed:", error?.message);
    const guestId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest_${Date.now()}`;
    return {
      authorId: null,
      author: profileToUser({
        id: guestId,
        username: "guest",
        name: "Anonymous",
        avatar_url: avatarFor("guest"),
        bio: null,
        points: 10000,
        created_at: new Date().toISOString(),
      }),
    };
  }

  const authorId = data.user.id;

  // Profile row is created by trigger; retry briefly in case it lags.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authorId)
      .maybeSingle();

    if (profile) {
      return { author: profileToUser(profile as ProfileRow), authorId };
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  return {
    authorId,
    author: profileToUser({
      id: authorId,
      username: "guest",
      name: "Anonymous",
      avatar_url: avatarFor("guest"),
      bio: null,
      points: 10000,
      created_at: new Date().toISOString(),
    }),
  };
}

function applyVoteToBelief(
  b: Belief,
  prevSide: VoteSide | undefined,
  side: VoteSide
): Belief {
  const v = { ...b.votes };
  if (prevSide) v[prevSide] = Math.max(0, v[prevSide] - 1);
  v[side] += 1;
  const total = v.believe + v.cope + v.neutral || 1;
  const communityBelieve = (v.believe / total) * 100;
  const conviction = Math.round(
    communityBelieve * 0.4 + b.debate.consensus.believe * 0.35 + b.confidence * 0.25
  );
  return { ...b, votes: v, conviction, convictionLabel: convictionLabel(conviction) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { user, userId, isAnonymous, loading: authLoading } = useAuth();

  const [dbBeliefs, setDbBeliefs] = useState<Belief[]>([]);
  const [seedComments, setSeedComments] = useState<Record<string, Comment[]>>({});
  const [markets, setMarkets] = useState<Market[]>(seedMarkets);
  const [notifications, setNotifications] =
    useState<Notification[]>(seedNotifications);
  const [positions, setPositions] = useState<Position[]>([]);
  const [votes, setVotes] = useState<Record<string, VoteSide>>({});
  const [hydrated, setHydrated] = useState(false);

  const isAuthed = !!userId && !!user && !isAnonymous;

  // Beliefs shown = DB beliefs first, then seed demo beliefs (with any
  // real comments attached to them merged in).
  const beliefs = useMemo<Belief[]>(() => {
    const seedsWithComments = seedBeliefs.map((b) =>
      seedComments[b.id]
        ? { ...b, comments: [...seedComments[b.id], ...b.comments] }
        : b
    );
    return [...dbBeliefs, ...seedsWithComments];
  }, [dbBeliefs, seedComments]);

  // ── Load everything from Supabase ──────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: beliefRows }, { data: profileRows }, { data: commentRows }] =
      await Promise.all([
        supabase.from("beliefs").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("comments").select("*").order("created_at", { ascending: false }),
      ]);

    const profileMap = new Map(
      (profileRows as ProfileRow[] | null ?? []).map((p) => [p.id, profileToUser(p)])
    );

    // Group comments by belief id.
    const commentsByBelief: Record<string, Comment[]> = {};
    for (const c of (commentRows as CommentRow[] | null ?? [])) {
      const author = profileMap.get(c.user_id);
      if (!author) continue;
      (commentsByBelief[c.belief_id] ??= []).push(commentRowToComment(c, author));
    }

    const dbIds = new Set((beliefRows as BeliefRow[] | null ?? []).map((r) => r.id));
    const mappedBeliefs = (beliefRows as BeliefRow[] | null ?? [])
      .map((r) => {
        const author = profileMap.get(r.author_id);
        if (!author) return null;
        return beliefRowToBelief(r, author, commentsByBelief[r.id] ?? []);
      })
      .filter((b): b is Belief => b !== null);

    // Comments that belong to seed beliefs (ids not in the DB beliefs set).
    const seedCommentMap: Record<string, Comment[]> = {};
    for (const [beliefId, list] of Object.entries(commentsByBelief)) {
      if (!dbIds.has(beliefId)) seedCommentMap[beliefId] = list;
    }

    setDbBeliefs(mappedBeliefs);
    setSeedComments(seedCommentMap);
    setHydrated(true);
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading, loadData]);

  // Load the current user's votes.
  useEffect(() => {
    if (!userId) {
      setVotes({});
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("belief_votes")
        .select("belief_id, side")
        .eq("user_id", userId);
      const map: Record<string, VoteSide> = {};
      for (const v of (data as { belief_id: string; side: VoteSide }[] | null ?? [])) {
        map[v.belief_id] = v.side;
      }
      setVotes(map);
    })();
  }, [supabase, userId]);

  const pushNotification = useCallback(
    (n: Omit<Notification, "id" | "createdAt" | "read">) => {
      setNotifications((prev) => [
        {
          ...n,
          id: `n_${Date.now()}`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    },
    []
  );

  // ── Submit a belief ────────────────────────────────────────
  const submitBelief = useCallback(
    async (input: SubmitBeliefInput): Promise<Belief | null> => {
      const resolved = await resolvePostingAuthor(supabase, user, userId);
      const { author, authorId } = resolved;

      const seed = {
        title: input.title,
        topic: input.topic,
        category: input.category,
        confidence: input.confidence,
        timeHorizon: input.timeHorizon,
        description: input.description,
      };

      // Ask the NVIDIA-backed debate engine; fall back to the local engine.
      let debate;
      try {
        const res = await fetch("/api/debate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seed),
        });
        if (res.ok) {
          const json = await res.json();
          debate = json.debate;
        }
      } catch (err) {
        console.error("Debate request failed, using local engine:", err);
      }
      if (!debate) debate = generateDebate(seed);

      const conviction = Math.round(
        debate.consensus.believe * 0.4 + input.confidence * 0.35 + 55 * 0.25
      );
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `b_${Date.now()}`;

      const belief: Belief = {
        id,
        ...input,
        author,
        createdAt: new Date().toISOString(),
        conviction,
        convictionLabel: convictionLabel(conviction),
        votes: { believe: 1, cope: 0, neutral: 0 },
        status: "debating",
        debate,
        comments: [],
      };

      setDbBeliefs((prev) => [belief, ...prev]);

      // Persist when we have a real author id (signed-in or anonymous session).
      if (authorId) {
        supabase
          .from("beliefs")
          .insert({
            id,
            author_id: authorId,
            title: input.title,
            prediction: input.prediction,
            topic: input.topic,
            category: input.category,
            time_horizon: input.timeHorizon,
            description: input.description,
            evidence: input.evidence,
            sources: input.sources,
            confidence: input.confidence,
            risk_factors: input.riskFactors,
            conviction,
            conviction_label: convictionLabel(conviction),
            status: "debating",
            debate,
            believe_count: 1,
            cope_count: 0,
            neutral_count: 0,
          })
          .then(({ error }) => {
            if (error) console.error("Failed to save belief:", error.message);
          });
      }

      pushNotification({
        type: "ai-update",
        title: "AI debate generated",
        body: `7 analysts weighed in on "${input.title}". Consensus: ${debate.consensus.believe}% believe.`,
        href: `/beliefs/${belief.id}`,
      });
      return belief;
    },
    [user, userId, supabase, pushNotification]
  );

  // ── Vote ───────────────────────────────────────────────────
  const voteBelief = useCallback(
    (beliefId: string, side: VoteSide) => {
      if (!requireAuth(isAuthed) || !userId) return;

      const prevSide = votes[beliefId];
      setVotes((prev) => ({ ...prev, [beliefId]: side }));

      setDbBeliefs((prev) =>
        prev.map((b) => (b.id === beliefId ? applyVoteToBelief(b, prevSide, side) : b))
      );

      supabase
        .from("belief_votes")
        .upsert(
          { belief_id: beliefId, user_id: userId, side },
          { onConflict: "belief_id,user_id" }
        )
        .then(({ error }) => {
          if (error) console.error("Failed to save vote:", error.message);
        });
    },
    [isAuthed, userId, votes, supabase]
  );

  // ── Comment on a belief ────────────────────────────────────
  const addBeliefComment = useCallback(
    (beliefId: string, body: string, side?: VoteSide, isChallenge?: boolean) => {
      if (!requireAuth(isAuthed) || !user) return;

      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `c_${Date.now()}`;
      const comment: Comment = {
        id,
        author: user,
        body,
        createdAt: new Date().toISOString(),
        side,
        likes: 0,
        isChallenge,
      };

      const isSeed = seedBeliefs.some((b) => b.id === beliefId);
      if (isSeed) {
        setSeedComments((prev) => ({
          ...prev,
          [beliefId]: [comment, ...(prev[beliefId] ?? [])],
        }));
      } else {
        setDbBeliefs((prev) =>
          prev.map((b) =>
            b.id === beliefId ? { ...b, comments: [comment, ...b.comments] } : b
          )
        );
      }

      supabase
        .from("comments")
        .insert({
          id,
          belief_id: beliefId,
          user_id: user.id,
          body,
          side: side ?? null,
          is_challenge: !!isChallenge,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to save comment:", error.message);
        });
    },
    [isAuthed, user, supabase]
  );

  // ── Market comment (client-only demo) ──────────────────────
  const addMarketComment = useCallback(
    (marketId: string, body: string) => {
      if (!requireAuth(isAuthed) || !user) return;
      const comment: Comment = {
        id: `c_${Date.now()}`,
        author: user,
        body,
        createdAt: new Date().toISOString(),
        likes: 0,
      };
      setMarkets((prev) =>
        prev.map((m) =>
          m.id === marketId ? { ...m, comments: [comment, ...m.comments] } : m
        )
      );
    },
    [isAuthed, user]
  );

  // ── Trade (client-only demo, play-money) ───────────────────
  const trade = useCallback(
    (marketId: string, side: "believe" | "cope", shares: number) => {
      if (!requireAuth(isAuthed)) return;
      const market = markets.find((m) => m.id === marketId);
      if (!market || shares <= 0) return;
      const price = side === "believe" ? market.yes : 100 - market.yes;
      setPositions((prev) => {
        const existing = prev.find((p) => p.marketId === marketId && p.side === side);
        if (existing) {
          const totalShares = existing.shares + shares;
          const avg =
            (existing.avgPrice * existing.shares + price * shares) / totalShares;
          return prev.map((p) =>
            p === existing ? { ...p, shares: totalShares, avgPrice: avg } : p
          );
        }
        return [...prev, { marketId, side, shares, avgPrice: price }];
      });
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.id !== marketId) return m;
          const delta = Math.min(3, shares / 40) * (side === "believe" ? 1 : -1);
          const yes = Math.max(2, Math.min(98, Math.round((m.yes + delta) * 10) / 10));
          return {
            ...m,
            yes,
            pool: m.pool + shares * price,
            participants: m.participants + 1,
            history: [...m.history.slice(1), { t: Date.now(), yes }],
          };
        })
      );
    },
    [isAuthed, markets]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unread = useMemo(
    () => (hydrated ? notifications.filter((n) => !n.read).length : 0),
    [notifications, hydrated]
  );

  const value: StoreState = {
    beliefs,
    markets,
    notifications,
    positions,
    votes,
    isAuthed,
    submitBelief,
    voteBelief,
    addBeliefComment,
    addMarketComment,
    trade,
    markAllRead,
    unread,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
