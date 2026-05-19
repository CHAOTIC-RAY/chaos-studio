export interface BrandAssets {
  logo: string;
  logoMark: string;
  logoAlt: string;
}

export interface AboutAssets {
  portrait: string;
  portraitAlt: string;
  bio: string;
  skills: string[];
}

export interface MetaAssets {
  ogImage: string;
  title: string;
  description: string;
}

export interface SocialLinks {
  github: string;
  behance: string;
  dribbble: string;
  instagram?: string;
}

export interface WorkProject {
  slug: string;
  title: string;
  category: string;
  year: string;
  cover: string;
  coverHover?: string;
  coverAlt: string;
  href: string;
  featured?: boolean;
}

export interface ClientLogo {
  name: string;
  logo: string;
  logoAlt: string;
}

export interface SiteConfig {
  brand: BrandAssets;
  about: AboutAssets;
  meta: MetaAssets;
  social: SocialLinks;
  work: WorkProject[];
  clients: ClientLogo[];
}
