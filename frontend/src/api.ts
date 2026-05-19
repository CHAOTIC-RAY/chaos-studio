export interface Profile {
  name: string;
  title: string;
  tagline: string;
  links: {
    github: string;
    behance?: string;
    dribbble?: string;
  };
}

export async function fetchProfile(): Promise<Profile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json() as Promise<Profile>;
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
  const body = (await res.json()) as { ok?: boolean; message?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Failed to send message");
  return { ok: true, message: body.message ?? "Message sent." };
}
