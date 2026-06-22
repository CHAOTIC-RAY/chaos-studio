export interface SocialPostItem {
  id: string;
  platform: string;
  client: string;
  title: string;
  description: string;
  tags: string[];
  accent: string;
  mediaAspect?: "portrait" | "landscape" | "square";
  cardLayout?: "poster" | "media-kit";
  image?: string;
  slides?: string[];
  video?: string;
  poster?: string;
}

export interface PortfolioStats {
  subtitle: string;
  stats: {
    id: string;
    label: string;
    value: string;
    icon?: string;
  }[];
}

export interface PortfolioAwards {
  subtitle: string;
  awards: {
    id: string;
    title: string;
    organization: string;
    year: string;
    description?: string;
  }[];
}

export interface PortfolioNews {
  subtitle: string;
  news: {
    id: string;
    title: string;
    date: string;
    category: string;
    excerpt: string;
    content?: string;
  }[];
}

export interface ClientLogoWall {
  enabled: boolean;
  subtitle?: string;
  logos: {
    name: string;
    logo: string;
    alt: string;
    link?: string;
  }[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  title: string;
  contact?: string;
  packageId?: string;
}

export interface StudioStats {
  subtitle?: string;
  metrics: {
    label: string;
    value: string;
    description?: string;
  }[];
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface FeaturedWork {
  id: string;
  title: string;
  category: string;
  image: string;
  results?: string;
  link: string;
}

export interface Portfolio {
  profile: {
    name: string;
    tagline: string;
    role: string;
    portfolioUrl: string;
    logoAlt: string;
  };
  objective: { title: string; body: string };
  softSkills: string[];
  interests: { label: string; emoji: string }[];
  hero?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    secondaryCta?: string;
  };
  sections?: {
    showStats?: boolean;
    showAwards?: boolean;
    showNews?: boolean;
    showProcess?: boolean;
    newsCount?: number;
  };
  clientLogoWall?: ClientLogoWall;
  chaosStudio: {
    title: string;
    tagline: string;
    headline: string;
    pitch: string;
    description: string;
    highlights: string[];
    services: string[];
    whyUs: { title: string; body: string }[];
    pricingNote: string;
    packages: {
      id: string;
      name: string;
      tagline: string;
      price: string;
      currency: string;
      recommended?: boolean;
      features: string[];
    }[];
    studioContact: {
      instagram: string;
      instagramUrl: string;
      phones: string;
      email: string;
    };
    stats?: StudioStats;
    process?: ProcessStep[];
    testimonials?: Testimonial[];
    featuredWork?: FeaturedWork[];
  };
  gallery: {
    title: string;
    tagline: string;
    headline: string;
    pitch: string;
  };
  experience: {
    subtitle: string;
    items: {
      id: string;
      company: string;
      role: string;
      period: string;
      featured?: boolean;
      description?: string;
      bullets?: string[];
      logo: string;
    }[];
  };
  socialPosts: {
    subtitle: string;
    items: SocialPostItem[];
  };
  galleryPosts: {
    items: SocialPostItem[];
  };
  featuredWork: {
    subtitle: string;
    projects: {
      id: string;
      name: string;
      tagline: string;
      description?: string;
      href: string;
      cta: string;
      accent: string;
      highlights?: string[];
      tags?: string[];
    }[];
  };
  skills: {
    subtitle: string;
    categories: {
      title: string;
      description?: string;
      tools: string[];
      variant: string;
    }[];
  };
  education: {
    degree: string;
    school: string;
    detail?: string;
    period: string;
  }[];
  contact: {
    email: string;
    phone: string;
    instagram: string;
    instagramUrl: string;
    telegram: string;
    telegramUrl: string;
    whatsappUrl: string;
  };
}
