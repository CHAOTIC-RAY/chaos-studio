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
  experience: {
    subtitle: string;
    items: {
      id: string;
      company: string;
      role: string;
      period: string;
      featured?: boolean;
      description?: string;
      logo: string;
    }[];
  };
  featuredWork: {
    subtitle: string;
    projects: {
      id: string;
      name: string;
      tagline: string;
      href: string;
      cta: string;
      accent: string;
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
