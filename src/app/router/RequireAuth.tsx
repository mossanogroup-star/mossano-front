import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/modules/admin/auth/useSession";

/**
 * Gate for every admin route.
 *
 * The three states are distinguished on purpose. With no token at all the
 * redirect is immediate. With a token still being validated the panel waits,
 * rather than flashing the login screen at someone who is in fact signed in.
 * Only a token that fails validation sends them to log in again — carrying the
 * page they were trying to reach, so a bookmarked enquiry still opens after
 * signing in.
 *
 * This is a convenience, not the security boundary. Every admin endpoint checks
 * the token server-side; nothing here is trusted.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isAnonymous } = useSession();
  const location = useLocation();

  if (isAnonymous) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory">
        <p className="label">Checking your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
}
