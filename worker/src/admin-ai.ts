/** Admin AI — free-tier friendly providers + image (vision) support */

export interface AdminAiEnv {
  AI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  GROQ_API_KEY?: string;
}

type Provider =
  | "google"
  | "openrouter-free"
  | "openrouter"
  | "openai"
  | "anthropic"
  | "groq";

interface TextPart {
  type: "text";
  text: string;
}

interface ImagePart {
  type: "image";
  mimeType: string;
  data: string;
}

type ContentPart = TextPart | ImagePart;

type MessageContent = string | ContentPart[] | { parts: ContentPart[] };

interface ChatMessage {
  role: string;
  content: MessageContent;
}

interface ChatBody {
  provider?: Provider;
  model?: string;
  messages?: ChatMessage[];
  apiKey?: string;
}

const CORS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function envKeyForProvider(env: AdminAiEnv, provider: Provider): string | undefined {
  switch (provider) {
    case "openrouter":
    case "openrouter-free":
      return env.OPENROUTER_API_KEY || env.AI_API_KEY;
    case "openai":
      return env.OPENAI_API_KEY || env.AI_API_KEY;
    case "anthropic":
      return env.ANTHROPIC_API_KEY || env.AI_API_KEY;
    case "google":
      return env.GOOGLE_AI_API_KEY || env.AI_API_KEY;
    case "groq":
      return env.GROQ_API_KEY || env.AI_API_KEY;
    default:
      return env.AI_API_KEY;
  }
}

function flattenParts(content: MessageContent): ContentPart[] {
  if (typeof content === "string") return [{ type: "text", text: content }];
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object" && "parts" in content) return content.parts;
  return [{ type: "text", text: String(content) }];
}

function openAiMessageContent(parts: ContentPart[]): string | object[] {
  const hasImage = parts.some((p) => p.type === "image");
  if (!hasImage) {
    return parts.map((p) => (p.type === "text" ? p.text : "")).join("\n");
  }
  const blocks: object[] = [];
  for (const p of parts) {
    if (p.type === "text" && p.text) blocks.push({ type: "text", text: p.text });
    if (p.type === "image") {
      blocks.push({
        type: "image_url",
        image_url: { url: `data:${p.mimeType};base64,${p.data}` },
      });
    }
  }
  return blocks;
}

async function openAiCompatibleChat(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  const payload = messages.map((m) => ({
    role: m.role,
    content: openAiMessageContent(flattenParts(m.content)),
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages: payload, temperature: 0.3 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content || "";
}

async function anthropicChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  const system = messages.find((m) => m.role === "system");
  const systemText = system ? flattenParts(system.content).map((p) => (p.type === "text" ? p.text : "")).join("\n") : "";
  const turns = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemText,
      messages: turns.map((m) => {
        const parts = flattenParts(m.content);
        const blocks: object[] = [];
        for (const p of parts) {
          if (p.type === "text" && p.text) blocks.push({ type: "text", text: p.text });
          if (p.type === "image") {
            blocks.push({
              type: "image",
              source: {
                type: "base64",
                media_type: p.mimeType,
                data: p.data,
              },
            });
          }
        }
        return {
          role: m.role === "assistant" ? "assistant" : "user",
          content: blocks.length === 1 && blocks[0] && "text" in (blocks[0] as object) ? (blocks[0] as { text: string }).text : blocks,
        };
      }),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return data.content?.map((c) => c.text || "").join("") || "";
}

function geminiParts(parts: ContentPart[]): object[] {
  const out: object[] = [];
  for (const p of parts) {
    if (p.type === "text" && p.text) out.push({ text: p.text });
    if (p.type === "image") {
      out.push({ inline_data: { mime_type: p.mimeType, data: p.data } });
    }
  }
  return out;
}

async function googleChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  const system = messages.find((m) => m.role === "system");
  const systemText = system
    ? flattenParts(system.content)
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("\n")
    : "";

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: geminiParts(flattenParts(m.content)),
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
      contents,
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
}

async function runChat(
  provider: Provider,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  switch (provider) {
    case "openrouter":
    case "openrouter-free":
      return openAiCompatibleChat(
        "https://openrouter.ai/api/v1/chat/completions",
        apiKey,
        model,
        messages,
        {
          "HTTP-Referer": "https://portfolio.chaoticstudio.workers.dev",
          "X-Title": "Chaos Studio CMS",
        },
      );
    case "openai":
      return openAiCompatibleChat(
        "https://api.openai.com/v1/chat/completions",
        apiKey,
        model,
        messages,
      );
    case "groq":
      return openAiCompatibleChat(
        "https://api.groq.com/openai/v1/chat/completions",
        apiKey,
        model,
        messages,
      );
    case "anthropic":
      return anthropicChat(apiKey, model, messages);
    case "google":
      return googleChat(apiKey, model, messages);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function handleAdminAiChat(
  request: Request,
  env: AdminAiEnv,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS });
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const provider = (body.provider || "google") as Provider;
  const model =
    body.model?.trim() ||
    (provider === "google"
      ? "gemini-2.0-flash"
      : provider === "openrouter-free"
        ? "openrouter/free"
        : "google/gemini-2.0-flash-001");
  const messages = body.messages || [];

  const apiKey = body.apiKey?.trim() || envKeyForProvider(env, provider);
  if (!apiKey) {
    return Response.json(
      {
        error: `No API key. For free Gemini: aistudio.google.com/apikey — then paste in admin Settings.`,
      },
      { status: 401, headers: CORS },
    );
  }

  try {
    const content = await runChat(provider, apiKey, model, messages);
    return Response.json({ content }, { headers: CORS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 502, headers: CORS });
  }
}
