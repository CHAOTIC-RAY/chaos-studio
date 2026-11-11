import { createApp } from "./admin-app.js";

const loginForm = document.getElementById("login-form");
const loginErr = document.getElementById("login-err");

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) headers["Content-Type"] = headers["Content-Type"] || "application/json";
  const r = await fetch(path, { credentials: "same-origin", ...opts, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

async function main() {
  let authed = false;
  try {
    authed = (await api("/api/auth/session")).authenticated;
  } catch {
    authed = false;
  }

  const loginEl = document.getElementById("login");
  const appEl = document.getElementById("app");

  if (!authed) {
    loginEl.hidden = false;
    appEl.hidden = true;
    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginErr.hidden = true;
      try {
        await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ password: new FormData(loginForm).get("password") }),
        });
        await main();
      } catch (ex) {
        loginErr.textContent = ex.message;
        loginErr.hidden = false;
      }
    });
    return;
  }

  loginEl.hidden = true;
  appEl.hidden = false;
  const content = await api("/api/content");
  const app = createApp({ content, api, root: appEl });
  document.getElementById("logout")?.addEventListener("click", () =>
    api("/api/auth/logout", { method: "POST", body: "{}" }).then(() => location.reload()),
  );
  app.mount();
}

main();
