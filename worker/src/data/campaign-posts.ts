import socialRaw from "../../../content/social-posts.json";
import galleryRaw from "../../../content/gallery-posts.json";
import meta from "../../../content/campaign-meta.json";
import { toStringList } from "./cms-list-shape";

export type CampaignPostJson = {
  id: string;
  platform: string;
  client: string;
  title: string;
  description: string;
  tags: string[];
  accent: string;
  enabled?: boolean;
  image?: string;
  slides?: string[];
  video?: string;
  poster?: string;
  cardLayout?: string;
  mediaAspect?: string;
};

type PostsFile = { posts: CampaignPostJson[] };

const socialFile = socialRaw as PostsFile;
const galleryFile = galleryRaw as PostsFile;

function normalizePost(post: CampaignPostJson): CampaignPostJson {
  const p = { ...post };
  p.tags = toStringList(p.tags, "tag");
  if (p.slides) p.slides = toStringList(p.slides, "slide");
  if (p.cardLayout === "default") delete p.cardLayout;
  if (p.mediaAspect === "default") delete p.mediaAspect;
  return p;
}

function visiblePosts(posts: CampaignPostJson[]): CampaignPostJson[] {
  return posts
    .filter((p) => p.enabled !== false && !p.id.startsWith("_"))
    .map(({ enabled: _e, ...post }) => normalizePost(post));
}

export function getSocialPosts() {
  return {
    subtitle: meta.subtitle,
    items: visiblePosts(socialFile.posts),
  };
}

export function getGalleryPosts() {
  return {
    items: visiblePosts(galleryFile.posts),
  };
}

/** Gallery pano: gallery-only tiles first, then feed posts not already listed. */
export function getPanoramaPosts(): CampaignPostJson[] {
  const gallery = visiblePosts(galleryFile.posts);
  const social = visiblePosts(socialFile.posts);
  const seen = new Set(gallery.map((p) => p.id));
  const merged = [...gallery];
  for (const post of social) {
    if (!seen.has(post.id)) {
      seen.add(post.id);
      merged.push(post);
    }
  }
  return merged;
}
