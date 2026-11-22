/**
 * 통합 목록 필터 — 카테고리 · 읽음 상태 · 태그(다중 선택) · 검색어 · 정렬.
 * 상태를 URL 쿼리에 남겨서 링크로 공유해도 같은 화면이 열린다.
 *   /search/?category=recommendation&status=unread&tags=cold-start,embedding&q=netflix&sort=title
 */

type Status = 'all' | 'unread' | 'read';

interface State {
  category: string;
  status: Status;
  /** 선택한 태그 (원래 표기 유지) */
  tags: string[];
  q: string;
  sort: string;
}

const root = document.querySelector<HTMLElement>('[data-filter-root]');

if (root) init(root);

function init(container: HTMLElement) {
  const root = container;
  const list = document.querySelector<HTMLElement>('[data-note-list]');
  const empty = document.querySelector<HTMLElement>('[data-note-empty]');
  if (!list) return;

  const items = Array.from(list.querySelectorAll<HTMLElement>('[data-note]'));
  const categoryButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-category]'));
  const statusButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-status]'));
  const tagButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tag]'));
  const searchInput = root.querySelector<HTMLInputElement>('[data-search]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-sort]');
  const countEl = root.querySelector<HTMLElement>('[data-visible-count]');
  const stateEl = root.querySelector<HTMLElement>('[data-filter-state]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset]');
  const clearTagsButton = root.querySelector<HTMLButtonElement>('[data-clear-tags]');
  const tagExtras = Array.from(root.querySelectorAll<HTMLElement>('[data-tag-extra]'));
  const tagToggle = root.querySelector<HTMLButtonElement>('[data-tag-toggle]');

  const params = new URLSearchParams(window.location.search);
  const validStatus = (value: string | null): Status =>
    value === 'read' || value === 'unread' ? value : 'all';
  const validSort = (value: string | null): string =>
    ['published-desc', 'published-asc', 'year-desc', 'title'].includes(value ?? '')
      ? (value as string)
      : 'published-desc';

  /** 태그는 표기(대소문자·기호)를 살려서 다루고, 비교할 때만 소문자로 맞춘다. */
  const tagLookup = new Map<string, string>();
  for (const button of tagButtons) {
    const tag = button.dataset.tag ?? '';
    if (tag) tagLookup.set(tag.toLowerCase(), tag);
  }

  const requestedCategory = params.get('category') ?? 'all';
  const validCategory = ['all', ...categoryButtons.map((button) => button.dataset.category ?? '')].includes(
    requestedCategory,
  )
    ? requestedCategory
    : 'all';

  // 예전 링크의 `?tag=`(단일)도 `?tags=`와 같이 읽는다.
  const tagParam = params.get('tags') ?? params.get('tag') ?? '';
  const initialTags: string[] = [];
  for (const raw of tagParam.split(',')) {
    const tag = tagLookup.get(raw.trim().toLowerCase());
    if (tag && !initialTags.includes(tag)) initialTags.push(tag);
  }

  const state: State = {
    category: validCategory,
    status: validStatus(params.get('status')),
    tags: initialTags,
    q: params.get('q') ?? '',
    sort: validSort(params.get('sort')),
  };

  if (searchInput) searchInput.value = state.q;

  function published(item: HTMLElement): number {
    const value = Number(item.dataset.published);
    return Number.isFinite(value) && value > 0 ? value : Number.NEGATIVE_INFINITY;
  }

  function year(item: HTMLElement): number {
    const value = Number(item.dataset.year);
    return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  }

  function applySort() {
    const sorted = [...items].sort((a, b) => {
      switch (state.sort) {
        case 'published-asc': {
          const ap = published(a);
          const bp = published(b);
          const av = ap === Number.NEGATIVE_INFINITY ? Number.POSITIVE_INFINITY : ap;
          const bv = bp === Number.NEGATIVE_INFINITY ? Number.POSITIVE_INFINITY : bp;
          return av - bv;
        }
        case 'year-desc': {
          const diff = year(b) - year(a);
          return diff !== 0 ? diff : published(b) - published(a);
        }
        case 'title':
          return (a.textContent ?? '').localeCompare(b.textContent ?? '', 'ko');
        default:
          return published(b) - published(a);
      }
    });
    for (const item of sorted) list!.append(item);
  }

  function syncControls() {
    for (const button of categoryButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.category === state.category));
    }
    for (const button of statusButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.status === state.status));
    }
    for (const button of tagButtons) {
      button.setAttribute(
        'aria-pressed',
        String(state.tags.some((tag) => tag.toLowerCase() === (button.dataset.tag ?? '').toLowerCase())),
      );
    }
    if (sortSelect) sortSelect.value = state.sort;
    if (clearTagsButton) {
      const wrapper = clearTagsButton.closest('li');
      clearTagsButton.hidden = state.tags.length === 0;
      if (wrapper) wrapper.hidden = state.tags.length === 0;
    }
  }

  function syncUrl() {
    const next = new URLSearchParams();
    if (state.category !== 'all') next.set('category', state.category);
    if (state.status !== 'all') next.set('status', state.status);
    if (state.tags.length > 0) next.set('tags', state.tags.join(','));
    const query = state.q.trim();
    if (query) next.set('q', query);
    if (state.sort !== 'published-desc') next.set('sort', state.sort);
    const search = next.toString();
    window.history.replaceState(null, '', window.location.pathname + (search ? `?${search}` : ''));
  }

  function apply() {
    const query = state.q.trim().toLowerCase();
    const selected = state.tags.map((tag) => tag.toLowerCase());
    let visible = 0;

    for (const item of items) {
      const categoryOk = state.category === 'all' || item.dataset.category === state.category;
      const statusOk = state.status === 'all' || item.dataset.status === state.status;
      const itemTags = (item.dataset.tags ?? '').split('|');
      const tagsOk = selected.every((tag) => itemTags.includes(tag));
      const searchOk = !query || (item.dataset.search ?? '').includes(query);
      const show = categoryOk && statusOk && tagsOk && searchOk;
      item.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    }

    if (countEl) countEl.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
    if (stateEl) {
      const active = state.tags.length > 0;
      stateEl.hidden = !active;
      stateEl.textContent = active ? `태그 ${state.tags.length}개 모두 포함` : '';
    }
    syncControls();
    syncUrl();
  }

  for (const button of categoryButtons) {
    button.addEventListener('click', () => {
      state.category = button.dataset.category ?? 'all';
      apply();
    });
  }

  for (const button of statusButtons) {
    button.addEventListener('click', () => {
      state.status = (button.dataset.status as Status) ?? 'all';
      apply();
    });
  }

  for (const button of tagButtons) {
    button.addEventListener('click', () => {
      const tag = button.dataset.tag ?? '';
      if (!tag) return;
      const index = state.tags.findIndex((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase());
      if (index === -1) state.tags.push(tag);
      else state.tags.splice(index, 1);
      apply();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.q = searchInput.value;
      apply();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      applySort();
      apply();
    });
  }

  function setTagsExpanded(expanded: boolean) {
    for (const extra of tagExtras) {
      extra.hidden = !expanded;
      const chip = extra.closest('li');
      if (chip) chip.hidden = !expanded;
    }
    if (tagToggle) {
      tagToggle.setAttribute('aria-expanded', String(expanded));
      tagToggle.textContent = expanded ? '태그 접기' : `태그 더 보기 +${tagExtras.length}`;
      const wrapper = tagToggle.closest('li');
      if (wrapper) wrapper.hidden = tagExtras.length === 0;
    }
  }

  if (tagToggle) {
    tagToggle.addEventListener('click', () => {
      setTagsExpanded(tagToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  if (clearTagsButton) {
    clearTagsButton.addEventListener('click', () => {
      state.tags = [];
      apply();
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      state.category = 'all';
      state.status = 'all';
      state.tags = [];
      state.q = '';
      state.sort = 'published-desc';
      if (searchInput) searchInput.value = '';
      applySort();
      apply();
    });
  }

  // URL 로 들어온 태그가 접힌 쪽에 있으면 펼쳐서 현재 선택을 보이게 한다.
  const selectedLower = new Set(state.tags.map((tag) => tag.toLowerCase()));
  if (selectedLower.size > 0 && tagExtras.some((extra) => selectedLower.has((extra.dataset.tag ?? '').toLowerCase()))) {
    setTagsExpanded(true);
  }

  applySort();
  apply();
}
