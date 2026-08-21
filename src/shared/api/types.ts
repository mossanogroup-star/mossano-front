/**
 * The API's shapes, mirroring the server's DTO files.
 *
 * Kept as hand-written types rather than generated, because the DTOs are small
 * and stable and the annotations are where the meaning lives — `origin: string
 * | null` is the type-level statement of the rule that absent client data is
 * never invented, and a generator would emit it without saying so.
 */

export type Availability =
  "available" | "on_hold" | "sold" | "verification_required";

export interface MediaSrc {
  width: number;
  url: string;
}

export interface Media {
  id: string;
  kind: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  caption: string;
  mimeType: string;
  resourceType: "image" | "video" | "raw";
  width: number | null;
  height: number | null;
  bytes: number | null;
  createdAt: string;
  srcset: MediaSrc[];
}

export interface Spec {
  label: string;
  /** "On request" where the client's catalogues do not record the value. */
  value: string;
}

export interface Taxon {
  slug: string;
  label: string | null;
}

export interface StoneWhatsapp {
  enquire: string;
  requestVideo?: string;
  reserve?: string;
}

export interface StoneCard {
  id: string;
  slug: string;
  mossanoCode: string;
  name: string;
  origin: string | null;
  colour: string | null;
  availability: Availability;
  availabilityLabel: string;
  isReservable: boolean;
  isVerifiedLot: boolean;
  verifiedLabel: string | null;
  slabCount: number | null;
  areaSqFt: number | null;
  primaryImage: Media | null;
  primaryImageUrl: string | null;
  href: string;
  whatsapp: StoneWhatsapp;
}

export interface StoneSlab {
  id: string;
  reference: string | null;
  image: Media | null;
  lengthIn: number | null;
  widthIn: number | null;
  isSold: boolean;
}

export interface Stone extends Omit<StoneCard, "whatsapp"> {
  materialLabel: string | null;
  colourLabel: string | null;
  finish: string | null;
  finishLabel: string | null;
  thicknessMm: number | null;
  slabLengthIn: number | null;
  slabWidthIn: number | null;
  material: string | null;
  looks: Taxon[];
  applications: Taxon[];
  lastVerifiedAt: string | null;
  isVerificationFresh: boolean;
  description: string;
  specs: Spec[];
  images: Media[];
  videos: Media[];
  hasVideo: boolean;
  slabs: StoneSlab[];
  isFeatured: boolean;
  whatsapp: Required<StoneWhatsapp>;
  /** Present only inside a private selection. */
  selectionNote?: string | null;
}

export interface AdminStone extends Stone {
  lotNumber: string | null;
  internalNotes: string;
  isPublished: boolean;
  imageIds: string[];
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type EditStatus = "current" | "next" | "upcoming" | "archived";

export interface EditCta {
  action: "reserve" | "prebook" | "register-interest" | "enquire";
  label: string;
}

export interface Edit {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  status: EditStatus;
  statusLabel: string;
  cta: EditCta;
  periodStart: string | null;
  coverImage: Media | null;
  images: Media[];
  href: string;
  stoneCount: number;
  stones?: StoneCard[];
}

export interface EditDetail extends Omit<Edit, "stones"> {
  stones: Stone[];
}

export interface AdminEdit extends Edit {
  isPublished: boolean;
  stoneIds: string[];
  imageIds: string[];
  coverImageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LookTile {
  slug: string;
  label: string;
  count: number;
  isEmpty: boolean;
  href: string;
  image: string | null;
  imageAlt: string | null;
}

export interface ApplicationTile {
  slug: string;
  label: string;
  projectCount: number;
  stoneCount: number;
  href: string;
  isEmpty: boolean;
}

export interface ApplicationProject {
  id: string;
  slug: string;
  title: string;
  application: string;
  applicationLabel: string | null;
  projectName: string | null;
  location: string | null;
  architect: string | null;
  description: string;
  coverImage: Media | null;
  images: Media[];
  isFeatured: boolean;
  href: string;
  stones?: StoneCard[];
  stoneCount: number;
}

export interface AdminApplicationProject extends ApplicationProject {
  isPublished: boolean;
  stoneIds: string[];
  imageIds: string[];
  coverImageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacetBucket {
  value: string;
  count: number;
}

export interface StoneFacets {
  material: FacetBucket[];
  colour: FacetBucket[];
  finish: FacetBucket[];
  availability: FacetBucket[];
  looks: FacetBucket[];
  applications: FacetBucket[];
  origin: FacetBucket[];
}

export interface BrandConfig {
  name: string;
  wordmark: string;
  tagline: string;
  strapline: string;
  phones: string[];
  whatsappNumber: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  canonicalDomain: string;
  baseUrl: string;
}

export interface SiteConfig {
  brand: BrandConfig;
  whatsapp: { general: string; number: string };
  taxonomies: {
    looks: Array<{ slug: string; label: string }>;
    applications: Array<{ slug: string; label: string }>;
    materials: Array<{ slug: string; label: string }>;
    colours: Array<{ slug: string; label: string }>;
    finishes: Array<{ slug: string; label: string }>;
    availability: Record<Availability, string>;
  };
}

export interface HomePayload {
  featured: StoneCard[];
  /** True when nothing is marked featured and the newest stock is standing in. */
  isFeaturedFallback: boolean;
  currentEdit: Edit | null;
  looks: LookTile[];
  applications: ApplicationTile[];
}

export interface StonePayload {
  stone: Stone;
  related: StoneCard[];
  appearsIn: Array<{ title: string; status: EditStatus; href: string }>;
  projects: ApplicationProject[];
}

export interface SelectionPayload {
  reference: string;
  title: string;
  customerName: string;
  projectName: string | null;
  introduction: string;
  preparedOn: string;
  expiresAt: string | null;
  images: Media[];
  stones: Stone[];
  stoneCount: number;
  whatsapp: string;
  pdfUrl: string;
}

// ── Enquiries ──────────────────────────────────────────────────────────────

export type EnquiryType =
  | "general"
  | "stone"
  | "reserve"
  | "slab_video"
  | "sourcing"
  | "prebook"
  | "register_interest"
  | "selection"
  | "chatbot";

export type EnquiryStatus =
  "new" | "contacted" | "interested" | "reserved" | "purchased" | "closed";

export interface SourcingBrief {
  material?: string;
  colour?: string;
  thickness?: string;
  quantity?: string;
  budget?: string;
  projectLocation?: string;
  requiredBy?: string;
  referenceImages?: string[];
  wantsMossanoToSelect?: boolean;
}

export interface EnquiryInput {
  type?: EnquiryType;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  projectName?: string;
  stoneSlug?: string;
  editId?: string;
  selectionToken?: string;
  requirement?: string;
  message?: string;
  sourcing?: SourcingBrief;
  sourcePath?: string;
}

export interface EnquiryReceipt {
  reference: string;
  type: EnquiryType;
  receivedAt: string;
}

export interface Enquiry {
  id: string;
  reference: string;
  type: EnquiryType;
  typeLabel: string;
  isHighIntent: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  projectName: string | null;
  stone: {
    id: string;
    name: string | null;
    slug: string | null;
    mossanoCode: string | null;
    availability: Availability | null;
    primaryImageUrl: string | null;
  } | null;
  stoneSnapshot: { mossanoCode: string; name: string } | null;
  edit: { id: string; title: string | null } | null;
  selection: { id: string; title: string | null; token: string | null } | null;
  requirement: string | null;
  message: string | null;
  sourcing: (SourcingBrief & { referenceImages: Media[] }) | null;
  status: EnquiryStatus;
  statusLabel: string;
  assignedTo: { id: string; name: string | null } | null;
  firstRespondedAt: string | null;
  notes: Array<{
    id: string;
    body: string;
    authorName: string | null;
    createdAt: string;
  }>;
  sourcePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSelection {
  id: string;
  reference: string;
  title: string;
  customerName: string;
  projectName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  introduction: string;
  items: Array<{ stoneId: string; note: string | null }>;
  stones?: Stone[];
  stoneCount: number;
  images: Media[];
  imageIds: string[];
  token: string;
  url: string;
  pdfUrl: string;
  isPublished: boolean;
  isRevoked: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  viewCount: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  notes: Array<{
    id: string;
    body: string;
    authorName: string | null;
    createdAt: string;
  }>;
  sourceEnquiry: { id: string; reference: string | null } | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Admin session ──────────────────────────────────────────────────────────

export type Role = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Session {
  token: string;
  user: User;
}

export interface DashboardSummary {
  enquiries: {
    new: number;
    pipeline: Array<{ status: EnquiryStatus; count: number }>;
    byType: Array<{ type: EnquiryType; count: number }>;
    recent: Enquiry[];
  };
  stones: {
    needsVerification: number;
    verificationStaleDays: number;
    byAvailability: Array<{ availability: Availability; count: number }>;
    total: number;
  };
  currentEdit: {
    id: string;
    title: string;
    slug: string;
    stoneCount: number;
    isPublished: boolean;
  } | null;
  selections: { active: number };
}
