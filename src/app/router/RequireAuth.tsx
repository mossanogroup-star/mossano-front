import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/modules/admin/auth/useSession";

/**
 * Gate for every admin route. Three states on purpose: no token redirects at
 * once, a token being validated waits rather than flashing the login screen at
 * someone already signed in, and a failed token redirects carrying the page
 * they wanted.
 *
 * A convenience, not the security boundary — every admin endpoint checks the
 * token server-side.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isAnonymous } = useSession();
  const location = useLocation();

  if (isAnonymous) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory">
        <p className="label">Checking your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
