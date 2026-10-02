import type { EnquiryInput } from "@/shared/api/types";

/**
 * The chatbot's script, as data so a question can be reworded without touching
 * the component. The client's flow is Interested? → Quantity? → Location? →
 * Delivery?, and name and number are added after it — their own alert template
 * needs both, and leading with a phone number closes the widget.
 */
export type StepId =
  "interested" | "application" | "quantity" | "location" | "delivery" | "name" | "phone";

/**
 * Phase-2 feedback §7 — what the stone is for. Sent as text, not as an
 * application slug: applications are now added from the admin, so a fixed slug
 * here could name one that no longer exists and the enquiry would be rejected.
 */
const APPLICATION_CHOICES = [
  "Bathroom",
  "Kitchen",
  "Reception",
  "Flooring",
  "Hotel lobby",
  "Bar",
  "Penthouse",
];

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
    id: "application",
    prompt: "What is it for?",
    chips: APPLICATION_CHOICES,
    allowFreeText: true,
    placeholder: "e.g. lobby flooring",
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
    validate: (v) => (v.trim().length < 2 ? "Please give a name MOSSANO can use." : null),
  },
  {
    id: "phone",
    prompt: "And a number we can reach you on?",
    allowFreeText: true,
    placeholder: "Phone number",
    inputMode: "tel",
    validate: (v) =>
      v.replace(/\D/g, "").length < 10 ? "That number looks short — please check it." : null,
  },
];

export type Answers = Partial<Record<StepId, string>>;

/**
 * Maps answers onto the enquiry the API already accepts. Quantity, location and
 * delivery go into the sourcing brief, not free text, so a chatbot lead reads
 identically to one from the Private Sourcing form.
 */
export function toEnquiry(answers: Answers, stoneSlug?: string): EnquiryInput {
  return {
    type: "chatbot",
    name: answers.name?.trim() || "Chatbot enquiry",
    phone: answers.phone?.trim(),
    stoneSlug,
    message: answers.application?.trim() ? `For: ${answers.application.trim()}` : undefined,
    sourcing: {
      quantity: answers.quantity,
      projectLocation: answers.location,
      requiredBy: answers.delivery,
    },
  };
}
