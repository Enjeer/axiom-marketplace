import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { tokenService } from "@/services/tokenService";

export function useTokens() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["profile", userId] });

  const spend = useMutation({
    mutationFn: (amount: number) => tokenService.incrementUsage(userId!, amount),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (amount: number) => tokenService.removeTokens(userId!, amount),
    onSuccess: invalidate,
  });

  const add = useMutation({
    mutationFn: (vars: { userId: string; amount: number }) =>
      tokenService.addTokens(vars.userId, vars.amount),
    onSuccess: invalidate,
  });

  const resetMonthly = useMutation({
    mutationFn: (targetUserId?: string) => tokenService.resetMonthlyUsage(targetUserId ?? userId!),
    onSuccess: invalidate,
  });

  return {
    tokens: profile?.tokens ?? 0,
    monthlyUsed: profile?.monthly_tokens_used ?? 0,
    totalUsed: profile?.total_tokens_used ?? 0,
    incrementUsage: spend.mutateAsync,
    removeTokens: remove.mutateAsync,
    addTokens: add.mutateAsync,
    resetMonthlyUsage: resetMonthly.mutateAsync,
    pending: spend.isPending || remove.isPending || add.isPending || resetMonthly.isPending,
  };
}
