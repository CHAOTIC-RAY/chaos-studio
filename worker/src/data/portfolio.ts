import portfolioBase from "../../../content/portfolio.json";
import chaosStudio from "../../../content/chaos-studio.json";
import { getSocialPosts } from "./campaign-posts";

export const portfolio = {
  ...portfolioBase,
  chaosStudio,
  socialPosts: getSocialPosts(),
};

export type Portfolio = typeof portfolio;
