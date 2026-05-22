import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsPath = path.join(root, "content", "campaign-posts.json");
const copyPath = path.join(root, "content", "post-copy.json");

const data = JSON.parse(fs.readFileSync(postsPath, "utf8"));
const copy = JSON.parse(fs.readFileSync(copyPath, "utf8"));

const reel01 = {
  id: "rainbow-reel-01",
  platform: "Instagram",
  client: "Rainbow Enterprise",
  accent: "purple",
  video: "video.mp4",
  poster: "poster.webp",
  ...copy["rainbow-reel-01"],
};

const reel02 = {
  id: "rainbow-reel-02",
  platform: "Instagram",
  client: "Rainbow Enterprise",
  accent: "purple",
  video: "video.mp4",
  poster: "poster.webp",
  ...copy["rainbow-reel-02"],
};

const posts = data.posts.filter((p) => !p.id.startsWith("_"));
const template = data.posts.find((p) => p.id.startsWith("_"));

const merged = posts.map((post) => {
  const c = copy[post.id];
  if (!c) return post;
  return {
    ...post,
    title: c.title,
    description: c.description,
    tags: c.tags,
  };
});

const out = [];
for (const post of merged) {
  out.push(post);
  if (post.id === "rainbow-03") out.push(reel01);
  if (post.id === "rainbow-05") out.push(reel02);
}

data.posts = [...out, ...(template ? [template] : [])];
fs.writeFileSync(postsPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated ${posts.length} posts; inserted 2 Rainbow reels.`);
