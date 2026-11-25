import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 노트는 `site/` 밖 저장소 루트의 카테고리 폴더에 그대로 둔다.
 * (recommendation/**, ai-agent/**, etc/**) — 파일을 옮기지 않고 읽기만 한다.
 */
const CATEGORY_DIRS = ['recommendation', 'ai-agent', 'etc'];

/** published_at / read_at 은 `2026-11-16`, `2026-11`, `2026` 등으로 제각각이라 최대한 관대하게 받는다. */
const looseDate = z.union([z.string(), z.date(), z.number()]).nullish();

const tags = z.preprocess((value) => {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()));

const status = z.preprocess(
  (value) => (String(value ?? 'unread').trim().toLowerCase() === 'read' ? 'read' : 'unread'),
  z.enum(['read', 'unread']),
);

const notes = defineCollection({
  loader: glob({
    base: '..',
    pattern: CATEGORY_DIRS.flatMap((dir) => [`${dir}/**/*.md`, `!${dir}/**/README.md`]),
    // id 를 원본 경로 그대로 두어 슬러그 규칙을 lib/notes.ts 한 곳에서만 관리한다.
    generateId: ({ entry }) => entry.replace(/\.md$/i, ''),
  }),
  schema: z.object({
    title: z.string().optional().default(''),
    source: z.string().optional().default(''),
    url: z.string().optional().default(''),
    tags,
    status,
    published_at: looseDate,
    read_at: looseDate,
  }),
});

export const collections = { notes };
