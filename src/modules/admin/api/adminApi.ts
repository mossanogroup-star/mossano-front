/**
 * The admin panel's API surface.
 *
 * Every call here passes `auth: true`, which is the single place the bearer
 * token is attached. Nothing in the public storefront imports this file, so
 * there is no path by which a public page could accidentally make an
 * authenticated request.
 */
import { api, unwrap, type ApiEnvelope } from "@/shared/api/http";
import type {
  AdminApplicationProject,
  AdminEdit,
  AdminSelection,
  AdminStone,
  Availability,
  DashboardSummary,
  EditStatus,
  Enquiry,
  EnquiryStatus,
  Media,
  Session,
  StoneCard,
  User,
} from "@/shared/api/types";

const AUTH = { auth: true } as const;

type Query = Record<string, string | number | boolean | string[] | undefined>;

export const adminApi = {
  // ── Session ──
  login: (email: string, password: string) =>
    unwrap<Session>(api.post("/auth/login", { email, password })),
  me: () => unwrap<User>(api.get("/auth/me", undefined, AUTH)),
  changePassword: (currentPassword: string, newPassword: string) =>
    unwrap(api.post("/auth/change-password", { currentPassword, newPassword }, AUTH)),

  // ── Dashboard ──
  dashboard: () => unwrap<DashboardSummary>(api.get("/dashboard", undefined, AUTH)),
  verificationQueue: () =>
    unwrap<AdminStone[]>(api.get("/dashboard/verification-queue", undefined, AUTH)),

  // ── Stones ──
  stones: (query: Query = {}) =>
    api.get<AdminStone[]>("/stones", query, AUTH) as Promise<ApiEnvelope<AdminStone[]>>,
  stoneOptions: (query: Query = {}) =>
    api.get<StoneCard[]>("/stones/options", query, AUTH) as Promise<ApiEnvelope<StoneCard[]>>,
  stone: (id: string) => unwrap<AdminStone>(api.get(`/stones/${id}`, undefined, AUTH)),
  createStone: (body: unknown) => unwrap<AdminStone>(api.post("/stones", body, AUTH)),
  updateStone: (id: string, body: unknown) =>
    unwrap<AdminStone>(api.patch(`/stones/${id}`, body, AUTH)),
  /** Admin Scope §2 — the edit the team makes from a list row. */
  setAvailability: (id: string, availability: Availability) =>
    unwrap<AdminStone>(api.patch(`/stones/${id}/availability`, { availability }, AUTH)),
  verifyStone: (id: string) => unwrap<AdminStone>(api.post(`/stones/${id}/verify`, {}, AUTH)),
  deleteStone: (id: string) => unwrap(api.delete(`/stones/${id}`, AUTH)),
  stoneFacets: () => unwrap(api.get("/stones/facets", undefined, AUTH)),

  // ── Edits ──
  edits: (query: Query = {}) =>
    api.get<AdminEdit[]>("/edits", query, AUTH) as Promise<ApiEnvelope<AdminEdit[]>>,
  edit: (id: string) => unwrap<AdminEdit>(api.get(`/edits/${id}`, undefined, AUTH)),
  createEdit: (body: unknown) => unwrap<AdminEdit>(api.post("/edits", body, AUTH)),
  updateEdit: (id: string, body: unknown) => unwrap<AdminEdit>(api.patch(`/edits/${id}`, body, AUTH)),
  setEditStatus: (id: string, status: EditStatus) =>
    unwrap<AdminEdit>(api.patch(`/edits/${id}/status`, { status }, AUTH)),
  addStonesToEdit: (id: string, stoneIds: string[]) =>
    unwrap<AdminEdit>(api.post(`/edits/${id}/stones`, { stoneIds }, AUTH)),
  removeStoneFromEdit: (id: string, stoneId: string) =>
    unwrap<AdminEdit>(api.delete(`/edits/${id}/stones/${stoneId}`, AUTH)),
  deleteEdit: (id: string) => unwrap(api.delete(`/edits/${id}`, AUTH)),

  // ── Applications ──
  applications: (query: Query = {}) =>
    api.get<AdminApplicationProject[]>("/applications", query, AUTH) as Promise<
      ApiEnvelope<AdminApplicationProject[]>
    >,
  application: (id: string) =>
    unwrap<AdminApplicationProject>(api.get(`/applications/${id}`, undefined, AUTH)),
  createApplication: (body: unknown) =>
    unwrap<AdminApplicationProject>(api.post("/applications", body, AUTH)),
  updateApplication: (id: string, body: unknown) =>
    unwrap<AdminApplicationProject>(api.patch(`/applications/${id}`, body, AUTH)),
  deleteApplication: (id: string) => unwrap(api.delete(`/applications/${id}`, AUTH)),

  // ── Enquiries ──
  enquiries: (query: Query = {}) =>
    api.get<Enquiry[]>("/enquiries", query, AUTH) as Promise<ApiEnvelope<Enquiry[]>>,
  enquiry: (id: string) => unwrap<Enquiry>(api.get(`/enquiries/${id}`, undefined, AUTH)),
  setEnquiryStatus: (id: string, status: EnquiryStatus) =>
    unwrap<Enquiry>(api.patch(`/enquiries/${id}/status`, { status }, AUTH)),
  addEnquiryNote: (id: string, body: string) =>
    unwrap<Enquiry>(api.post(`/enquiries/${id}/notes`, { body }, AUTH)),
  assignEnquiry: (id: string, assignedTo: string | null) =>
    unwrap<Enquiry>(api.patch(`/enquiries/${id}/assign`, { assignedTo }, AUTH)),

  // ── Selections ──
  selections: (query: Query = {}) =>
    api.get<AdminSelection[]>("/selections", query, AUTH) as Promise<ApiEnvelope<AdminSelection[]>>,
  selection: (id: string) => unwrap<AdminSelection>(api.get(`/selections/${id}`, undefined, AUTH)),
  createSelection: (body: unknown) => unwrap<AdminSelection>(api.post("/selections", body, AUTH)),
  updateSelection: (id: string, body: unknown) =>
    unwrap<AdminSelection>(api.patch(`/selections/${id}`, body, AUTH)),
  revokeSelection: (id: string) => unwrap<AdminSelection>(api.post(`/selections/${id}/revoke`, {}, AUTH)),
  restoreSelection: (id: string) =>
    unwrap<AdminSelection>(api.post(`/selections/${id}/restore`, {}, AUTH)),
  regenerateSelectionLink: (id: string) =>
    unwrap<AdminSelection>(api.post(`/selections/${id}/regenerate-link`, {}, AUTH)),
  deleteSelection: (id: string) => unwrap(api.delete(`/selections/${id}`, AUTH)),

  // ── Media ──
  media: (query: Query = {}) =>
    api.get<Media[]>("/media", query, AUTH) as Promise<ApiEnvelope<Media[]>>,
  /**
   * Bulk upload — the team drops a whole lot of slabs in at once. The server
   * reports per-file failures rather than losing the batch, so `meta.errors`
   * is worth surfacing.
   */
  uploadMedia: (files: File[], meta: { kind: string; alt?: string }) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    form.append("kind", meta.kind);
    if (meta.alt) form.append("alt", meta.alt);
    return api.upload<Media[]>("/media/bulk", form);
  },
  updateMedia: (id: string, body: unknown) => unwrap<Media>(api.patch(`/media/${id}`, body, AUTH)),
  deleteMedia: (id: string) => unwrap(api.delete(`/media/${id}`, AUTH)),

  // ── Team ──
  users: () => api.get<User[]>("/users", undefined, AUTH) as Promise<ApiEnvelope<User[]>>,
  createUser: (body: unknown) => unwrap<User>(api.post("/users", body, AUTH)),
  updateUser: (id: string, body: unknown) => unwrap<User>(api.patch(`/users/${id}`, body, AUTH)),
  deleteUser: (id: string) => unwrap(api.delete(`/users/${id}`, AUTH)),
};
