export const portfolio = {
  profile: {
    name: "Ibrahim Wafig",
    tagline: "22 year old, Maldivian",
    role: "Founder of ChaosStudio.mv",
    portfolioUrl: "https://chaosstudio.mv",
    logoAlt: "Chaos Studio",
  },
  objective: {
    title: "Objective",
    body: "Graphic designer with 5+ years of experience blending creative design and marketing strategy. Skilled in crafting brand identities, digital content, and campaigns that drive engagement and align with business goals.",
  },
  softSkills: ["Committed", "Multitasking", "Flexible", "Fast Learner"],
  interests: [
    { label: "Art", emoji: "🎨" },
    { label: "AI", emoji: "👽" },
    { label: "Teaching", emoji: "📚" },
  ],
  chaosStudio: {
    title: "ChaosStudio.mv",
    tagline: "Independent creative studio",
    description:
      "Founded ChaosStudio.mv to deliver branding, social campaigns, UI concepts, and product design for Maldivian businesses and personal ventures. Work spans identity systems, campaign art direction, and full-stack product interfaces.",
    highlights: [
      "Brand identity & social kits for local clients",
      "Product design: CookXpert, Forge, FaisaMobileXYZ",
      "Campaign art direction & motion-ready assets",
      "Teaching design fundamentals alongside client work",
    ],
  },
  experience: {
    subtitle: "5+years",
    items: [
      {
        id: "rainbow",
        company: "Rainbow Enterprise",
        role: "Content Designer",
        period: "2025 - Now",
        featured: true,
        description:
          "Designed high-quality social media campaigns, focusing on dynamic visuals, price overlays, and engaging content for furniture and interior styling. Maintained brand consistency across digital touchpoints to drive customer engagement and conversion.",
        bullets: [
          "Social feeds, stories, and paid ads for furniture & homeware",
          "Price overlays, promo frames, and seasonal sale creatives",
          "Interior styling visuals aligned to Rainbow brand palette",
          "Fast-turnaround posts for launches, stock arrivals, and events",
        ],
        logo: "RE",
      },
      {
        id: "polytechnic",
        company: "Maldives Polytechnic",
        role: "Graphic Design C3 Teacher",
        period: "2025",
        description:
          "Teaches Graphic Design C3 — guiding students through Adobe workflows, layout fundamentals, branding exercises, and portfolio-ready project briefs.",
        bullets: [
          "Lesson plans for Photoshop, Illustrator, and InDesign basics",
          "Class critiques, rubrics, and practical studio assignments",
          "Student showcase materials and certification prep support",
        ],
        logo: "MP",
      },
      {
        id: "ayha",
        company: "Ayha Maldives & Digital Dive",
        role: "Graphic Designer",
        period: "2022 - 2024",
        description:
          "Produced marketing collateral, social content, and brand assets for hospitality and digital clients across the Maldives.",
        bullets: [
          "Social posts, flyers, and menu boards for Ayha Maldives",
          "Campaign visuals with Digital Dive for tourism & lifestyle brands",
          "Logo refinements, print layouts, and photo retouching",
        ],
        logo: "AD",
      },
    ],
  },
  socialPosts: {
    subtitle: "Campaign & feed highlights",
    items: [
      {
        id: "rainbow-sale",
        platform: "Instagram",
        client: "Rainbow Enterprise",
        title: "Seasonal furniture sale carousel",
        description:
          "Multi-slide promo with price overlays, product cutouts, and bold typography tuned for mobile feed readability.",
        tags: ["Carousel", "Price overlay", "Furniture"],
        accent: "purple",
      },
      {
        id: "rainbow-interior",
        platform: "Facebook",
        client: "Rainbow Enterprise",
        title: "Interior styling feature post",
        description:
          "Lifestyle-led layout pairing room sets with brand gradients and soft shadows for a premium homeware feel.",
        tags: ["Lifestyle", "Interior", "Brand"],
        accent: "pink",
      },
      {
        id: "cookxpert-launch",
        platform: "Product",
        client: "CookXpert",
        title: "App launch announcement graphic",
        description:
          "Pink–purple gradient hero with feature callouts for Chef AI, meal guides, and Android APK availability.",
        tags: ["Product", "UI promo", "AI"],
        accent: "pink",
      },
      {
        id: "chaos-brand",
        platform: "Portfolio",
        client: "ChaosStudio.mv",
        title: "Studio identity system",
        description:
          "Logo lockups, purple glass card language, and social templates reused across client decks and CV layouts.",
        tags: ["Branding", "Identity", "Glass UI"],
        accent: "purple",
      },
      {
        id: "polytechnic-class",
        platform: "Education",
        client: "Maldives Polytechnic",
        title: "C3 class showcase poster",
        description:
          "Print-ready poster compiling student work with grid-based typography and high-contrast section labels.",
        tags: ["Teaching", "Print", "Layout"],
        accent: "gold",
      },
      {
        id: "ayha-tourism",
        platform: "Instagram",
        client: "Ayha Maldives",
        title: "Resort offer story set",
        description:
          "Vertical story frames with offer badges, ocean tones, and clear CTA buttons for limited-time packages.",
        tags: ["Stories", "Tourism", "CTA"],
        accent: "teal",
      },
    ],
  },
  featuredWork: {
    subtitle: "Product Design & Web Apps",
    projects: [
      {
        id: "cookxpert",
        name: "CookXpert",
        tagline: "AI-powered recipe manager & cooking companion",
        description:
          "End-to-end product design for a cooking companion: onboarding, recipe discovery, fridge tracking, shared DB, themes, and Android packaging.",
        href: "https://cookxpert.chaoticstudio.workers.dev/",
        cta: "Open App",
        accent: "pink",
        highlights: [
          "Chef AI chat and guided cooking mode",
          "Meal guides, discovery search, and shared recipe database",
          "Fridge tracker, themes, and Android APK distribution",
        ],
        tags: [
          "CookXpert Chef AI",
          "Meal guides",
          "Shared recipe DB",
          "Fridge tracker",
          "Cooking mode",
          "Discovery & Search",
          "Themes",
          "Android APK",
        ],
      },
      {
        id: "forge",
        name: "Forge",
        tagline: "Content Scheduler & Idea Creator",
        description:
          "UI for planning posts, generating content ideas, and scheduling across channels with a dark productivity-focused interface.",
        href: "https://forge.chaoticstudio.workers.dev/",
        cta: "Try Scheduler",
        accent: "neutral",
        highlights: [
          "Content calendar and queue views",
          "Idea prompts and draft captions",
          "Channel-specific preview frames",
        ],
      },
      {
        id: "faisa",
        name: "FaisaMobileXYZ",
        tagline: "MIB App Design Concept",
        description:
          "Mobile banking concept with green accent system, card dashboards, and transfer flows designed for clarity on small screens.",
        href: "https://xd.adobe.com/view/b36c0490-3f96-4e44-b508-e7eec72ac2f4-e63f/screen/ff1f537b-4355-4368-a948-171625c7b7dc/?fullscreen&hints=off",
        cta: "View prototype",
        accent: "green",
        highlights: [
          "Dashboard & card overview screens",
          "Transfer and bill-pay flows",
          "MIB-inspired green glass components",
        ],
      },
    ],
  },
  skills: {
    subtitle: "Always Growing",
    categories: [
      {
        title: "Graphic Design",
        description: "Logo design, Branding, Photo Editing",
        tools: ["Photoshop", "Illustrator", "Lightroom", "InDesign"],
        variant: "primary",
      },
      {
        title: "Video Editing",
        tools: ["Premiere Pro", "After Effects"],
        variant: "muted",
      },
      {
        title: "Microsoft Office",
        tools: ["PowerPoint", "Word", "Excel"],
        variant: "muted",
      },
      {
        title: "UI/UX Design",
        description: "Web design, App Design",
        tools: ["Adobe XD", "Figma", "Dreamweaver"],
        variant: "primary",
      },
    ],
  },
  education: [
    {
      degree: "O'level, IGCSE Certificate",
      school: "Brightway International School",
      detail: "Science, Travel & Tourism and ICT",
      period: "2018 - 2019",
    },
    {
      degree: "A'level",
      school: "Villa International School",
      period: "2020 - 2022",
    },
    {
      degree: "Graphic Design C3",
      school: "Maldives Polytechnic",
      period: "2023",
    },
  ],
  contact: {
    email: "wafig.waheed2003@gmail.com",
    phone: "+960 9401011",
    instagram: "@xx_chaos",
    instagramUrl: "https://instagram.com/xx_chaos",
    telegramUrl: "https://t.me/xx_chaos",
    whatsappUrl: "https://wa.me/9609401011",
  },
} as const;

export type Portfolio = typeof portfolio;
