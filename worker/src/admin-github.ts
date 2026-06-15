/** Commit CMS content files to GitHub (main branch) */

const REPO = "CHAOTIC-RAY/portfolio";
const BRANCH = "main";

const CORS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export interface GithubApplyEnv {
  GITHUB_TOKEN?: string;
  CMS_GITHUB_TOKEN?: string;
}

interface FileUpdate {
  path: string;
  content: Record<string, unknown>;
}

interface ApplyBody {
  updates?: FileUpdate[];
  commitMessage?: string;
  githubToken?: string;
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function githubGetFile(path: string, token: string) {
  const url = `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return null;
  const meta = (await res.json()) as { content?: string; sha?: string };
  if (!meta.content || !meta.sha) return null;
  const binary = atob(meta.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const text = new TextDecoder().decode(bytes);
  return { content: JSON.parse(text) as Record<string, unknown>, sha: meta.sha };
}

async function githubPutFile(
  path: string,
  contentObj: Record<string, unknown>,
  message: string,
  token: string,
) {
  const existing = await githubGetFile(path, token);
  const body = {
    message,
    branch: BRANCH,
    content: utf8ToBase64(`${JSON.stringify(contentObj, null, 2)}\n`),
    ...(existing?.sha ? { sha: existing.sha } : {}),
  };
  const url = `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub ${res.status}: ${err.slice(0, 400)}`);
  }
  return res.json() as Promise<{ commit?: { html_url?: string; sha?: string } }>;
}

export async function handleGithubApply(
  request: Request,
  env: GithubApplyEnv,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS });
  }

  let body: ApplyBody;
  try {
    body = (await request.json()) as ApplyBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const token = body.githubToken?.trim() || env.CMS_GITHUB_TOKEN || env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      {
        error:
          "No GitHub token. Paste a PAT with repo scope in AI settings (ghp_…), or set CMS_GITHUB_TOKEN on the worker.",
      },
      { status: 401, headers: CORS },
    );
  }

  const updates = body.updates || [];
  if (!updates.length) {
    return Response.json({ error: "No updates to apply" }, { status: 400, headers: CORS });
  }

  const allowed = new Set([
    "content/campaign-meta.json",
    "content/social-posts.json",
    "content/gallery-posts.json",
    "content/portfolio.json",
    "content/chaos-studio.json",
    "frontend/public/assets/site.config.json",
  ]);

  const commits: { path: string; url?: string; sha?: string }[] = [];

  try {
    for (const u of updates) {
      if (!allowed.has(u.path)) {
        throw new Error(`Path not allowed: ${u.path}`);
      }
      const result = await githubPutFile(
        u.path,
        u.content,
        body.commitMessage || "CMS AI: update site content",
        token,
      );
      commits.push({
        path: u.path,
        url: result.commit?.html_url,
        sha: result.commit?.sha,
      });
    }
    return Response.json(
      {
        ok: true,
        branch: BRANCH,
        commits,
        message: "Pushed to main. Site redeploys in about 2 minutes.",
      },
      { headers: CORS },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: msg }, { status: 502, headers: CORS });
  }
}

export async function handleGithubVerify(
  request: Request,
  env: GithubApplyEnv,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  let body: { githubToken?: string };
  try {
    body = (await request.json()) as { githubToken?: string };
  } catch {
    body = {};
  }
  const token = body.githubToken?.trim() || env.CMS_GITHUB_TOKEN || env.GITHUB_TOKEN;
  if (!token) {
    return Response.json({ ok: false, error: "No token" }, { status: 401, headers: CORS });
  }
  const res = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    return Response.json(
      { ok: false, error: `GitHub rejected token (${res.status})` },
      { status: 401, headers: CORS },
    );
  }
  const repo = (await res.json()) as { permissions?: { push?: boolean; admin?: boolean } };
  let canPush = Boolean(repo.permissions?.push || repo.permissions?.admin);
  if (!canPush) {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (userRes.ok) {
      const scopes = (userRes.headers.get("X-OAuth-Scopes") || "").split(",").map((s) => s.trim());
      canPush = scopes.includes("repo") || scopes.includes("public_repo");
    }
    if (!canPush && res.ok) {
      canPush = true;
    }
  }
  return Response.json(
    { ok: true, canPush, repo: REPO },
    { headers: CORS },
  );
}
