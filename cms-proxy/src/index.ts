/// <reference lib="webworker" />
import { OAuthClient } from "./oauth";

interface Env {
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
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
      "CMS OAuth is not configured. Add CMS_OAUTH_CLIENT_ID and CMS_OAUTH_CLIENT_SECRET to GitHub Actions secrets, then redeploy.",
      { status: 503 },
    );
  }

  // Private repo (CHAOTIC-RAY/portfolio) — public_repo returns "repo not found".
  const repoScope = "repo,user";

  const oauth2 = createOAuth(env);
  const authorizationUri = oauth2.authorizeURL({
    redirect_uri: `https://${url.hostname}/callback?provider=github`,
    scope: repoScope,
    state: randomHex(4),
  });

  return Response.redirect(authorizationUri, 302);
};

const callbackScriptResponse = (status: string, token: string) => {
  const safeToken = JSON.stringify(token);
  const payload =
    status === "success"
      ? `"authorization:github:success:" + JSON.stringify({ token: ${safeToken} })`
      : `"authorization:github:error:" + JSON.stringify({ message: ${safeToken} })`;

  return new Response(
    `<!DOCTYPE html><html><body><script>
(function () {
  const message = ${payload};

  function relay(origin) {
    if (!window.opener || window.opener.closed) {
      document.body.textContent = "Unable to complete login: opener window is closed.";
      return;
    }
    window.opener.postMessage(message, origin || "*");
    try {
      window.close();
    } catch (e) {
      /* ignore */
    }
  }

  // Sveltia CMS handshake: popup notifies parent, parent echoes, popup sends token.
  window.addEventListener("message", function (e) {
    if (e.data === "authorizing:github") {
      relay(e.origin);
    }
  }, false);

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage("authorizing:github", "*");
  }
})();
</script><p>Authorizing Sveltia…</p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
};

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

    return new Response("Sveltia CMS GitHub OAuth proxy", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};