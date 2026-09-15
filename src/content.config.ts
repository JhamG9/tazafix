import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const aprende = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/aprende' }),
	schema: z.object({
		title: z.string(),
		excerpt: z.string(),
		category: z.string(),
		categoryLabel: z.string(),
		metaTitle: z.string(),
		metaDescription: z.string(),
		keywords: z.array(z.string()),
		faqs: z
			.array(
				z.object({
					question: z.string(),
					answer: z.string(),
				})
			)
			.optional(),
	}),
});

export const collections = { aprende };
