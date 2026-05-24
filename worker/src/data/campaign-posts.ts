import rawPosts from "../../../content/campaign-posts.json";
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

const postsFile = rawPosts as PostsFile;

function normalizePost(post: CampaignPostJson): CampaignPostJson {
  const p = { ...post };
  p.tags = toStringList(p.tags, "tag");
  if (p.slides) p.slides = toStringList(p.slides, "slide");
  if (p.cardLayout === "default") delete p.cardLayout;
  if (p.mediaAspect === "default") delete p.mediaAspect;
  return p;
}

export function getSocialPosts() {
  const items = postsFile.posts
    .filter((p) => p.enabled !== false && !p.id.startsWith("_"))
    .map(({ enabled: _e, ...post }) => normalizePost(post));

  return {
    subtitle: meta.subtitle,
    items,
  };
}
