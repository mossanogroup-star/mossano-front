import { useMutation } from "@tanstack/react-query";
import { api, unwrap, ApiError } from "@/shared/api/http";
import type { Media } from "@/shared/api/types";

export interface ReferenceUploadResult {
  images: Media[];
  /** Files the server rejected individually — the rest still went through. */
  errors: Array<{ filename: string; message: string }>;
}

/**
 * Website §8's "a reference image if you have one" — Phase-1 feedback §4.
 *
 * Uploaded before the enquiry is sent, not with it: the enquiry takes Media ids,
 * and a customer who has filled in a long brief should not lose it because one
 * photograph was too large. Three at a time, images only, rate limited on the
 * server. Anything uploaded but never submitted is unreferenced and gets
 * collected by `prune:media`.
 */
export function useUploadReferenceImages() {
  return useMutation<ReferenceUploadResult, ApiError, File[]>({
    mutationFn: (files) => {
      const form = new FormData();
      for (const file of files) form.append("files", file);
      return unwrap<ReferenceUploadResult>(
        api.upload("/public/enquiries/reference-images", form, { auth: false }),
      );
    },
  });
}
