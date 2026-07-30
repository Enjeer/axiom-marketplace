import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { profileService } from "@/services/profileService";
import type { ProfileUpdate } from "@/types/profile";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: () => profileService.getProfile(userId!),
  });

  const update = useMutation({
    mutationFn: (patch: ProfileUpdate) => profileService.updateProfile(userId!, patch),
    onSuccess: (row) => queryClient.setQueryData(["profile", userId], row),
  });

  return {
    profile: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateProfile: update.mutateAsync,
    updating: update.isPending,
  };
}
