import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

/**
 * 노트는 `site/` 밖 저장소의 `notes/` 아래 카테고리 폴더에 그대로 둔다.
 * (notes/recommendation/**, notes/ai-agent/**, notes/etc/**) — 파일을 옮기지 않고 읽기만 한다.
 * `notes/` 바로 밑에 새 카테고리 폴더를 만들어도 자동으로 수집된다.
 */
const notes = defineCollection({
  loader: glob({
    base: '../notes',
    pattern: ['**/*.md', '!**/README.md'],
    // id 를 `notes/` 기준 상대경로 그대로 두어(예: recommendation/foo) 슬러그 규칙을 lib/notes.ts 한 곳에서만 관리한다.
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
