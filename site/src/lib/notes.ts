import { getCollection, type CollectionEntry } from 'astro:content';

export type RawNote = CollectionEntry<'notes'>;

export interface ParsedDate {
  /** 정렬용 ISO 문자열 (YYYY / YYYY-MM / YYYY-MM-DD) */
  iso: string;
  /** 화면 표기 (2026.11.16 / 2026.11 / 2026) */
  label: string;
  /** 정렬용 타임스탬프 */
  sort: number;
  year: number;
}

export interface Note {
  id: string;
  category: string;
  categoryTitle: string;
  slug: string;
  title: string;
  source: string;
  url: string;
  tags: string[];
  isRead: boolean;
  published: ParsedDate | null;
  readAt: ParsedDate | null;
  year: number | null;
  href: string;
  /** 제목·출처·태그를 합친 검색용 문자열 */
  search: string;
}

export interface CategorySummary {
  id: string;
  title: string;
  notes: Note[];
  total: number;
  read: number;
  unread: number;
}

/* ---------------------------------- URL ---------------------------------- */

/** site/base 를 뺀 순수 경로 → 실제 링크 (GitHub Pages `/mandooshelf` 대응) */
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function href(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}

export interface SearchQuery {
  category?: string;
  status?: 'read' | 'unread';
  tags?: string[];
  q?: string;
  sort?: string;
}

/**
 * 통합 검색 페이지(`/search/`) 링크.
 * 필터 상태는 쿼리로만 표현하고, 기본값(all / 최신순 / 빈 검색어)은 주소에서 뺀다.
 */
export function searchHref(query: SearchQuery = {}): string {
  const params = new URLSearchParams();
  if (query.category && query.category !== 'all') params.set('category', query.category);
  if (query.status === 'read' || query.status === 'unread') params.set('status', query.status);
  if (query.tags && query.tags.length > 0) params.set('tags', query.tags.join(','));
  if (query.q && query.q.trim()) params.set('q', query.q.trim());
  if (query.sort && query.sort !== 'published-desc') params.set('sort', query.sort);
  const search = params.toString();
  return `${href('search/')}${search ? `?${search}` : ''}`;
}

/* --------------------------------- 슬러그 --------------------------------- */

/**
 * 파일명에서 URL 슬러그를 만든다.
 * `[UNREAD] ` 접두사, 대괄호, 공백, 괄호를 모두 정규화해 없애므로
 * 읽음 처리로 파일명이 `[UNREAD] ` → 없음 으로 바뀌어도 URL 은 그대로다.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\[unread\]/gi, ' ')
    .replace(/['"’”“]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function noteSlug(id: string): string {
  const filename = id.split('/').pop() ?? id;
  return slugify(filename.replace(/\.mdx?$/i, ''));
}

/* ---------------------------------- 날짜 ---------------------------------- */

function toParsedDate(value: unknown): ParsedDate | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return {
      iso: `${year}-${month}-${day}`,
      label: `${year}.${month}.${day}`,
      sort: Date.UTC(year, Number(month) - 1, Number(day)),
      year,
    };
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{4})(?:[.\-/년]\s*)?(?:(\d{1,2})(?:[.\-/월]\s*)?(?:(\d{1,2}))?)?/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : null;
  const day = match[3] ? Number(match[3]) : null;
  if (!year || (month !== null && (month < 1 || month > 12))) return null;

  const mm = month ? String(month).padStart(2, '0') : null;
  const dd = day ? String(day).padStart(2, '0') : null;

  return {
    iso: dd ? `${year}-${mm}-${dd}` : mm ? `${year}-${mm}` : `${year}`,
    label: dd ? `${year}.${mm}.${dd}` : mm ? `${year}.${mm}` : `${year}`,
    sort: Date.UTC(year, month ? month - 1 : 0, day ?? 1),
    year,
  };
}

/** 파일명 끝의 `(YYYY)` — 발행일이 비어 있을 때 연도 대체값 */
function yearFromId(id: string): number | null {
  const match = id.match(/\((\d{4})\)\s*(?:\.md)?$/);
  return match ? Number(match[1]) : null;
}

/* --------------------------------- 카테고리 -------------------------------- */

const CATEGORY_META: Record<string, { title: string }> = {
  recommendation: {
    title: '추천 시스템',
  },
  'ai-agent': {
    title: 'AI 에이전트',
  },
  etc: {
    title: '기타',
  },
};

export function categoryMeta(id: string) {
  return CATEGORY_META[id] ?? { title: id };
}

/* ---------------------------------- 변환 ---------------------------------- */

function toNote(entry: RawNote): Note {
  const category = entry.id.split('/')[0] ?? '';
  const data = entry.data;
  const slug = noteSlug(entry.id);
  const filename = entry.id.split('/').pop() ?? entry.id;
  const published = toParsedDate(data.published_at);
  const readAt = toParsedDate(data.read_at);
  const isRead = data.status === 'read';
  const tagsList = data.tags ?? [];
  const title = data.title?.trim() || filename.replace(/\[UNREAD\]\s*/i, '').replace(/\.mdx?$/i, '');

  return {
    id: entry.id,
    category,
    categoryTitle: categoryMeta(category).title,
    slug,
    title,
    source: data.source ?? '',
    url: data.url ?? '',
    tags: tagsList,
    isRead,
    published,
    readAt,
    year: published?.year ?? yearFromId(entry.id),
    href: href(`${category}/${slug}/`),
    search: [title, data.source ?? '', tagsList.join(' '), category].join(' ').toLowerCase(),
  };
}

function sortByPublishedDesc(a: Note, b: Note): number {
  const at = a.published?.sort ?? Number.NEGATIVE_INFINITY;
  const bt = b.published?.sort ?? Number.NEGATIVE_INFINITY;
  if (at !== bt) return bt - at;
  return a.title.localeCompare(b.title, 'ko');
}

function sortByReadDesc(a: Note, b: Note): number {
  const at = a.readAt?.sort ?? Number.NEGATIVE_INFINITY;
  const bt = b.readAt?.sort ?? Number.NEGATIVE_INFINITY;
  if (at !== bt) return bt - at;
  return sortByPublishedDesc(a, b);
}

/** slug 충돌 시 뒤에 -2, -3 … 을 붙여 URL 이 겹치지 않게 한다. */
function resolveSlugCollisions(notes: Note[]): Note[] {
  const used = new Map<string, number>();
  for (const note of [...notes].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = `${note.category}/${note.slug}`;
    const count = used.get(key) ?? 0;
    used.set(key, count + 1);
    if (count > 0) {
      note.slug = `${note.slug}-${count + 1}`;
      note.href = href(`${note.category}/${note.slug}/`);
    }
  }
  return notes;
}

/* ---------------------------------- 조회 ---------------------------------- */

export async function getAllNotes(): Promise<Note[]> {
  const entries = await getCollection('notes');
  return resolveSlugCollisions(entries.map(toNote)).sort(sortByPublishedDesc);
}

export async function getCategories(): Promise<CategorySummary[]> {
  const notes = await getAllNotes();
  const ids = [...new Set(notes.map((note) => note.category))].sort((a, b) =>
    a.localeCompare(b, 'en'),
  );

  return ids.map((id) => {
    const own = notes.filter((note) => note.category === id);
    // 폴더 순서는 CATEGORY_META 순서를 따른다.
    return {
      id,
      ...categoryMeta(id),
      notes: own,
      total: own.length,
      read: own.filter((note) => note.isRead).length,
      unread: own.filter((note) => !note.isRead).length,
    };
  }).sort((a, b) => {
    const order = Object.keys(CATEGORY_META);
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function totalSummary(notes: Note[]) {
  const read = notes.filter((note) => note.isRead).length;
  return { total: notes.length, read, unread: notes.length - read };
}

export function tagCounts(notes: Note[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'en'));
}

export function sortByRead(notes: Note[], limit?: number): Note[] {
  const read = notes.filter((note) => note.isRead).sort(sortByReadDesc);
  return typeof limit === 'number' ? read.slice(0, limit) : read;
}
