import type { SupabaseClient } from "@supabase/supabase-js";

/** Human-readable Supabase auth errors. */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first, then sign in.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("unable to validate email")) {
    return "Enter a valid email address.";
  }
  if (lower.includes("signup is disabled")) {
    return "Sign up is disabled for this project. Enable email sign-up in Supabase.";
  }
  return message;
}

export async function getAuthSessionUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function isAnonymousUser(user: { is_anonymous?: boolean } | null): boolean {
  return user?.is_anonymous === true;
}
