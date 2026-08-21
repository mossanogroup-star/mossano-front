import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare, X, Send } from "lucide-react";
import { useSubmitEnquiry } from "@/modules/enquiry/api/submitEnquiry";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { cn } from "@/shared/lib/cn";
import { STEPS, OPENING, BROWSING_REPLY, toEnquiry, type Answers } from "../constants/script";

interface Line {
  from: "mossano" | "customer";
  text: string;
}

/**
 * The scripted assistant — Website Notes, second drop. No language model, and
 * it needs none: the answers are fixed slots, so a script is faster, free, and
 * cannot say anything MOSSANO did not write.
 *
 * Restraint is deliberate, per DESIGN.md: no auto-open, no floating bubble, no
 * notification dot inventing urgency. It sits still until it is asked for.
 */
export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ from: "mossano", text: OPENING }]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState<"lead" | "browsing" | null>(null);

  const submit = useSubmitEnquiry();
  const { whatsapp } = useSiteConfig();

  // On a stone page the lot travels with the lead, so the desk's alert names it
  // under "Product/Project" instead of arriving contextless.
  const { slug: stoneSlug } = useParams();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const step = STEPS[stepIndex];

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines, finished]);

  // Focus the field when a step needs typing, but never on the first paint of a
  // closed widget — that would scroll the page on mobile.
  useEffect(() => {
    if (open && step?.allowFreeText) inputRef.current?.focus();
  }, [open, stepIndex, step?.allowFreeText]);

  const say = (from: Line["from"], text: string) => setLines((prev) => [...prev, { from, text }]);

  async function answer(value: string) {
    const trimmed = value.trim();
    if (!trimmed || !step) return;

    const problem = step.validate?.(trimmed);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setDraft("");
    say("customer", trimmed);

    // Step one is a fork: "just browsing" ends the conversation rather than
    // creating a lead nobody asked for. A junk enquiry costs the team more than
    // a missed one here — this customer said they are not buying.
    if (step.id === "interested" && /brows/i.test(trimmed)) {
      say("mossano", BROWSING_REPLY);
      setFinished("browsing");
      return;
    }

    const next = { ...answers, [step.id]: trimmed };
    setAnswers(next);

    const following = STEPS[stepIndex + 1];
    if (following) {
      setStepIndex(stepIndex + 1);
      say("mossano", following.prompt);
      return;
    }

    // Last answer in — create the lead.
    try {
      const receipt = await submit.mutateAsync(toEnquiry(next, stoneSlug));
      say(
        "mossano",
        `Thank you. Your reference is ${receipt.reference} and the sourcing desk has it now — ` +
          `someone will be in touch shortly.`,
      );
      setFinished("lead");
    } catch {
      // The customer typed six answers; losing them to a failed request would be
      // the worst possible outcome, so hand them WhatsApp with the summary.
      say(
        "mossano",
        "Something went wrong sending that. Please message us on WhatsApp and it will reach the desk directly.",
      );
      setFinished("lead");
    }
  }

  return (
    <>
      {/* Launcher. Renders identically on the server and the client — no stored
          state, no timers — so it cannot cause a hydration mismatch. */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && lines.length === 1) {
            // Ask the first question the moment it is opened, not before.
            say("mossano", STEPS[0].prompt);
          }
        }}
        aria-expanded={open}
        aria-controls="mossano-chat"
        className={cn(
          "fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 border px-5 py-3",
          "font-sans text-[0.66rem] uppercase tracking-label transition-colors duration-200",
          open
            ? "border-ink bg-ink text-ivory"
            : "border-ink bg-ivory text-ink hover:bg-ink hover:text-ivory",
        )}
      >
        {open ? (
          <X className="h-4 w-4" strokeWidth={1.3} aria-hidden="true" />
        ) : (
          <MessageSquare className="h-4 w-4" strokeWidth={1.3} aria-hidden="true" />
        )}
        {open ? "Close" : "Sourcing desk"}
      </button>

      {open && (
        <section
          id="mossano-chat"
          role="dialog"
          aria-label="MOSSANO sourcing desk"
          className="fixed bottom-20 right-5 z-40 flex max-h-[min(32rem,70vh)] w-[min(23rem,calc(100vw-2.5rem))] flex-col border border-ink bg-ivory"
        >
          <header className="shrink-0 border-b border-ivory-dark px-5 py-4">
            <p className="wordmark text-[0.8rem]">MOSSANO</p>
            <p className="label mt-0.5">Sourcing desk</p>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
            aria-live="polite"
          >
            {lines.map((line, i) => (
              <p
                key={i}
                className={cn(
                  "max-w-[85%] px-3.5 py-2.5 text-[0.85rem] leading-relaxed",
                  line.from === "mossano" ? "bg-ivory-deep text-ink" : "ml-auto bg-ink text-ivory",
                )}
              >
                {line.text}
              </p>
            ))}

            {submit.isPending && <p className="label">Sending…</p>}
          </div>

          {/* ── Input ─────────────────────────────────────────────────── */}
          {!finished && step && (
            <div className="shrink-0 border-t border-ivory-dark px-5 py-4">
              {step.chips && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {step.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => answer(chip)}
                      disabled={submit.isPending}
                      className="border border-ink/25 px-3 py-1.5 text-[0.78rem] transition-colors hover:border-ink hover:bg-ink hover:text-ivory disabled:opacity-40"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {step.allowFreeText && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    answer(draft);
                  }}
                  className="flex items-center gap-2 border-b border-ink/20 focus-within:border-ink"
                >
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={step.placeholder}
                    inputMode={step.inputMode}
                    disabled={submit.isPending}
                    aria-label={step.prompt}
                    className="w-full bg-transparent py-2 text-[0.88rem] placeholder:text-ink-faint/70 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || submit.isPending}
                    className="shrink-0 p-1 text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" strokeWidth={1.3} />
                  </button>
                </form>
              )}

              <p
                className="mt-1.5 min-h-[1rem] text-[0.72rem] text-[#b23b2e]"
                aria-live="assertive"
              >
                {error}
              </p>
            </div>
          )}

          {finished && (
            <div className="shrink-0 border-t border-ivory-dark px-5 py-4">
              <a
                href={whatsapp.general}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa w-full"
              >
                Continue on WhatsApp
              </a>
            </div>
          )}
        </section>
      )}
    </>
  );
}
