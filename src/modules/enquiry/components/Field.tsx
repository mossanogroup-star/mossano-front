import { forwardRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Form controls in the house style, written once because the enquiry form
 * appears on five pages.
 *
 * ⚠ These must stay forwardRef. `register()` returns a `ref`, and in React 18
 * `ref` never appears in `...props` — a plain function component drops it
 * silently, react-hook-form reads nothing, and every field fails validation as
 * empty while showing the text the user typed. This broke every form once.
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

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} {...props} className={cn(inputBase, className)} />;
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea ref={ref} rows={rows} {...props} className={cn(inputBase, "resize-y", className)} />
  );
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} {...props} className={cn(inputBase, "appearance-none", className)}>
        {children}
      </select>
    );
  },
);
