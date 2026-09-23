/**
 * The API's shapes, mirroring the server's DTO files.
 *
 * Kept as hand-written types rather than generated, because the DTOs are small
 * and stable and the annotations are where the meaning lives — `origin: string
 * | null` is the type-level statement of the rule that absent client data is
 * never invented, and a generator would emit it without saying so.
 */

export type Availability = "available" | "on_hold" | "sold" | "verification_required";

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
  /** ISO 3166-1 alpha-2 — the flag is /flags/<code>.svg. */
  originCountry: string | null;
  originCountryLabel: string | null;
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
  /** Phase-3 feedback — the sub-category under White, null on any other lot. */
  whiteSubcategory: string | null;
  whiteSubcategoryLabel: string | null;
  finish: string | null;
  finishLabel: string | null;
  thicknessMm: number | null;
  slabLengthIn: number | null;
  slabWidthIn: number | null;
  /** Free text; falls back to slabLengthIn × slabWidthIn when empty. */
  approxSlabSize: string | null;
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

  // The Projects page — Phase-1 feedback §6.
  videos: Media[];
  hasVideo: boolean;
  links: Array<{ label: string; url: string }>;
  /** Phase-2 §3 — Instagram reels, embedded on the project page. */
  instagramUrls: string[];
  /** Null on an ordinary application photo; set on a landmark project. */
  sector: string | null;
  sectorLabel: string | null;
  areaSqFt: number | null;
  areaLabel: string | null;
}

/** Landmark projects, grouped the way the client's brochure groups them. */
export interface ProjectGroup {
  slug: string;
  label: string;
  projects: ApplicationProject[];
}

/** Phase-2 §1/§2 — a client logo. `logo` is null until one is uploaded. */
export interface ClientTile {
  id: string;
  name: string;
  logo: Media | null;
  website: string | null;
}

export interface ClientCategory {
  id: string;
  slug: string;
  name: string;
  clients: ClientTile[];
}

export interface AdminClientCategory {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isPublished: boolean;
  clientCount: number;
}

export interface AdminClient extends ClientTile {
  categoryId: string | null;
  logoId: string | null;
  sortOrder: number;
  isPublished: boolean;
}

/** Phase-2 §5 — a Shop by Application page's own content. */
export interface ApplicationContent {
  application: string;
  headline: string;
  description: string;
  images: Media[];
  isPublished: boolean;
}

/** Phase-3 — a Shop by Look page's own photography and copy. */
export interface LookContent {
  look: string;
  headline: string;
  description: string;
  images: Media[];
  isPublished: boolean;
}

export interface AdminApplicationProject extends ApplicationProject {
  isPublished: boolean;
  stoneIds: string[];
  imageIds: string[];
  videoIds: string[];
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
  whiteSubcategory: FacetBucket[];
  originCountry: FacetBucket[];
  finish: FacetBucket[];
  availability: FacetBucket[];
  looks: FacetBucket[];
  applications: FacetBucket[];
}

/** `state` and `postalCode` are empty for offices printed without them. */
export interface BrandLocation {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BrandConfig {
  name: string;
  wordmark: string;
  tagline: string;
  strapline: string;
  phones: string[];
  whatsappNumber: string;
  email: string;
  /** The head office — for the single-address footer and PDF. */
  address: BrandLocation;
  locations: BrandLocation[];
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
    whiteSubcategories: Array<{ slug: string; label: string }>;
    /** Generated from the flag files on the server — see countries.generated.js. */
    countries: Array<{ code: string; label: string }>;
    finishes: Array<{ slug: string; label: string }>;
    availability: Record<Availability, string>;
  };
}

export interface HeroPayload {
  /** "pinned" when HERO_STONE_CODE resolved, "ranked" when it fell back. */
  source: "pinned" | "ranked";
  stone: StoneCard;
  image: Media | null;
}

export interface HomePayload {
  /** Chosen on the server, never derived from sort order — see resolveHero. */
  hero: HeroPayload | null;
  featured: StoneCard[];
  /** True when nothing is marked featured and the newest stock is standing in. */
  isFeaturedFallback: boolean;
  currentEdit: Edit | null;
  looks: LookTile[];
  applications: ApplicationTile[];
  /** Countries the catalogue actually holds stock from, most-stocked first. */
  sourceCountries: Array<{ code: string; label: string; count: number }>;
  /** The full-screen quarry-to-project slider — steps with photography only. */
  process: ProcessStep[];
}

/** One step of the home page's process slider. */
export interface ProcessStep {
  slug: string;
  title: string;
  body: string;
  image: Media;
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

// Enquiries

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
  /** Phase-2 §7 — the chatbot's "what is it for" step. */
  application?: string;
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

// Admin session

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
