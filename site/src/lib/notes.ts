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
  /** 출처 필터용 대표 출처명 (OpenAI · Science, OpenAI for Business → OpenAI) */
  sourceGroup: string;
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
  source?: string;
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
  if (query.source && query.source !== 'all') params.set('source', query.source);
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

/* ---------------------------------- 출처 ---------------------------------- */

/**
 * `source` 값의 세부 구분(`·` 뒤 매체·행사명, 부가 설명)을 떼고 대표 출처명으로 묶는다.
 *   "OpenAI · Science", "OpenAI for Business · Customer Story" → OpenAI
 *   "TOSS Tech" → Toss, "kakao tech · if(kakao)25" → Kakao, "Netflix TechBlog" → Netflix
 */
const SOURCE_RULES: { match: RegExp; label: string }[] = [
  { match: /^openai/i, label: 'OpenAI' },
  { match: /^naver/i, label: 'NAVER D2' },
  { match: /^toss/i, label: 'Toss' },
  { match: /^kakao/i, label: 'Kakao' },
  { match: /^spotify/i, label: 'Spotify' },
  { match: /^pinterest/i, label: 'Pinterest' },
  { match: /^netflix/i, label: 'Netflix' },
  { match: /^cloudflare/i, label: 'Cloudflare' },
];

export function sourceGroup(source: string): string {
  const head = source.split('·')[0].replace(/\([^)]*\)/g, '').trim();
  if (!head) return '기타';
  const rule = SOURCE_RULES.find((entry) => entry.match.test(head));
  return rule ? rule.label : head;
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
    sourceGroup: sourceGroup(data.source ?? ''),
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

/** 대표 출처명별 편수 — 많은 순, 같으면 이름순 */
export function sourceCounts(notes: Note[]): { source: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    const source = note.sourceGroup || '기타';
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source, 'en'));
}

export function sortByRead(notes: Note[], limit?: number): Note[] {
  const read = notes.filter((note) => note.isRead).sort(sortByReadDesc);
  return typeof limit === 'number' ? read.slice(0, limit) : read;
}

/* -------------------------------- 읽기 달력 -------------------------------- */

export type CalendarLevel = 0 | 1 | 2 | 3;

export interface CalendarNoteLink {
  title: string;
  /** 글 상세 페이지 링크 (site/base 포함) */
  href: string;
}

export interface CalendarDay {
  /** YYYY-MM-DD (KST 기준 날짜) */
  date: string;
  count: number;
  level: CalendarLevel;
  /** 오늘 이후라 아직 채울 수 없는 칸 */
  future: boolean;
  /** 그날 읽은 글들 — 칸을 누르면 뜨는 목록에 쓴다. */
  notes: CalendarNoteLink[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  /** 0부터 시작하는 주 열 인덱스 */
  index: number;
  /** 그 달 이름이 덮는 주 열 수 */
  span: number;
  /** 11월 */
  label: string;
}

export interface ReadCalendar {
  weeks: CalendarWeek[];
  months: CalendarMonth[];
  /** 기간 안에서 읽은 편수 */
  total: number;
  /** 기간 안에서 읽은 날 수 */
  activeDays: number;
  /** 가장 최근에 읽은 날 (11.28), 없으면 null */
  lastRead: string | null;
  windowLabel: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** KST 기준 오늘을 UTC 자정짜리 Date 로 돌려준다. (날짜만 다룬다) */
function kstToday(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return new Date(Date.UTC(pick('year'), pick('month') - 1, pick('day')));
}

function dayKey(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * 홈 하단 잔디 히트맵용 읽기 달력.
 * `read_at` 이 있는 읽은 글을 날짜별로 묶어, 최근 `weekCount`주를 일요일 시작 7행으로 놓는다.
 */
export function readCalendar(notes: Note[], weekCount = 26): ReadCalendar {
  const byDay = new Map<string, Note[]>();
  for (const note of notes) {
    if (!note.isRead || !note.readAt || note.readAt.iso.length !== 10) continue;
    const list = byDay.get(note.readAt.iso) ?? [];
    list.push(note);
    byDay.set(note.readAt.iso, list);
  }

  const today = kstToday();
  const lastSunday = new Date(today.getTime() - today.getUTCDay() * DAY_MS);
  const firstSunday = new Date(lastSunday.getTime() - (weekCount - 1) * 7 * DAY_MS);

  const weeks: CalendarWeek[] = [];
  let total = 0;
  let activeDays = 0;

  for (let w = 0; w < weekCount; w += 1) {
    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(firstSunday.getTime() + (w * 7 + d) * DAY_MS);
      const key = dayKey(date);
      const future = date.getTime() > today.getTime();
      const dayNotes = (byDay.get(key) ?? []).map((note) => ({ title: note.title, href: note.href }));
      if (!future) {
        total += dayNotes.length;
        if (dayNotes.length > 0) activeDays += 1;
      }
      days.push({
        date: key,
        count: dayNotes.length,
        level: Math.min(dayNotes.length, 3) as CalendarLevel,
        future,
        notes: dayNotes,
      });
    }
    weeks.push({ days });
  }

  // 월 라벨은 그 달 1일이 들어 있는 주에 붙이고, 다음 라벨까지의 주 수를 span 으로 준다.
  const months: CalendarMonth[] = [];
  for (let w = 0; w < weekCount; w += 1) {
    const firstDay = weeks[w]!.days.find((day) => Number(day.date.slice(8)) === 1);
    if (w !== 0 && !firstDay) continue;
    const anchor = firstDay ?? weeks[w]!.days[0]!;
    const label = `${Number(anchor.date.slice(5, 7))}월`;
    if (months[months.length - 1]?.label === label) continue;
    months.push({ index: w, span: 1, label });
  }
  months.forEach((month, i) => {
    month.span = (months[i + 1]?.index ?? weekCount) - month.index;
  });

  const readDates = [...byDay.keys()].sort();
  const last = readDates[readDates.length - 1];

  return {
    weeks,
    months,
    total,
    activeDays,
    lastRead: last ? `${Number(last.slice(5, 7))}.${last.slice(8, 10)}` : null,
    windowLabel: `최근 ${weekCount}주`,
  };
}
