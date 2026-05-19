import type { Portfolio } from "./types/portfolio";

export async function fetchPortfolio(): Promise<Portfolio> {
  const res = await fetch("/api/portfolio");
  if (!res.ok) throw new Error("Failed to load portfolio");
  return res.json() as Promise<Portfolio>;
}

export async function submitContact(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean; message: string }> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await res.json()) as { message?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Failed to send");
  return { ok: true, message: body.message ?? "Message sent." };
}
