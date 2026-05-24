import { OAuthClient } from "./oauth";

interface Env {
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  /** Set to "1" if the repo is private (uses repo scope instead of public_repo). */
  GITHUB_REPO_PRIVATE?: string;
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

const createOAuth = (env: Env) =>
  new OAuthClient({
    id: env.GITHUB_OAUTH_ID,
    secret: env.GITHUB_OAUTH_SECRET,
    target: {
      tokenHost: "https://github.com",
      tokenPath: "/login/oauth/access_token",
      authorizePath: "/login/oauth/authorize",
    },
  });

const handleAuth = (url: URL, env: Env) => {
  const provider = url.searchParams.get("provider");
  if (provider !== "github") {
    return new Response("Invalid provider", { status: 400 });
  }

  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
    return new Response(
      "CMS OAuth is not configured. Set GITHUB_OAUTH_ID and GITHUB_OAUTH_SECRET on the cms-auth worker.",
      { status: 503 },
    );
  }

  const repoIsPrivate =
    env.GITHUB_REPO_PRIVATE !== undefined && env.GITHUB_REPO_PRIVATE !== "0";
  const repoScope = repoIsPrivate ? "repo,user" : "public_repo,user";

  const oauth2 = createOAuth(env);
  const authorizationUri = oauth2.authorizeURL({
    redirect_uri: `https://${url.hostname}/callback?provider=github`,
    scope: repoScope,
    state: randomHex(4),
  });

  return Response.redirect(authorizationUri, 302);
};

const callbackScriptResponse = (status: string, token: string) =>
  new Response(
    `<!DOCTYPE html><html><body><script>
(function() {
  const receiveMessage = (message) => {
    window.opener.postMessage(
      'authorization:github:${status}:${JSON.stringify({ token })}',
      '*'
    );
    window.removeEventListener("message", receiveMessage, false);
  };
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script><p>Authorizing Decap…</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

const handleCallback = async (url: URL, env: Env) => {
  const provider = url.searchParams.get("provider");
  if (provider !== "github") {
    return new Response("Invalid provider", { status: 400 });
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  try {
    const oauth2 = createOAuth(env);
    const accessToken = await oauth2.getToken({
      code,
      redirect_uri: `https://${url.hostname}/callback?provider=github`,
    });
    return callbackScriptResponse("success", accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return callbackScriptResponse("error", message);
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      return handleAuth(url, env);
    }
    if (url.pathname === "/callback") {
      return handleCallback(url, env);
    }

    return new Response("Decap CMS GitHub OAuth proxy", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
