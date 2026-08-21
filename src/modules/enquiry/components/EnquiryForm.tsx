import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, TextInput, TextArea } from "./Field";
import { useSubmitEnquiry } from "../api/submitEnquiry";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import type { EnquiryType } from "@/shared/api/types";

/**
 * Mirrors the server's rule, and for the same reason: an enquiry MOSSANO cannot
 * reply to is not a lead. Validated on both sides so the customer finds out
 * before submitting rather than after.
 */
const schema = z
  .object({
    name: z.string().trim().min(1, "Please give your name").max(120),
    email: z.string().trim().email("Enter a valid email address").or(z.literal("")),
    phone: z.string().trim().max(24),
    company: z.string().trim().max(160),
    projectName: z.string().trim().max(160),
    requirement: z.string().trim().max(2000),
    message: z.string().trim().max(4000),
  })
  .refine((v) => Boolean(v.email || v.phone), {
    message: "Add an email address or a phone number so MOSSANO can reply",
    path: ["email"],
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  type?: EnquiryType;
  stoneSlug?: string;
  selectionToken?: string;
  editId?: string;
  /** Prefilled and shown above the fields, e.g. "MM-024 Calacatta Viola". */
  subject?: string;
  requirementLabel?: string;
  submitLabel?: string;
  className?: string;
  onSuccess?: (reference: string) => void;
}

export function EnquiryForm({
  type = "general",
  stoneSlug,
  selectionToken,
  editId,
  subject,
  requirementLabel,
  submitLabel = "Send enquiry",
  className,
  onSuccess,
}: Props) {
  const submit = useSubmitEnquiry();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      projectName: "",
      requirement: "",
      message: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const receipt = await submit.mutateAsync({
        type,
        stoneSlug,
        selectionToken,
        editId,
        ...values,
        // Empty strings would be stored as empty strings; undefined keeps the
        // record clean and matches the server's optionalText handling.
        email: values.email || undefined,
        phone: values.phone || undefined,
        company: values.company || undefined,
        projectName: values.projectName || undefined,
        requirement: values.requirement || undefined,
        message: values.message || undefined,
      });
      onSuccess?.(receipt.reference);
    } catch (err) {
      // Surface the server's field-level messages against the right inputs
      // rather than collapsing everything into one banner.
      const entries = err instanceof ApiError ? Object.entries(err.fieldErrors()) : [];
      if (entries.length) {
        entries.forEach(([key, message]) =>
          setError(key as keyof FormValues, { type: "server", message }),
        );
      } else {
        setError("root", {
          message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        });
      }
    }
  });

  if (submit.isSuccess) {
    return (
      <div className={cn("border-t border-ivory-dark pt-10", className)}>
        <div className="rule" />
        <p className="mt-4 font-display text-[1.25rem] uppercase tracking-wide">Thank you</p>
        <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
          MOSSANO has your enquiry and will be in touch. Your reference is{" "}
          <span className="text-ink">{submit.data.reference}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-1", className)} noValidate>
      {subject && (
        <div className="mb-8 border-l border-brass pl-4">
          <p className="label">Enquiring about</p>
          <p className="mt-1 font-display text-[1rem] uppercase tracking-wide">{subject}</p>
        </div>
      )}

      <div className="grid gap-x-8 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={errors.name?.message}>
          <TextInput id="name" autoComplete="name" {...register("name")} />
        </Field>

        <Field label="Company" htmlFor="company" error={errors.company?.message}>
          <TextInput id="company" autoComplete="organization" {...register("company")} />
        </Field>

        <Field
          label="Email"
          htmlFor="email"
          error={errors.email?.message}
          hint="Email or phone — at least one"
        >
          <TextInput id="email" type="email" autoComplete="email" {...register("email")} />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <TextInput id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>

        <Field
          label="Project"
          htmlFor="projectName"
          error={errors.projectName?.message}
          className="sm:col-span-2"
        >
          <TextInput id="projectName" {...register("projectName")} />
        </Field>

        {requirementLabel && (
          <Field
            label={requirementLabel}
            htmlFor="requirement"
            error={errors.requirement?.message}
            className="sm:col-span-2"
          >
            <TextInput id="requirement" {...register("requirement")} />
          </Field>
        )}

        <Field
          label="Message"
          htmlFor="message"
          error={errors.message?.message}
          className="sm:col-span-2"
        >
          <TextArea id="message" {...register("message")} />
        </Field>
      </div>

      {errors.root && (
        <p className="text-[0.8rem] text-[#b23b2e]" role="alert">
          {errors.root.message}
        </p>
      )}

      <div className="pt-4">
        <button type="submit" className="btn-solid" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
