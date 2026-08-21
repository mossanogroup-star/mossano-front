import { useMutation } from "@tanstack/react-query";
import { api, unwrap, ApiError } from "@/shared/api/http";
import type { EnquiryInput, EnquiryReceipt } from "@/shared/api/types";

/**
 * The one write the storefront makes.
 *
 * `sourcePath` is filled in here rather than at each call site so the team can
 * always see which page produced an enquiry — the difference between a lead
 * from the Reserve button and one from the Contact page changes how it gets
 * answered.
 */
export function useSubmitEnquiry() {
  return useMutation<EnquiryReceipt, ApiError, EnquiryInput>({
    mutationFn: (input) =>
      unwrap<EnquiryReceipt>(
        api.post("/public/enquiries", {
          ...input,
          sourcePath:
            input.sourcePath ??
            (typeof window !== "undefined" ? window.location.pathname : undefined),
        }),
      ),
  });
}
