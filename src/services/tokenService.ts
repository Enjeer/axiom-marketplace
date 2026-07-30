import {
  addTokens,
  removeTokens,
  incrementUsage,
  resetMonthlyUsage,
  touchLastLogin,
} from "@/lib/tokens.functions";

/**
 * All token mutations go through server functions backed by SECURITY DEFINER
 * database functions. The browser never holds a privileged key, and the
 * database refuses to let a balance drop below zero.
 */
export const tokenService = {
  addTokens: (userId: string, amount: number) => addTokens({ data: { userId, amount } }),
  removeTokens: (userId: string, amount: number) => removeTokens({ data: { userId, amount } }),
  incrementUsage: (userId: string, amount: number) =>
    incrementUsage({ data: { userId, amount } }),
  resetMonthlyUsage: (userId: string) => resetMonthlyUsage({ data: { userId } }),
  touchLastLogin: () => touchLastLogin(),
};
