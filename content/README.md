# Campaign & feed — easy editing

## GUI editor (recommended)

Open **https://portfolio.chaoticstudio.workers.dev/admin/** after deploy.  
Setup once: **[CMS-SETUP.md](./CMS-SETUP.md)** (GitHub login + Sveltia CMS).

## Manual editing

All carousel posts are controlled by **one file**:

**`content/campaign-posts.json`**

Site copy (hero, studio, experience): **`content/portfolio.json`**

After you save changes, run `npm run build` (or push to `main` to deploy). The build copies campaign JSON to the site automatically.

---

## Add a new post (3 steps)

### 1. Duplicate the template in JSON

In `campaign-posts.json`, copy the block with `"id": "_copy-me-for-new-post"` and paste it **above** that template.

Change:

| Field | What to write |
|--------|----------------|
| `id` | Short slug, lowercase, hyphens only — e.g. `summer-sale-2026` |
| `platform` | Instagram, Facebook, Product, etc. |
| `client` | Client or brand name |
| `title` | Headline on the card |
| `description` | 1–3 sentences about the work |
| `tags` | Array of short labels, e.g. `["Carousel", "Sale"]` |
| `accent` | Card color: `purple`, `pink`, `gold`, or `teal` |
| `enabled` | Remove this line, or set to `true` (hidden if `false`) |

**Example — new post:**

```json
{
  "id": "summer-sale-2026",
  "platform": "Instagram",
  "client": "Rainbow Enterprise",
  "title": "Summer sale stories",
  "description": "Bright story frames with product cutouts and promo codes.",
  "tags": ["Stories", "Sale"],
  "accent": "pink"
}
```

### 2. Add the image

Put your image in:

`frontend/public/images/posts/`

**Filename = same as `id`**, with extension `.webp`, `.jpg`, or `.png`:

- `summer-sale-2026.webp`  
- or `summer-sale-2026.jpg`

Recommended size: **1080×1350** (4:5 feed) or **1080×1080**.

### 3. Build & deploy

```bash
npm run build
npm run deploy
```

Or push to `main` if CI deploys for you.

---

## Edit text on an existing post

Open `campaign-posts.json`, find the post by `id`, change `title`, `description`, `tags`, etc., save, rebuild.

---

## Change only the image

Keep the same `id`. Replace the file in `frontend/public/images/posts/` (same name, new picture). Rebuild/deploy.

---

## Use a different image filename

Optional field on any post:

```json
"image": "my-custom-filename"
```

Then save the file as `frontend/public/images/posts/my-custom-filename.webp` (or `.jpg` / `.png`).

---

## Carousel posts (multiple slides, one card)

Put slides in a folder named after the post `id`:

`frontend/public/images/posts/rainbow-sale/slide-01.webp`  
`frontend/public/images/posts/rainbow-sale/slide-02.webp`  
…

In JSON, list slide basenames (no extension):

```json
"slides": ["slide-01", "slide-02", "slide-03"]
```

The card cycles through slides automatically. Keep carousel posts **one JSON entry** so they stay grouped in the feed.

### Import many images from `Posts.zip`

1. Copy `Posts.zip` to the repo root.
2. Run:

```bash
npm run import:posts
npm run apply:post-copy
npm run build
```

The import groups images by client folder and Instagram post timestamp (carousels), converts to WebP, and includes `.mp4` reels. Edit titles/descriptions in **`content/post-copy.json`**, then run `npm run apply:post-copy`.

---

## Hide a post without deleting it

```json
"enabled": false
```

---

## Change the section title

Edit `"subtitle"` at the top of `campaign-posts.json`.
