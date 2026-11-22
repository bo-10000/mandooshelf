/**
 * 카테고리 목록의 필터 — 읽음 상태 · 태그 · 검색어 · 정렬.
 * 상태를 URL 쿼리에 남겨서 링크로 공유해도 같은 화면이 열린다.
 */

type Status = 'all' | 'unread' | 'read';

interface State {
  status: Status;
  tag: string;
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
  const statusButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-status]'));
  const tagButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tag]'));
  const searchInput = root.querySelector<HTMLInputElement>('[data-search]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-sort]');
  const countEl = root.querySelector<HTMLElement>('[data-visible-count]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset]');
  const tagExtras = Array.from(root.querySelectorAll<HTMLElement>('[data-tag-extra]'));
  const tagToggle = root.querySelector<HTMLButtonElement>('[data-tag-toggle]');

  const params = new URLSearchParams(window.location.search);
  const validStatus = (value: string | null): Status =>
    value === 'read' || value === 'unread' ? value : 'all';
  const validSort = (value: string | null): string =>
    ['published-desc', 'published-asc', 'year-desc', 'title'].includes(value ?? '')
      ? (value as string)
      : 'published-desc';

  const state: State = {
    status: validStatus(params.get('status')),
    tag: params.get('tag') ?? '',
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
    for (const button of statusButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.status === state.status));
    }
    for (const button of tagButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.tag === state.tag));
    }
    if (sortSelect) sortSelect.value = state.sort;
  }

  function apply(updateUrl = true) {
    const query = state.q.trim().toLowerCase();
    let visible = 0;

    for (const item of items) {
      const statusOk = state.status === 'all' || item.dataset.status === state.status;
      const itemTags = (item.dataset.tags ?? '').split('|');
      const tagOk = !state.tag || itemTags.includes(state.tag.toLowerCase());
      const searchOk = !query || (item.dataset.search ?? '').includes(query);
      const show = statusOk && tagOk && searchOk;
      item.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    }

    if (countEl) countEl.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
    syncControls();

    if (updateUrl) {
      const next = new URLSearchParams();
      if (state.status !== 'all') next.set('status', state.status);
      if (state.tag) next.set('tag', state.tag);
      if (query) next.set('q', state.q.trim());
      if (state.sort !== 'published-desc') next.set('sort', state.sort);
      const search = next.toString();
      window.history.replaceState(null, '', window.location.pathname + (search ? `?${search}` : ''));
    }
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
      state.tag = state.tag === tag ? '' : tag;
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
    }
  }

  if (tagToggle) {
    tagToggle.addEventListener('click', () => {
      setTagsExpanded(tagToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      state.status = 'all';
      state.tag = '';
      state.q = '';
      state.sort = 'published-desc';
      if (searchInput) searchInput.value = '';
      applySort();
      apply();
    });
  }

  // URL 로 들어온 태그가 접힌 쪽에 있으면 펼쳐서 현재 선택을 보이게 한다.
  if (state.tag && tagExtras.some((extra) => extra.dataset.tag === state.tag)) {
    setTagsExpanded(true);
  }

  applySort();
  apply(false);
}
