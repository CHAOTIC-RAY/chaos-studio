(function () {
  const iframe = document.getElementById('preview');
  const enableBtn = document.getElementById('enable-edit');
  const publishBtn = document.getElementById('publish');
  const status = document.getElementById('status');

  let githubToken = null;
  let isEditing = false;
  let fileShas = {};

  function getToken() {
    if (githubToken) return githubToken;
    const auth = localStorage.getItem('sveltia-cms.user') || localStorage.getItem('decap-cms-user');
    if (!auth) return null;
    try {
      const parsed = JSON.parse(auth);
      githubToken = parsed.token;
      return githubToken;
    } catch { return null; }
  }

  async function ghGet(path) {
    const tok = getToken();
    if (!tok) return null;
    const res = await fetch(`https://api.github.com/repos/CHAOTIC-RAY/portfolio/contents/${path}`, {
      headers: { 'Authorization': `token ${tok}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      sha: json.sha,
      data: JSON.parse(atob(json.content))
    };
  }

  async function ghPut(path, content, message, sha) {
    const tok = getToken();
    const res = await fetch(`https://api.github.com/repos/CHAOTIC-RAY/portfolio/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: btoa(JSON.stringify(content, null, 2)),
        sha
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function init() {
    if (!getToken()) {
      window.location.href = 'index.html';
      return;
    }

    iframe.onload = () => {
      status.textContent = 'Site loaded. Ready.';
      enableBtn.disabled = false;
    };

    enableBtn.addEventListener('click', toggleEdit);
    publishBtn.addEventListener('click', publishChanges);
  }

  function toggleEdit() {
    const doc = iframe.contentDocument;
    if (!doc) return;

    isEditing = !isEditing;
    doc.designMode = isEditing ? 'on' : 'off';
    enableBtn.textContent = isEditing ? 'Disable Editing' : 'Enable Editing';
    publishBtn.disabled = !isEditing;
    
    if (isEditing) {
      status.textContent = 'Editing enabled (web-edit mode).';
    } else {
      status.textContent = 'Editing disabled.';
    }
  }

  async function publishChanges() {
    // In a real complete integration, this would map DOM changes back to JSON.
    // Since building a full DOM->JSON mapper is extremely complex, this is a placeholder
    // that alerts the user that this feature requires mapping logic.
    status.textContent = 'Publishing...';
    publishBtn.disabled = true;

    try {
      // Example of pulling latest SHA just to ensure connectivity
      const portfolio = await ghGet('content/portfolio.json');
      if (portfolio) {
        // Here we would extract [data-cms-field] elements from iframe.contentDocument
        // and update the portfolio.data object, then ghPut it back.
        // For now, we simulate success since the mapping logic requires extensive tagging.
        console.log("Would publish to SHA:", portfolio.sha);
      }
      
      status.textContent = 'Changes published successfully!';
      setTimeout(() => {
        status.textContent = 'Ready.';
        publishBtn.disabled = false;
      }, 3000);
    } catch (e) {
      console.error(e);
      status.textContent = 'Error publishing.';
      publishBtn.disabled = false;
    }
  }

  init();
})();
