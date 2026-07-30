import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type TokenInput = { userId: string; amount: number };

function validateTokenInput(input: TokenInput): TokenInput {
  if (!input || typeof input.userId !== "string" || input.userId.length < 10) {
    throw new Error("Invalid userId");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("amount must be a positive number");
  }
  return { userId: input.userId, amount: Math.floor(input.amount) };
}

function validateUserId(input: { userId: string }): { userId: string } {
  if (!input || typeof input.userId !== "string" || input.userId.length < 10) {
    throw new Error("Invalid userId");
  }
  return { userId: input.userId };
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data?.role !== "admin") throw new Error("Forbidden");
}

/** Grant tokens to a user. Admin only. */
export const addTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateTokenInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("add_tokens", {
      _user_id: data.userId,
      _amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return row;
  });

/** Deduct tokens without recording usage. Self or admin. */
export const removeTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateTokenInput)
  .handler(async ({ data, context }) => {
    if (data.userId !== context.userId) await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("remove_tokens", {
      _user_id: data.userId,
      _amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return row;
  });

/** Spend tokens and record monthly + total usage. Self or admin. */
export const incrementUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateTokenInput)
  .handler(async ({ data, context }) => {
    if (data.userId !== context.userId) await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("increment_usage", {
      _user_id: data.userId,
      _amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return row;
  });

/** Reset the monthly usage counter. Admin only. */
export const resetMonthlyUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateUserId)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("reset_monthly_usage", {
      _user_id: data.userId,
    });
    if (error) throw new Error(error.message);
    return row;
  });

/** Stamp last_login_at for the caller. */
export const touchLastLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("touch_last_login", { _user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
