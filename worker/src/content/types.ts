export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  wide?: boolean;
};

export type Deliverable = {
  text: string;
  iconKey?: string;
};

export type PackageItem = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  currency: string;
  featured?: boolean;
  iconKey: string;
  deliverables: Deliverable[];
  whatsappText: string;
  order: number;
};

export type WhyItem = {
  id: string;
  title: string;
  body: string;
  iconKey: string;
};

export type DeviceLayout =
  | "laptop"
  | "browser"
  | "tablet"
  | "phone"
  | "dual"
  | "phone-only"
  | "dual-phone";

export type FeaturedScreenshots = {
  laptop?: string;
  browser?: string;
  tablet?: string;
  phone?: string;
  phone2?: string;
};

export type FeaturedWorkItem = {
  slug: string;
  title: string;
  mod?: string;
  category?: string;
  tagline?: string;
  href: string;
  /** @deprecated use deviceLayout */
  layout?: string;
  deviceLayout?: DeviceLayout;
  appIconUrl?: string;
  screenshots?: FeaturedScreenshots;
  desktop?: string;
  mobile?: string;
  url?: string;
  order: number;
};

export type CtaLink = {
  label: string;
  href: string;
};

export type SiteContent = {
  schemaVersion: number;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
    themeColor: string;
  };
  hero: {
    wordmarkLine1: string;
    wordmarkLine2: string;
    headline: string;
    pitch: string;
    primaryCta: { label: string; shortLabel?: string };
    secondaryCta: { label: string };
    scrollCue?: { label: string };
  };
  contact: {
    whatsappUrl: string;
    telegramUrl: string;
    email: string;
    instagramHandle: string;
    instagramUrl: string;
    portfolioGalleryUrl: string;
    portfolioCtaLong: string;
    portfolioCtaShort: string;
    finaleCta?: string;
    headerMenuLabel?: string;
  };
  services: ServiceItem[];
  packages: PackageItem[];
  pricingNote: string;
  whyUs: WhyItem[];
  whyBrace?: string;
  featuredWork: FeaturedWorkItem[];
  showcaseHeadline?: string;
  footer: { line: string };
  about?: {
    title: string;
    copy: string;
    bullets: string[];
  };
  finale?: {
    tag: string;
    headline: string;
    brace: string;
    links: CtaLink[];
  };
};

export type ContentHistoryEntry = {
  savedAt: string;
  content: SiteContent;
};
