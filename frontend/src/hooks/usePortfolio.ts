import { useEffect, useState } from "react";
import { portfolio as staticPortfolio } from "@portfolio-data";
import type { Portfolio } from "../types/portfolio";

export function usePortfolio() {
  const [data, setData] = useState<Portfolio>(() =>
    JSON.parse(JSON.stringify(staticPortfolio)) as Portfolio
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/portfolio")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load portfolio");
        return res.json();
      })
      .then((json: Portfolio) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading: false, error };
}
