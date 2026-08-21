import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import { tokenStore } from "@/shared/api/http";
import type { User } from "@/shared/api/types";

/**
 * The signed-in team member.
 *
 * The token lives in localStorage, but the *session* is whatever `/auth/me`
 * says — a token that has expired, or belongs to an account since disabled,
 * must not keep the panel looking signed in. So the query is the source of
 * truth and the token is only a credential.
 */
export function useSession() {
  const hasToken = Boolean(tokenStore.get());

  const query = useQuery<User>({
    queryKey: ["session"],
    queryFn: () => adminApi.me(),
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data ?? null,
    isLoading: hasToken && query.isLoading,
    isAuthenticated: Boolean(query.data),
    /** No token at all: skip the "checking…" state and go straight to login. */
    isAnonymous: !hasToken,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminApi.login(email, password),
    onSuccess: (session) => {
      tokenStore.set(session.token);
      // Seed the cache so RequireAuth does not bounce back to the login screen
      // while /auth/me is still in flight.
      queryClient.setQueryData(["session"], session.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    tokenStore.clear();
    // Everything cached was fetched with the old token — clearing wholesale
    // stops a stale enquiry list showing to whoever signs in next.
    queryClient.clear();
  };
}
