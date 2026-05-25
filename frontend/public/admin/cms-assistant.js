/**
 * Chaos CMS — local AI assistant (Ollama-compatible)
 * Chat + file attachments → structured site updates → GitHub commit
 */
(function () {
  const REPO = "CHAOTIC-RAY/portfolio";
  const BRANCH = "main";
  const SETTINGS_KEY = "chaos_ai_settings";
  const HISTORY_KEY = "chaos_ai_history_v1";

  const CONTENT_FILES = {
    "campaign-meta": {
      path: "content/campaign-meta.json",
      label: "Campaign heading",
    },
    "campaign-posts": {
      path: "content/campaign-posts.json",
      label: "Social posts",
    },
    main: {
      path: "content/portfolio.json",
      label: "Home page",
    },
    "studio-page": {
      path: "content/chaos-studio.json",
      label: "Chaos Studio page",
    },
    "site-config": {
      path: "frontend/public/assets/site.config.json",
      label: "SEO & project cards",
    },
  };

  const SYSTEM_PROMPT = `You are the Chaos Studio CMS assistant. You edit the portfolio website JSON files in GitHub repo ${REPO} (branch ${BRANCH}).

When the user asks to change site text, posts, studio copy, or SEO, respond with:
1. A short plain-English summary of what you will change.
2. A fenced JSON block tagged chaos_cms_updates with this exact shape:
\`\`\`chaos_cms_updates
{
  "updates": [
    {
      "path": "content/portfolio.json",
      "content": { ...full merged JSON object for that file... }
    }
  ],
  "commitMessage": "CMS AI: describe change"
}
\`\`\`

Rules:
- "path" must be one of: content/campaign-meta.json, content/campaign-posts.json, content/portfolio.json, content/chaos-studio.json, frontend/public/assets/site.config.json
- "content" is the COMPLETE file object after your edits (merge with current data; do not drop unrelated fields).
- campaign-posts.json: { "posts": [ ... ] } — each post needs id, platform, client, title, description, tags (string[]), accent (purple|pink|gold|teal). Optional: slides (string[]), enabled, cardLayout, mediaAspect, video, poster, image.
- campaign-meta.json: { "subtitle": string }
- portfolio.json: profile, objective, softSkills (string[]), experience, skills, education, contact, featuredWork — NO chaosStudio field.
- chaos-studio.json: studio page only.
- site.config.json: brand, meta, about, social, work, clients.
- Keep tags/slides/bullets as string arrays, never { tag: "x" } objects.
- If unsure, ask a clarifying question and omit the chaos_cms_updates block.
- Attached files may be JSON exports, copy docs, or briefs — use them as source material.`;

  let siteSnapshot = null;
  let pendingUpdates = null;
  let attachments = [];

  function getSettings() {
    try {
      return {
        ollamaUrl: "http://127.0.0.1:11434",
        model: "llama3.2",
        githubToken: "",
        ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
      };
    } catch {
      return { ollamaUrl: "http://127.0.0.1:11434", model: "llama3.2", githubToken: "" };
    }
  }

  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveHistory(messages) {
    const trimmed = messages.slice(-40);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  }

  function findGithubToken() {
    const s = getSettings();
    if (s.githubToken?.trim()) return s.githubToken.trim();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !/github|netlify-cms|decap/i.test(key)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        if (typeof data?.token === "string") return data.token;
        if (data?.backend?.github?.token) return data.backend.github.token;
        if (data?.github?.token) return data.github.token;
      } catch {
        if (raw.startsWith("github ")) return raw.slice(7);
      }
    }

    const persist = localStorage.getItem("persist:backend");
    if (persist) {
      try {
        const p = JSON.parse(persist);
        const gh = typeof p.github === "string" ? JSON.parse(p.github) : p.github;
        if (gh?.token) return gh.token;
      } catch {
        /* ignore */
      }
    }
    return "";
  }

  async function loadSiteSnapshot() {
    const snap = { loadedAt: new Date().toISOString(), files: {}, live: null };
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      if (res.ok) snap.live = await res.json();
    } catch {
      /* ignore */
    }

    const token = findGithubToken();
    for (const [id, meta] of Object.entries(CONTENT_FILES)) {
      if (token) {
        try {
          const gh = await githubGetFile(meta.path, token);
          if (gh?.content) snap.files[id] = { path: meta.path, label: meta.label, data: gh.content };
          continue;
        } catch {
          /* fall through */
        }
      }
      if (id === "campaign-posts" && snap.live?.socialPosts) {
        snap.files[id] = {
          path: meta.path,
          label: meta.label,
          data: { posts: snap.live.socialPosts.items || [] },
        };
      } else if (id === "campaign-meta" && snap.live) {
        snap.files[id] = {
          path: meta.path,
          label: meta.label,
          data: { subtitle: snap.live.campaignSubtitle || "" },
        };
      } else if (id === "main" && snap.live) {
        const { socialPosts, campaignSubtitle, chaosStudio, ...rest } = snap.live;
        snap.files[id] = { path: meta.path, label: meta.label, data: rest };
      } else if (id === "studio-page" && snap.live?.chaosStudio) {
        snap.files[id] = { path: meta.path, label: meta.label, data: snap.live.chaosStudio };
      }
    }
    siteSnapshot = snap;
    return snap;
  }

  async function githubGetFile(path, token) {
    const url = `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) throw new Error(`GitHub read ${path}: ${res.status}`);
    const meta = await res.json();
    const binary = atob(meta.content.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    return { content: JSON.parse(text), sha: meta.sha };
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function githubPutFile(path, contentObj, message, token) {
    const existing = await githubGetFile(path, token).catch(() => null);
    const encoded = utf8ToBase64(JSON.stringify(contentObj, null, 2) + "\n");
    const body = {
      message,
      branch: BRANCH,
      content: encoded,
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
      throw new Error(`GitHub write failed (${res.status}): ${err.slice(0, 200)}`);
    }
    return res.json();
  }

  function normalizeListFields(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(normalizeListFields);
    const out = { ...obj };
    for (const [k, v] of Object.entries(out)) {
      if (Array.isArray(v) && v.length && typeof v[0] === "object") {
        const key = k === "tags" ? "tag" : k === "slides" ? "slide" : k === "bullets" ? "bullet" : null;
        if (key && v[0]?.[key] != null) out[k] = v.map((i) => String(i[key] ?? ""));
        else out[k] = v.map(normalizeListFields);
      } else if (v && typeof v === "object") {
        out[k] = normalizeListFields(v);
      }
    }
    return out;
  }

  function parseUpdates(text) {
    const match = text.match(/```chaos_cms_updates\s*([\s\S]*?)```/i);
    if (!match) return null;
    try {
      const data = JSON.parse(match[1].trim());
      if (!Array.isArray(data.updates)) return null;
      return {
        updates: data.updates.map((u) => ({
          path: u.path,
          content: normalizeListFields(u.content),
        })),
        commitMessage: data.commitMessage || "CMS AI: update site content",
      };
    } catch {
      return null;
    }
  }

  async function callOllama(messages, settings) {
    const base = settings.ollamaUrl.replace(/\/$/, "");
    const url = `${base}/api/chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.model || "llama3.2",
        messages,
        stream: false,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama ${res.status}: ${err.slice(0, 300)}`);
    }
    const data = await res.json();
    return data.message?.content || "";
  }

  async function callProxyChat(messages, settings) {
    const res = await fetch("/api/admin/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings.model,
        messages,
        ollamaUrl: settings.ollamaUrl,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI proxy ${res.status}: ${err.slice(0, 300)}`);
    }
    const data = await res.json();
    return data.content || data.message || "";
  }

  async function chatComplete(messages, settings) {
    try {
      return await callOllama(messages, settings);
    } catch (directErr) {
      try {
        return await callProxyChat(messages, settings);
      } catch {
        throw directErr;
      }
    }
  }

  function buildContextMessage(snap, attachText) {
    const parts = ["Current site content snapshot (JSON):"];
    for (const f of Object.values(snap.files || {})) {
      parts.push(`\n--- ${f.path} (${f.label}) ---\n${JSON.stringify(f.data, null, 0).slice(0, 12000)}`);
    }
    if (attachText) parts.push("\n\nAttached files:\n" + attachText);
    return parts.join("");
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsText(file);
    });
  }

  async function handleFiles(fileList) {
    for (const file of fileList) {
      const name = file.name;
      const lower = name.toLowerCase();
      if (lower.match(/\.(json|md|txt|yml|yaml|csv)$/)) {
        const text = await readFileAsText(file);
        attachments.push({ name, type: "text", text: text.slice(0, 50000) });
      } else if (lower.match(/\.(png|jpe?g|webp|gif)$/)) {
        attachments.push({
          name,
          type: "image",
          note: `Image attached: ${name} (${Math.round(file.size / 1024)} KB). Describe how to use it in posts if needed.`,
        });
      } else {
        attachments.push({ name, type: "other", note: `File: ${name} (${file.type || "unknown"})` });
      }
    }
    renderAttachments();
  }

  function renderAttachments() {
    const el = document.querySelector("[data-ai-attachments]");
    if (!el) return;
    if (!attachments.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = attachments
      .map(
        (a, i) =>
          `<span class="chaos-ai-attach-chip">${a.name} <button type="button" data-rm-attach="${i}" aria-label="Remove">×</button></span>`,
      )
      .join("");
    el.querySelectorAll("[data-rm-attach]").forEach((btn) => {
      btn.addEventListener("click", () => {
        attachments.splice(Number(btn.getAttribute("data-rm-attach")), 1);
        renderAttachments();
      });
    });
  }

  function appendMessage(role, html, el) {
    const div = document.createElement("div");
    div.className = `chaos-ai-msg chaos-ai-msg--${role}`;
    div.innerHTML = html;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function renderPendingPreview() {
    const el = document.querySelector("[data-ai-preview]");
    if (!el) return;
    if (!pendingUpdates?.updates?.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = `
      <h3>Proposed site updates</h3>
      <ul>${pendingUpdates.updates
        .map((u) => `<li><code>${u.path}</code></li>`)
        .join("")}</ul>
      <p class="chaos-ai-preview__msg">${pendingUpdates.commitMessage}</p>
      <button type="button" class="chaos-ai-btn chaos-ai-btn--primary" data-ai-apply>Apply to GitHub (auto-deploy ~2 min)</button>
      <button type="button" class="chaos-ai-btn" data-ai-dismiss-preview>Dismiss</button>
    `;
    el.querySelector("[data-ai-apply]")?.addEventListener("click", applyPendingUpdates);
    el.querySelector("[data-ai-dismiss-preview]")?.addEventListener("click", () => {
      pendingUpdates = null;
      renderPendingPreview();
    });
  }

  async function applyPendingUpdates() {
    const token = findGithubToken();
    if (!token) {
      alert("Add a GitHub token in settings (repo scope). Log into CMS via GitHub first, or paste a PAT.");
      return;
    }
    if (!pendingUpdates?.updates?.length) return;

    const btn = document.querySelector("[data-ai-apply]");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Committing…";
    }

    try {
      for (const u of pendingUpdates.updates) {
        await githubPutFile(u.path, u.content, pendingUpdates.commitMessage, token);
      }
      appendMessage(
        "assistant",
        `<strong>Applied.</strong> ${pendingUpdates.updates.length} file(s) committed. Site redeploys in ~2 minutes.`,
        document.querySelector("[data-ai-messages]"),
      );
      pendingUpdates = null;
      renderPendingPreview();
      await loadSiteSnapshot();
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Apply to GitHub (auto-deploy ~2 min)";
      }
    }
  }

  async function sendChat() {
    const input = document.querySelector("[data-ai-input]");
    const messagesEl = document.querySelector("[data-ai-messages]");
    const sendBtn = document.querySelector("[data-ai-send]");
    if (!input || !messagesEl) return;

    const text = input.value.trim();
    if (!text && !attachments.length) return;

    const settings = getSettings();
    input.value = "";
    sendBtn.disabled = true;

    let attachText = "";
    if (attachments.length) {
      attachText = attachments
        .map((a) => {
          if (a.text) return `### ${a.name}\n${a.text}`;
          return `### ${a.name}\n${a.note || ""}`;
        })
        .join("\n\n");
    }

    appendMessage("user", escapeHtml(text) + (attachText ? `<pre class="chaos-ai-attach-preview">${escapeHtml(attachText.slice(0, 2000))}${attachText.length > 2000 ? "…" : ""}</pre>` : ""), messagesEl);

    const history = getHistory();
    history.push({ role: "user", content: text + (attachText ? "\n\n" + attachText : "") });
    attachments = [];
    renderAttachments();

    appendMessage("assistant", `<span class="chaos-ai-thinking">Thinking…</span>`, messagesEl);
    const thinking = messagesEl.lastElementChild;

    try {
      if (!siteSnapshot) await loadSiteSnapshot();
      const context = buildContextMessage(siteSnapshot, attachText);
      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: context },
        ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
      ];

      const reply = await chatComplete(apiMessages, settings);
      thinking.remove();

      const parsed = parseUpdates(reply);
      if (parsed) {
        pendingUpdates = parsed;
        renderPendingPreview();
      }

      appendMessage("assistant", formatReplyHtml(reply), messagesEl);
      history.push({ role: "assistant", content: reply });
      saveHistory(history);
    } catch (e) {
      thinking?.remove();
      const hint =
        location.protocol === "https:" && settings.ollamaUrl.startsWith("http://")
          ? "<br><br>Tip: HTTPS admin cannot call http://localhost. Use a tunnel URL (cloudflared) in settings, or open admin via local Vite."
          : "";
      appendMessage("assistant", `<strong>Error:</strong> ${escapeHtml(e.message)}${hint}`, messagesEl);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatReplyHtml(text) {
    const withoutBlock = text.replace(/```chaos_cms_updates[\s\S]*?```/gi, "").trim();
    return escapeHtml(withoutBlock).replace(/\n/g, "<br>");
  }

  function renderAssistant(root) {
    const settings = getSettings();
    root.innerHTML = `
      <div class="chaos-ai">
        <header class="chaos-ai__head">
          <h1>AI site assistant</h1>
          <p>Chat with local Ollama, attach JSON/copy files, then apply changes to GitHub automatically.</p>
        </header>
        <details class="chaos-ai-settings">
          <summary>Settings</summary>
          <label>Ollama URL <input type="url" data-ai-ollama value="${escapeHtml(settings.ollamaUrl)}" placeholder="http://127.0.0.1:11434" /></label>
          <label>Model <input type="text" data-ai-model value="${escapeHtml(settings.model)}" placeholder="llama3.2" /></label>
          <label>GitHub token (optional if logged into CMS) <input type="password" data-ai-token placeholder="ghp_… or use CMS login" autocomplete="off" /></label>
          <button type="button" class="chaos-ai-btn" data-ai-save-settings>Save settings</button>
          <button type="button" class="chaos-ai-btn" data-ai-reload-context>Reload site content</button>
        </details>
        <div class="chaos-ai-preview" data-ai-preview hidden></div>
        <div class="chaos-ai-messages" data-ai-messages role="log" aria-live="polite"></div>
        <div class="chaos-ai-attachments" data-ai-attachments></div>
        <div class="chaos-ai-compose">
          <label class="chaos-ai-file">
            <input type="file" data-ai-files multiple accept=".json,.md,.txt,.yml,.yaml,.csv,.png,.jpg,.jpeg,.webp" />
            Attach files
          </label>
          <textarea data-ai-input rows="3" placeholder="e.g. Change campaign subtitle to … / Add a post for … / Rewrite studio packages…"></textarea>
          <button type="button" class="chaos-ai-btn chaos-ai-btn--primary" data-ai-send>Send</button>
        </div>
      </div>
    `;

    const messagesEl = root.querySelector("[data-ai-messages]");
    for (const m of getHistory()) {
      appendMessage(m.role, formatReplyHtml(m.content), messagesEl);
    }

    root.querySelector("[data-ai-save-settings]")?.addEventListener("click", () => {
      saveSettings({
        ollamaUrl: root.querySelector("[data-ai-ollama]")?.value?.trim() || "http://127.0.0.1:11434",
        model: root.querySelector("[data-ai-model]")?.value?.trim() || "llama3.2",
        githubToken: root.querySelector("[data-ai-token]")?.value?.trim() || "",
      });
      alert("Settings saved.");
    });

    root.querySelector("[data-ai-reload-context]")?.addEventListener("click", async () => {
      await loadSiteSnapshot();
      appendMessage("assistant", "Reloaded site content from API/GitHub.", messagesEl);
    });

    root.querySelector("[data-ai-files]")?.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files?.length) handleFiles(files);
      e.target.value = "";
    });

    root.querySelector("[data-ai-send]")?.addEventListener("click", sendChat);
    root.querySelector("[data-ai-input]")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });

    loadSiteSnapshot().then(() => {
      if (!getHistory().length) {
        appendMessage(
          "assistant",
          "Hi — I can update portfolio text, social posts, studio page, and SEO. Attach a JSON or brief, describe the change, then click <strong>Apply to GitHub</strong> when you see the preview.",
          messagesEl,
        );
      }
    });
  }

  window.ChaosAssistant = { renderAssistant, loadSiteSnapshot };
})();
