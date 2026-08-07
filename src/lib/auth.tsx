"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isAnonymousUser } from "@/lib/supabase/auth-flow";
import { profileToUser, type ProfileRow } from "@/lib/supabase/mappers";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null; // app-shaped profile
  userId: string | null; // auth uid
  email: string | null;
  isAnonymous: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginMockUser: (data: { email: string; name?: string; username?: string }) => User;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (authUser: AuthUser) => {
      const uid = authUser.id;
      const mail = authUser.email ?? null;
      const meta = authUser.user_metadata ?? {};

      let data: unknown = null;
      try {
        const res = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        data = res.data;
      } catch (err) {
        console.error("Profile load failed:", err);
      }

      if (data) {
        setUser(profileToUser(data as ProfileRow));
        return;
      }

      // Profile row may lag right after signup; fall back to auth metadata.
      const fallbackUsername =
        (typeof meta.username === "string" && meta.username) ||
        mail?.split("@")[0] ||
        (isAnonymousUser(authUser) ? "guest" : "you");
      const fallbackName =
        (typeof meta.name === "string" && meta.name) ||
        fallbackUsername.charAt(0).toUpperCase() + fallbackUsername.slice(1);

      setUser(
        profileToUser({
          id: uid,
          username: fallbackUsername,
          name: isAnonymousUser(authUser) ? "Anonymous" : fallbackName,
          avatar_url: null,
          bio: null,
          points: 10000,
          created_at: new Date().toISOString(),
        })
      );
    },
    [supabase]
  );

  const applyAuthUser = useCallback(
    async (authUser: AuthUser | null) => {
      if (authUser) {
        setUserId(authUser.id);
        setEmail(authUser.email ?? null);
        setIsAnonymous(isAnonymousUser(authUser));
        await loadProfile(authUser);
      } else {
        setUserId(null);
        setEmail(null);
        setIsAnonymous(false);
        setUser(null);
      }
    },
    [loadProfile]
  );

  const loginMockUser = useCallback((data: { email: string; name?: string; username?: string }): User => {
    const username = data.username || data.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
    const name = data.name || username.charAt(0).toUpperCase() + username.slice(1);
    const uid = `mock_${username}_${Date.now()}`;

    const mockUser: User = {
      id: uid,
      username,
      name,
      avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(username)}&backgroundColor=111111,0d0d0d,1a1a1a`,
      bio: "Building conviction, one belief at a time.",
      followers: 42,
      following: 12,
      accuracy: 75,
      winRate: 70,
      marketsCreated: 3,
      totalWinnings: 12500,
      points: 10000,
      rank: 88,
      rating: "A",
      reputation: { research: 82, debate: 78, prediction: 80, community: 85, overall: 81 },
      badges: [
        { id: "early", label: "Early Swarm", description: "Joined in the first cohort", tier: "silver" }
      ],
      joined: new Date().toISOString()
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("bm_mock_user", JSON.stringify(mockUser));
      localStorage.setItem("bm_mock_email", data.email);
    }

    setUser(mockUser);
    setUserId(mockUser.id);
    setEmail(data.email);
    setIsAnonymous(false);

    return mockUser;
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        await applyAuthUser(authUser);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Auth bootstrap check:", err);
    }

    // Check mock user session in localStorage
    if (typeof window !== "undefined") {
      const storedMock = localStorage.getItem("bm_mock_user");
      const storedEmail = localStorage.getItem("bm_mock_email");
      if (storedMock) {
        try {
          const parsed = JSON.parse(storedMock) as User;
          setUser(parsed);
          setUserId(parsed.id);
          setEmail(storedEmail ?? `${parsed.username}@example.com`);
          setIsAnonymous(false);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Failed to parse mock user:", e);
        }
      }
    }

    setUserId(null);
    setEmail(null);
    setIsAnonymous(false);
    setUser(null);
    setLoading(false);
  }, [supabase, applyAuthUser]);

  useEffect(() => {
    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        applyAuthUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, bootstrap, applyAuthUser]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore errors
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("bm_mock_user");
      localStorage.removeItem("bm_mock_email");
    }
    setUser(null);
    setUserId(null);
    setEmail(null);
    setIsAnonymous(false);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) await loadProfile(authUser);
    } catch {
      // ignore
    }
  }, [supabase, loadProfile]);

  const value: AuthState = {
    user,
    userId,
    email,
    isAnonymous,
    loading,
    signOut,
    refreshProfile,
    loginMockUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
