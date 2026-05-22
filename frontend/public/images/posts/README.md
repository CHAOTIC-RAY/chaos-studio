# Campaign post images

**Edit post text** in the repo root file: [`content/campaign-posts.json`](../../../content/campaign-posts.json)  
**Full guide:** [`content/README.md`](../../../content/README.md)

## Image files

**Single image:** filename = post `id` → `summer-sale-2026.webp` (or `.jpg` / `.png`)

**Carousel:** folder `summer-sale-2026/` with `slide-01.webp`, `slide-02.webp`, … and `"slides": ["slide-01", "slide-02"]` in JSON.

| Example JSON `id` | Image file(s) |
|-------------------|----------------|
| `summer-sale-2026` | `summer-sale-2026.webp` |
| `rainbow-sale` (carousel) | `rainbow-sale/slide-01.webp`, `slide-02.webp`, … |

Bulk import: place `Posts.zip` at repo root and run `npm run import:posts`.

Recommended size: **1080×1350** (4:5) or **1080×1080**.

If the image is missing, a placeholder graphic is shown automatically.
