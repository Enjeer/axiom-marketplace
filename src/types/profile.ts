import type { Database } from "@/integrations/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Fields a user is allowed to change on their own profile. */
export type ProfileUpdate = {
  display_name?: string | null;
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

export type AuthProvider = "email" | "google";

export type Subscription = "free" | "pro" | "enterprise";
export type UserRole = "user" | "admin";
export type ProfileStatus = "active" | "suspended" | "deleted";

export type TokenMutationResult = {
  tokens: number;
  monthly_tokens_used: number;
  total_tokens_used: number;
};
