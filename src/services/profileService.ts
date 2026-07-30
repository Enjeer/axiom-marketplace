import { supabase } from "@/integrations/supabase/client";
import type { ProfileRow, ProfileUpdate } from "@/types/profile";

/**
 * Client-side profile access. Every call runs through Supabase RLS with the
 * anon key, so a user can only ever read/write their own row. Privileged
 * fields (tokens, role, subscription, status, usage counters) are stripped by
 * a database trigger even if they were sent.
 */
export const profileService = {
  async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, patch: ProfileUpdate): Promise<ProfileRow> {
    const safe: ProfileUpdate = {
      display_name: patch.display_name,
      full_name: patch.full_name,
      username: patch.username,
      bio: patch.bio,
      avatar_url: patch.avatar_url,
    };
    for (const key of Object.keys(safe) as (keyof ProfileUpdate)[]) {
      if (safe[key] === undefined) delete safe[key];
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(safe)
      .eq("id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
};
