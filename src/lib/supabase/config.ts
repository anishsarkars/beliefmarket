export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return (
    url.length > 0 &&
    !url.includes("placeholder.supabase.co") &&
    key.length > 0 &&
    key !== "placeholder-anon-key"
  );
}

export function authConfigError(): string {
  return "Authentication is not configured. Copy .env.example to .env.local and add your Supabase project URL and publishable key.";
}
