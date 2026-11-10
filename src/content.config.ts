import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    primaryKeyword: z.string(),
    relatedKeywords: z.array(z.string()).default([]),
    order: z.number(),
    reviewedDate: z.string(),
    related: z.array(z.string()).default([]),
    sources: z.array(z.object({ title: z.string(), url: z.url() })),
  }),
});
export const collections = { guides };
