import portfolioBase from "../../../content/portfolio.json";
import { getSocialPosts } from "./campaign-posts";

export const portfolio = {
  ...portfolioBase,
  socialPosts: getSocialPosts(),
};

export type Portfolio = typeof portfolio;
