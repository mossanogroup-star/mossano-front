import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Section, SectionHeading } from "@/shared/components/Section";
import { Field, TextInput, TextArea, Select } from "@/modules/enquiry/components/Field";
import { useSubmitEnquiry } from "@/modules/enquiry/api/submitEnquiry";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { WhatsAppButton } from "@/shared/components/WhatsAppButton";
import { ApiError } from "@/shared/api/http";
import { ReferenceImageUpload } from "../components/ReferenceImageUpload";
import type { Media } from "@/shared/api/types";

/** Website §8 — the four steps, in the document's own words. */
const STEPS = [
  {
    n: "01",
    title: "Send Your Requirement",
    body: "Material, colour, thickness, quantity, budget, location and date. A reference image if you have one.",
  },
  {
    n: "02",
    title: "MOSSANO Searches",
    body: "We search our supplier network for lots that actually match — not a catalogue, a search.",
  },
  {
    n: "03",
    title: "Receive Curated Options",
    body: "Actual slab and lot photography, what is available, and realistic delivery timing.",
  },
  {
    n: "04",
    title: "Approve & Coordinate",
    body: "You choose, and MOSSANO coordinates everything that follows.",
  },
];

const schema = z
  .object({
    name: z.string().trim().min(1, "Please give your name").max(120),
    email: z.string().trim().email("Enter a valid email address").or(z.literal("")),
    phone: z.string().trim().max(24),
    company: z.string().trim().max(160),
    projectName: z.string().trim().max(160),
    material: z.string(),
    colour: z.string(),
    thickness: z.string().trim().max(60),
    quantity: z.string().trim().max(60),
    budget: z.string().trim().max(60),
    projectLocation: z.string().trim().max(160),
    requiredBy: z.string().trim().max(40),
    message: z.string().trim().max(4000),
    wantsMossanoToSelect: z.boolean(),
  })
  .refine((v) => Boolean(v.email || v.phone), {
    message: "Add an email address or a phone number so MOSSANO can reply",
    path: ["email"],
  });

type FormValues = z.infer<typeof schema>;

export function PrivateSourcingPage() {
  const { taxonomies, whatsapp } = useSiteConfig();
  const submit = useSubmitEnquiry();
  const [reference, setReference] = useState<string | null>(null);

  // Phase-1 feedback §4, Phase-3 feedback — the uploader is shared with the
  // stone enquiry form now. See ReferenceImageUpload.
  const [referenceImages, setReferenceImages] = useState<Media[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      projectName: "",
      material: "",
      colour: "",
      thickness: "",
      quantity: "",
      budget: "",
      projectLocation: "",
      requiredBy: "",
      message: "",
      wantsMossanoToSelect: false,
    },
  });

  const delegating = watch("wantsMossanoToSelect");

  const onSubmit = handleSubmit(async (v) => {
    try {
      const receipt = await submit.mutateAsync({
        type: "sourcing",
        name: v.name,
        email: v.email || undefined,
        phone: v.phone || undefined,
        company: v.company || undefined,
        projectName: v.projectName || undefined,
        message: v.message || undefined,
        sourcing: {
          material: v.material || undefined,
          colour: v.colour || undefined,
          thickness: v.thickness || undefined,
          quantity: v.quantity || undefined,
          budget: v.budget || undefined,
          projectLocation: v.projectLocation || undefined,
          requiredBy: v.requiredBy || undefined,
          wantsMossanoToSelect: v.wantsMossanoToSelect,
          referenceImages: referenceImages.length
            ? referenceImages.map((image) => image.id)
            : undefined,
        },
      });
      setReference(receipt.reference);
    } catch (err) {
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

  return (
    <>
      <Section tone="dark" className="pt-28">
        <div className="max-w-2xl">
          <div className="rule" />
          <p className="label mt-4 text-ivory/55">MOSSANO Sourcing Desk</p>
          {/* Phase-1 feedback §4 — the client's own wording. */}
          <h1 className="h-display mt-2 text-ivory">Personalize Sourcing Desk</h1>
          <p className="mt-6 max-w-prose text-[1rem] leading-relaxed text-ivory/75">
            When the right stone is not on any website. Tell MOSSANO what the project needs and the
            search happens across the whole supplier network, not a catalogue.
          </p>
          <WhatsAppButton href={whatsapp.general} variant="light" className="mt-10" />
        </div>

        {/* Phase-1 feedback §4 asked for an "Our Process" section. The four
            steps below are Website §8's own process, so this heads them rather
            than adding a second one. The client's replacement copy drops into
            STEPS. */}
        <p className="label mt-20 text-ivory/55">Our Process</p>

        <ol className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.n} className="border-t border-ivory/20 pt-6">
              <p className="font-display text-[1.5rem] text-brass-light">{step.n}</p>
              <h2 className="mt-3 font-display text-[1rem] uppercase tracking-wide text-ivory">
                {step.title}
              </h2>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ivory/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="requirement">
        <div className="max-w-3xl">
          <SectionHeading
            label="Step one"
            title="Send Your Requirement"
            intro="Fill in what you know. A partial brief is still a brief — MOSSANO will come back with questions."
          />

          {reference ? (
            <div className="mt-12 border-l border-brass pl-6">
              <p className="font-display text-[1.35rem] uppercase tracking-wide">
                Requirement received
              </p>
              <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
                Your reference is <span className="text-ink">{reference}</span>. MOSSANO will search
                and come back with options and actual photography.
              </p>
              <WhatsAppButton href={whatsapp.general} className="mt-8" variant="outline" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-12" noValidate>
              <div className="grid gap-x-8 sm:grid-cols-2">
                <Field label="Name" htmlFor="s-name" required error={errors.name?.message}>
                  <TextInput id="s-name" autoComplete="name" {...register("name")} />
                </Field>
                <Field label="Company" htmlFor="s-company" error={errors.company?.message}>
                  <TextInput id="s-company" autoComplete="organization" {...register("company")} />
                </Field>
                <Field
                  label="Email"
                  htmlFor="s-email"
                  error={errors.email?.message}
                  hint="Email or phone — at least one"
                >
                  <TextInput
                    id="s-email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                  />
                </Field>
                <Field label="Phone" htmlFor="s-phone" error={errors.phone?.message}>
                  <TextInput id="s-phone" type="tel" autoComplete="tel" {...register("phone")} />
                </Field>
              </div>

              <p className="label mt-10 border-t border-ivory-dark pt-8">The requirement</p>

              <div className="mt-6 grid gap-x-8 sm:grid-cols-2">
                <Field label="Material" htmlFor="s-material">
                  <Select id="s-material" {...register("material")}>
                    <option value="">No preference</option>
                    {(taxonomies?.materials ?? []).map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Colour" htmlFor="s-colour">
                  <Select id="s-colour" {...register("colour")}>
                    <option value="">No preference</option>
                    {(taxonomies?.colours ?? []).map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                {/* Free text, not a picker: customers say "20mm", "2cm" and
                    "18–20mm", and forcing one of those loses information. */}
                <Field label="Thickness" htmlFor="s-thickness" hint="e.g. 20 mm, or 2 cm">
                  <TextInput id="s-thickness" {...register("thickness")} />
                </Field>

                <Field label="Quantity" htmlFor="s-quantity" hint="e.g. 5,000 sq ft">
                  <TextInput id="s-quantity" {...register("quantity")} />
                </Field>

                <Field label="Budget" htmlFor="s-budget" hint="Per sq ft, or for the lot">
                  <TextInput id="s-budget" {...register("budget")} />
                </Field>

                <Field label="Project location" htmlFor="s-location">
                  <TextInput id="s-location" {...register("projectLocation")} />
                </Field>

                <Field label="Project name" htmlFor="s-project">
                  <TextInput id="s-project" {...register("projectName")} />
                </Field>

                <Field label="Required by" htmlFor="s-required" hint="Approximate is fine">
                  <TextInput
                    id="s-required"
                    placeholder="e.g. within 1 month"
                    {...register("requiredBy")}
                  />
                </Field>

                <Field
                  label="Anything else"
                  htmlFor="s-message"
                  error={errors.message?.message}
                  className="sm:col-span-2"
                >
                  <TextArea id="s-message" {...register("message")} />
                </Field>
              </div>

              <div className="mt-8 border-t border-ivory-dark pt-8">
                <p className="label mb-4">Reference image</p>
                <ReferenceImageUpload
                  id="s-reference-images"
                  images={referenceImages}
                  onChange={setReferenceImages}
                />
              </div>

              {/* Website §8: "Customer Can Also Say — please select the best
                  options for my project." This is the flag that turns the brief
                  into a private selection rather than a search result. */}
              <label className="mt-6 flex cursor-pointer items-start gap-3 border border-ink/15 p-5 transition-colors hover:border-ink/40">
                <input
                  type="checkbox"
                  {...register("wantsMossanoToSelect")}
                  className="mt-1 h-3.5 w-3.5 shrink-0 appearance-none border border-ink/30 checked:border-ink checked:bg-ink"
                />
                <span>
                  <span className="font-display text-[0.9rem] uppercase tracking-wide">
                    Please select the best options for my project
                  </span>
                  <span className="mt-1.5 block text-[0.85rem] leading-relaxed text-ink-soft">
                    MOSSANO will curate a private selection for you and send a link to review it.
                  </span>
                </span>
              </label>

              {delegating && (
                <p className="mt-4 text-[0.8rem] text-brass">
                  MOSSANO will prepare a private selection and send you the link.
                </p>
              )}

              {errors.root && (
                <p className="mt-6 text-[0.8rem] text-[#b23b2e]" role="alert">
                  {errors.root.message}
                </p>
              )}

              <div className="mt-10">
                <button type="submit" className="btn-solid" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send requirement"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Section>
    </>
  );
}
