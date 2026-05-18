import { useEffect, useState } from "react";
import type { Portfolio } from "../types/portfolio";

const fallback: Portfolio = {
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
  experience: {
    subtitle: "5+years",
    items: [],
  },
  featuredWork: { subtitle: "Product Design & Web Apps", projects: [] },
  skills: { subtitle: "Always Growing", categories: [] },
  education: [],
  contact: {
    email: "wafig.waheed2003@gmail.com",
    phone: "+960 9401011",
    instagram: "@xx_chaos",
    instagramUrl: "https://instagram.com/xx_chaos",
    telegramUrl: "https://t.me/xx_chaos",
    whatsappUrl: "https://wa.me/9609401011",
  },
};

export function usePortfolio() {
  const [data, setData] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/portfolio")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load portfolio");
        return res.json();
      })
      .then((json: Portfolio) => {
        if (!cancelled) setData(json);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setData(fallback);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
