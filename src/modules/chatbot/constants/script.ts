import type { EnquiryInput } from "@/shared/api/types";

/**
 * The chatbot's script, as data.
 *
 * From the Website document's second drop:
 *
 *     Customer Chatbot → Interested? → Quantity? → Location? → Delivery?
 *          ↓
 *     Lead created in MongoDB
 *
 * ── Two steps the client's diagram does not show ──────────────────────────
 * Their own message template ends "Customer: [Name] … Customer contact:
 * +91 XXXXX XXXXX", so name and number have to be collected somewhere. The
 * four-step diagram never asks for them. They are added at the end, after the
 * customer has already invested four answers — asking for a phone number first
 * is what makes people close a chat widget.
 *
 * Kept as data rather than branching code so the team can reword a question,
 * change the quick replies, or drop a step without touching the component.
 */
export type StepId =
  "interested" | "quantity" | "location" | "delivery" | "name" | "phone";

export interface Step {
  id: StepId;
  /** What MOSSANO says. */
  prompt: string;
  /** Tappable answers. The customer can always type instead. */
  chips?: string[];
  /** Free text still allowed alongside the chips. */
  allowFreeText: boolean;
  placeholder?: string;
  inputMode?: "text" | "tel";
  /** Rejects the answer with this message when it returns one. */
  validate?: (value: string) => string | null;
}

export const OPENING =
  "Hello — I can pass your requirement straight to the MOSSANO sourcing desk. It takes about a minute.";

/** Chosen at step one; ends the conversation without creating a lead. */
export const BROWSING_REPLY =
  "Of course. Browse the Stone Shop whenever you like, and message us on WhatsApp if anything catches your eye.";

export const STEPS: Step[] = [
  {
    id: "interested",
    prompt: "Are you sourcing stone for a project at the moment?",
    chips: ["Yes, I am", "Just browsing"],
    allowFreeText: false,
  },
  {
    id: "quantity",
    prompt: "Roughly how much do you need?",
    chips: ["Under 1,000 sq ft", "1,000–5,000 sq ft", "5,000+ sq ft"],
    allowFreeText: true,
    placeholder: "e.g. 5000 sqft",
  },
  {
    id: "location",
    prompt: "Where is the project?",
    chips: ["Mumbai", "Delhi NCR", "Bengaluru"],
    allowFreeText: true,
    placeholder: "City or site location",
  },
  {
    id: "delivery",
    prompt: "And when do you need it on site?",
    chips: ["Within 2 weeks", "1 month", "3 months or more"],
    allowFreeText: true,
    placeholder: "e.g. 1 month",
  },
  {
    id: "name",
    prompt: "Thank you. Who should the desk ask for?",
    allowFreeText: true,
    placeholder: "Your name",
    validate: (v) =>
      v.trim().length < 2 ? "Please give a name MOSSANO can use." : null,
  },
  {
    id: "phone",
    prompt: "And a number we can reach you on?",
    allowFreeText: true,
    placeholder: "Phone number",
    inputMode: "tel",
    validate: (v) =>
      v.replace(/\D/g, "").length < 10
        ? "That number looks short — please check it."
        : null,
  },
];

export type Answers = Partial<Record<StepId, string>>;

/**
 * Maps the collected answers onto the enquiry the API already accepts.
 *
 * Quantity, location and delivery go into the sourcing brief rather than into
 * free text, so a chatbot lead is filterable and reads identically to one from
 * the Private Sourcing form — the team should not have to learn two shapes.
 */
export function toEnquiry(answers: Answers, stoneSlug?: string): EnquiryInput {
  return {
    type: "chatbot",
    name: answers.name?.trim() || "Chatbot enquiry",
    phone: answers.phone?.trim(),
    stoneSlug,
    sourcing: {
      quantity: answers.quantity,
      projectLocation: answers.location,
      requiredBy: answers.delivery,
    },
  };
}
