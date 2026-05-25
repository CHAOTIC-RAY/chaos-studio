/**
 * Chaos CMS — AI assistant (cloud models via worker proxy)
 * Chat + file attachments → structured site updates → GitHub commit
 */
(function () {
  const REPO = "CHAOTIC-RAY/portfolio";
  const BRANCH = "main";
  const SETTINGS_KEY = "chaos_ai_settings";
  const HISTORY_KEY = "chaos_ai_history_v1";

  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
  const MAX_IMAGES = 6;

  /** @type {Record<string, { label: string; hint: string; vision?: boolean; models: { id: string; label: string }[]; defaultModel: string }>} */
  const PROVIDERS = {
    google: {
      label: "Google Gemini (FREE)",
      hint: "Free key — aistudio.google.com/apikey · reads images + JSON",
      vision: true,
      defaultModel: "gemini-2.0-flash",
      models: [
        { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (free, vision)" },
        { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite (free, faster)" },
        { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (free, vision)" },
      ],
    },
    "openrouter-free": {
      label: "OpenRouter FREE models",
      hint: "Free key — openrouter.ai/keys · use models below (old :free IDs expire)",
      vision: true,
      defaultModel: "openrouter/free",
      models: [
        { id: "openrouter/free", label: "Free router (recommended — auto-picks free model)" },
        { id: "nvidia/nemotron-nano-12b-v2-vl:free", label: "Nemotron Nano 12B VL (free, vision)" },
        { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B (free, vision)" },
        { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B (free, vision)" },
        { id: "deepseek/deepseek-v4-flash:free", label: "DeepSeek V4 Flash (free, text)" },
      ],
    },
    openrouter: {
      label: "OpenRouter (paid models)",
      hint: "openrouter.ai/keys",
      vision: true,
      defaultModel: "google/gemini-2.0-flash-001",
      models: [
        { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
        { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
        { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
      ],
    },
    openai: {
      label: "OpenAI",
      hint: "platform.openai.com/api-keys",
      defaultModel: "gpt-4o-mini",
      models: [
        { id: "gpt-4o-mini", label: "GPT-4o mini" },
        { id: "gpt-4o", label: "GPT-4o" },
        { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      ],
    },
    groq: {
      label: "Groq",
      hint: "Very fast inference — console.groq.com/keys",
      defaultModel: "llama-3.3-70b-versatile",
      models: [
        { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
        { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
      ],
    },
    anthropic: {
      label: "Anthropic Claude",
      hint: "console.anthropic.com/settings/keys",
      defaultModel: "claude-sonnet-4-20250514",
      models: [
        { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
        { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (fast)" },
      ],
    },
  };

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
- Attached files may be JSON exports, copy docs, or briefs — use them as source material.
- When the user uploads images, describe what you see and use them for post copy, client names, slide folder ideas, or alt text. Match post id to image folder names when obvious.`;

  let siteSnapshot = null;
  let pendingUpdates = null;
  let attachments = [];

  const API_KEY_META = {
    google: {
      label: "Google Gemini API key",
      placeholder: "AIzaSy…",
      url: "https://aistudio.google.com/apikey",
      linkText: "Get free Gemini key",
    },
    "openrouter-free": {
      label: "OpenRouter API key",
      placeholder: "sk-or-v1-…",
      url: "https://openrouter.ai/keys",
      linkText: "Get free OpenRouter key",
    },
    openrouter: {
      label: "OpenRouter API key",
      placeholder: "sk-or-v1-…",
      url: "https://openrouter.ai/keys",
      linkText: "Get OpenRouter key",
    },
    openai: {
      label: "OpenAI API key",
      placeholder: "sk-…",
      url: "https://platform.openai.com/api-keys",
      linkText: "OpenAI keys",
    },
    anthropic: {
      label: "Anthropic API key",
      placeholder: "sk-ant-…",
      url: "https://console.anthropic.com/settings/keys",
      linkText: "Anthropic keys",
    },
    groq: {
      label: "Groq API key",
      placeholder: "gsk_…",
      url: "https://console.groq.com/keys",
      linkText: "Groq keys",
    },
  };

  function defaultSettings() {
    return {
      provider: "google",
      model: PROVIDERS.google.defaultModel,
      apiKeys: {},
      githubToken: "",
    };
  }

  function normalizeModel(provider, model) {
    const p = PROVIDERS[provider] || PROVIDERS.google;
    const id = (model || "").trim();
    if (p.models.some((m) => m.id === id)) return id;
    return p.defaultModel;
  }

  function getSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      if (raw.ollamaUrl && !raw.provider) {
        return { ...defaultSettings(), githubToken: raw.githubToken || "" };
      }
      const provider = PROVIDERS[raw.provider] ? raw.provider : "google";
      const apiKeys = { ...(raw.apiKeys || {}) };
      if (raw.apiKey && !apiKeys[provider]) apiKeys[provider] = raw.apiKey;
      const model = normalizeModel(provider, raw.model);
      return {
        ...defaultSettings(),
        provider,
        model,
        apiKeys,
        githubToken: raw.githubToken || "",
      };
    } catch {
      return defaultSettings();
    }
  }

  function apiKeyForProvider(settings, provider) {
    return settings.apiKeys?.[provider]?.trim() || "";
  }

  function activeApiKey(settings) {
    return apiKeyForProvider(settings, settings.provider);
  }

  function providerSupportsVision(provider) {
    return Boolean(PROVIDERS[provider]?.vision);
  }

  function buildApiUserMessage(text, attachText, images, provider) {
    let body = [text, attachText].filter(Boolean).join("\n\n");
    const imgs = images.filter((a) => a.type === "image" && a.data);

    if (imgs.length && !providerSupportsVision(provider)) {
      body += "\n\n[Images attached — switch to Google Gemini (FREE) or OpenRouter FREE for vision]";
      for (const img of imgs) body += `\n- ${img.name}`;
      return { role: "user", content: body };
    }

    if (!imgs.length) return { role: "user", content: body || "(no text)" };

    return {
      role: "user",
      content: {
        parts: [
          { type: "text", text: body || "Use the attached image(s) for the site update." },
          ...imgs.map((img) => ({
            type: "image",
            mimeType: img.mimeType,
            data: img.data,
          })),
        ],
      },
    };
  }

  function modelOptionsHtml(provider, selected) {
    const p = PROVIDERS[provider] || PROVIDERS.google;
    return p.models
      .map((m) => `<option value="${escapeHtml(m.id)}"${m.id === selected ? " selected" : ""}>${escapeHtml(m.label)}</option>`)
      .join("");
  }

  function providerOptionsHtml(selected) {
    return Object.entries(PROVIDERS)
      .map(
        ([id, p]) =>
          `<option value="${id}"${id === selected ? " selected" : ""}>${escapeHtml(p.label)}${p.vision ? " 📷" : ""}</option>`,
      )
      .join("");
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

  async function chatComplete(messages, settings) {
    const res = await fetch("/api/admin/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: settings.provider,
        model: settings.model,
        messages,
        apiKey: activeApiKey(settings) || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = String(data.error || `AI request failed (${res.status})`);
      if (/404|no endpoints found/i.test(err)) {
        const p = PROVIDERS[settings.provider] || PROVIDERS.google;
        throw new Error(
          `${err}\n\nThat model is no longer on OpenRouter. In Settings, set Model to "${p.defaultModel}" (or use Google Gemini FREE with a key from aistudio.google.com/apikey).`,
        );
      }
      throw new Error(err);
    }
    return data.content || "";
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

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
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
        if (attachments.filter((a) => a.type === "image").length >= MAX_IMAGES) {
          alert(`Max ${MAX_IMAGES} images per message.`);
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          alert(`${name} is too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB).`);
          continue;
        }
        const dataUrl = await readFileAsDataUrl(file);
        const comma = String(dataUrl).indexOf(",");
        const header = String(dataUrl).slice(0, comma);
        const data = String(dataUrl).slice(comma + 1);
        const mimeType = header.match(/data:([^;]+)/)?.[1] || file.type || "image/jpeg";
        attachments.push({
          name,
          type: "image",
          mimeType,
          data,
          preview: String(dataUrl),
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
      .map((a, i) => {
        if (a.type === "image" && a.preview) {
          return `<span class="chaos-ai-attach-chip chaos-ai-attach-chip--img"><img src="${a.preview}" alt="" /><span>${a.name}</span><button type="button" data-rm-attach="${i}" aria-label="Remove">×</button></span>`;
        }
        return `<span class="chaos-ai-attach-chip">${a.name} <button type="button" data-rm-attach="${i}" aria-label="Remove">×</button></span>`;
      })
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

    const batch = [...attachments];
    let attachText = "";
    const textFiles = batch.filter((a) => a.type === "text");
    const images = batch.filter((a) => a.type === "image");
    if (textFiles.length) {
      attachText = textFiles.map((a) => `### ${a.name}\n${a.text}`).join("\n\n");
    }

    let userHtml = escapeHtml(text);
    if (images.length) {
      userHtml += `<div class="chaos-ai-user-images">${images.map((img) => `<img src="${img.preview}" alt="${escapeHtml(img.name)}" />`).join("")}</div>`;
    }
    if (attachText) {
      userHtml += `<pre class="chaos-ai-attach-preview">${escapeHtml(attachText.slice(0, 2000))}${attachText.length > 2000 ? "…" : ""}</pre>`;
    }
    appendMessage("user", userHtml, messagesEl);

    const history = getHistory();
    const historyLine =
      text +
      (attachText ? `\n\n${attachText}` : "") +
      (images.length ? `\n\n[${images.length} image(s) attached]` : "");
    history.push({ role: "user", content: historyLine });
    attachments = [];
    renderAttachments();

    appendMessage("assistant", `<span class="chaos-ai-thinking">Thinking…</span>`, messagesEl);
    const thinking = messagesEl.lastElementChild;

    try {
      if (!siteSnapshot) await loadSiteSnapshot();
      const context = buildContextMessage(siteSnapshot, "");
      const prior = history.slice(0, -1).slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const lastUser = buildApiUserMessage(text, attachText, images, settings.provider);
      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: context },
        ...prior,
        lastUser,
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
      const prov = PROVIDERS[settings.provider] || PROVIDERS.google;
      const msg = escapeHtml(e.message).replace(/\n/g, "<br>");
      appendMessage(
        "assistant",
        `<strong>Error:</strong> ${msg}<br><br>Check your <strong>${escapeHtml(prov.label)}</strong> API key (${escapeHtml(prov.hint)}). For OpenRouter, set Model to <strong>Free router</strong>.`,
        messagesEl,
      );
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

  function bindProviderModelSelects(root) {
    const provEl = root.querySelector("[data-ai-provider]");
    const modelEl = root.querySelector("[data-ai-model]");
    const hintEl = root.querySelector("[data-ai-provider-hint]");
    const keyLabel = root.querySelector("[data-ai-key-label]");
    const keyInput = root.querySelector("[data-ai-api-key]");
    const keyLink = root.querySelector("[data-ai-key-link]");
    if (!provEl || !modelEl) return;

    const refreshModels = () => {
      const pid = provEl.value;
      const p = PROVIDERS[pid] || PROVIDERS.google;
      const cur = modelEl.value;
      modelEl.innerHTML = modelOptionsHtml(pid, cur);
      if (![...modelEl.options].some((o) => o.value === cur)) {
        modelEl.value = p.defaultModel;
      }
      if (hintEl) hintEl.textContent = p.hint;

      const meta = API_KEY_META[pid] || API_KEY_META.google;
      if (keyLabel) keyLabel.textContent = meta.label;
      if (keyInput) {
        keyInput.placeholder = meta.placeholder;
        if (document.activeElement !== keyInput) {
          keyInput.value = apiKeyForProvider(getSettings(), pid);
        }
      }
      if (keyLink) {
        keyLink.href = meta.url;
        keyLink.textContent = meta.linkText;
      }
    };

    provEl.addEventListener("change", refreshModels);
    keyInput?.addEventListener("focus", () => {
      const pid = provEl.value;
      keyInput.value = apiKeyForProvider(getSettings(), pid);
    });
    refreshModels();
  }

  function renderAssistant(root) {
    const settings = getSettings();
    const prov = PROVIDERS[settings.provider] || PROVIDERS.google;
    const keyMeta = API_KEY_META[settings.provider] || API_KEY_META.google;
    const keyVal = apiKeyForProvider(settings, settings.provider);
    root.innerHTML = `
      <div class="chaos-ai">
        <header class="chaos-ai__head">
          <h1>AI site assistant</h1>
          <p>Free Gemini or OpenRouter — paste your API key below, attach images, apply to GitHub.</p>
        </header>
        <section class="chaos-ai-settings" aria-label="AI settings">
          <div class="chaos-ai-settings__grid">
            <label class="chaos-ai-settings__field">Provider
              <select data-ai-provider>${providerOptionsHtml(settings.provider)}</select>
            </label>
            <label class="chaos-ai-settings__field">Model
              <select data-ai-model>${modelOptionsHtml(settings.provider, settings.model)}</select>
            </label>
          </div>
          <p class="chaos-ai-settings__hint" data-ai-provider-hint>${escapeHtml(prov.hint)}</p>
          <label class="chaos-ai-settings__field chaos-ai-settings__field--key">
            <span data-ai-key-label>${escapeHtml(keyMeta.label)}</span>
            <a class="chaos-ai-settings__link" data-ai-key-link href="${keyMeta.url}" target="_blank" rel="noopener">${escapeHtml(keyMeta.linkText)}</a>
            <input type="text" data-ai-api-key value="${escapeHtml(keyVal)}" placeholder="${escapeHtml(keyMeta.placeholder)}" autocomplete="off" spellcheck="false" />
          </label>
          <label class="chaos-ai-settings__field">GitHub token <span class="chaos-ai-settings__optional">(optional if logged into CMS)</span>
            <input type="password" data-ai-token value="${escapeHtml(settings.githubToken)}" placeholder="ghp_… or use CMS login" autocomplete="off" />
          </label>
          <div class="chaos-ai-settings__actions">
            <button type="button" class="chaos-ai-btn chaos-ai-btn--primary" data-ai-save-settings>Save API key</button>
            <button type="button" class="chaos-ai-btn" data-ai-reload-context>Reload site</button>
          </div>
        </section>
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

    bindProviderModelSelects(root);

    root.querySelector("[data-ai-save-settings]")?.addEventListener("click", () => {
      const provider = root.querySelector("[data-ai-provider]")?.value || "google";
      const prev = getSettings();
      const apiKeys = { ...prev.apiKeys };
      apiKeys[provider] = root.querySelector("[data-ai-api-key]")?.value?.trim() || "";
      saveSettings({
        provider,
        model: root.querySelector("[data-ai-model]")?.value || PROVIDERS[provider].defaultModel,
        apiKeys,
        githubToken: root.querySelector("[data-ai-token]")?.value?.trim() || "",
      });
      alert(`Saved ${PROVIDERS[provider]?.label || provider} API key in this browser.`);
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
          "Paste your API key in the <strong>settings box above</strong> (Gemini or OpenRouter), click <strong>Save API key</strong>, then chat. Upload images or JSON — <strong>Apply to GitHub</strong> when you see a preview.",
          messagesEl,
        );
      }
    });
  }

  window.ChaosAssistant = { renderAssistant, loadSiteSnapshot };
})();
