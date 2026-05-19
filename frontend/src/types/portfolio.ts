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
  chaosStudio: {
    title: string;
    tagline: string;
    description: string;
    highlights: string[];
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
    items: {
      id: string;
      platform: string;
      client: string;
      title: string;
      description: string;
      tags: string[];
      accent: string;
    }[];
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
    telegramUrl: string;
    whatsappUrl: string;
  };
}
