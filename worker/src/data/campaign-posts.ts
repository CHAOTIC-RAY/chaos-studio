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
};

type CampaignFile = {
  subtitle: string;
  posts: CampaignPostJson[];
};

const file = raw as CampaignFile;

export function getSocialPosts() {
  const items = file.posts
    .filter((p) => p.enabled !== false && !p.id.startsWith("_"))
    .map(({ enabled: _e, ...post }) => post);

  return {
    subtitle: file.subtitle,
    items,
  };
}
