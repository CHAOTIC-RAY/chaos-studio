/** Admin AI — cloud providers (no Ollama). Keys via worker secrets or request body. */

export interface AdminAiEnv {
  AI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  GROQ_API_KEY?: string;
}

type Provider = "openrouter" | "openai" | "anthropic" | "google" | "groq";

interface ChatMessage {
  role: string;
  content: string;
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

async function openAiCompatibleChat(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
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
  const system = messages.find((m) => m.role === "system")?.content || "";
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
      system,
      messages: turns.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
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

async function googleChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  const system = messages.find((m) => m.role === "system")?.content;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
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

  const provider = (body.provider || "openrouter") as Provider;
  const model = body.model?.trim() || "google/gemini-2.0-flash-001";
  const messages = body.messages || [];

  const apiKey = body.apiKey?.trim() || envKeyForProvider(env, provider);
  if (!apiKey) {
    return Response.json(
      {
        error: `No API key for ${provider}. Add it in admin AI Settings, or set ${provider.toUpperCase()}_API_KEY on the worker.`,
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
