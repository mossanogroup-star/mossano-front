import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useLogin, useSession } from "../useSession";
import { Field, TextInput } from "@/modules/enquiry/components/Field";
import { ApiError } from "@/shared/api/http";

const schema = z.object({
  email: z.string().trim().email("Enter your email address"),
  password: z.string().min(1, "Enter your password"),
});

type Values = z.infer<typeof schema>;

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSession();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  // Already signed in — do not show a login form to someone who is.
  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      navigate(from, { replace: true });
    } catch (err) {
      // The server returns one message for a wrong email and a wrong password
      // alike, so the whole team cannot be enumerated. Shown against the form
      // rather than a field, for the same reason.
      setError("root", {
        message: err instanceof ApiError ? err.message : "Could not sign in. Please try again.",
      });
    }
  });

  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-6">
      <div className="w-full max-w-sm">
        <div className="rule" />
        <p className="wordmark mt-5 text-[1.05rem]">MOSSANO</p>
        <h1 className="h-section mt-2">Admin</h1>

        <form onSubmit={onSubmit} className="mt-10" noValidate>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <TextInput
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              {...register("email")}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </Field>

          {errors.root && (
            <p className="mb-4 text-[0.8rem] text-[#b23b2e]" role="alert">
              {errors.root.message}
            </p>
          )}

          <button type="submit" className="btn-solid w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
