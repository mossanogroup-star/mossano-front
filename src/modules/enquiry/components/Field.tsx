import { forwardRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Form controls, in the house style: no rounding, no fill, a hairline underline
 * that darkens on focus. Written once here because an enquiry form appears on
 * five different pages and a second set of input styles would be visible
 * immediately.
 *
 * ── These must stay forwardRef ─────────────────────────────────────────────
 * `register("email")` returns `{ name, onChange, onBlur, ref }`, and callers
 * spread it onto these components. In React 18 `ref` is not an ordinary prop:
 * it never appears in `...props`, so a plain function component silently drops
 * it. react-hook-form then has no element to read, treats every field as empty,
 * and every form fails validation with "Required" while showing the values the
 * user typed. That is exactly what happened here — silent, and identical across
 * the enquiry form, private sourcing, the stone editor and the admin login.
 */
const inputBase =
  "w-full border-0 border-b border-ink/20 bg-transparent px-0 py-2.5 font-sans text-[0.95rem] " +
  "text-ink placeholder:text-ink-faint/70 focus:border-ink focus:outline-none focus:ring-0 " +
  "transition-colors";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {/* aria-live so a validation message that appears after submit is
          announced, not just drawn. */}
      <p className="mt-1.5 min-h-[1rem] text-[0.75rem]" aria-live="polite">
        {error ? (
          <span className="text-[#b23b2e]">{error}</span>
        ) : hint ? (
          <span className="text-ink-faint">{hint}</span>
        ) : null}
      </p>
    </div>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, ...props }, ref) {
  return <input ref={ref} {...props} className={cn(inputBase, className)} />;
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...props}
      className={cn(inputBase, "resize-y", className)}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      {...props}
      className={cn(inputBase, "appearance-none", className)}
    >
      {children}
    </select>
  );
});
