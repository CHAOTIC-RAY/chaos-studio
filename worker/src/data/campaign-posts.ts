import raw from "../../../content/campaign-posts.json";

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
  /** Basenames under /images/posts/{id}/ — e.g. slide-01, slide-02 */
  slides?: string[];
  video?: string;
  poster?: string;
};

type CampaignFile = {
  subtitle: string;
  posts: CampaignPostJson[];
};

const file = raw as CampaignFile;

function normalizePost(post: CampaignPostJson): CampaignPostJson {
  const p = { ...post };
  if (p.cardLayout === "default") delete p.cardLayout;
  if (p.mediaAspect === "default") delete p.mediaAspect;
  return p;
}

export function getSocialPosts() {
  const items = file.posts
    .filter((p) => p.enabled !== false && !p.id.startsWith("_"))
    .map(({ enabled: _e, ...post }) => normalizePost(post));

  return {
    subtitle: file.subtitle,
    items,
  };
}
