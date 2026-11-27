/**
 * 통합 목록 필터 — 카테고리 · 읽음 상태 · 출처 · 태그(다중 선택) · 검색어 · 정렬.
 * 상태를 URL 쿼리에 남겨서 링크로 공유해도 같은 화면이 열린다.
 *   /search/?category=recommendation&status=unread&source=OpenAI&tags=cold-start,embedding&q=netflix
 *
 * 필터끼리 서로 맞물려 동작한다.
 *   - 태그 칩은 지금 조건(카테고리 · 읽음 상태 · 출처 · 검색어 · 이미 선택한 다른 태그)을 만족하는
 *     글에 실제로 들어 있는 태그만, 글 수 많은 순으로 남긴다.
 *   - 출처 버튼의 편수도 다른 조건이 바뀔 때마다 다시 세고, 조건에 없는 출처는 숨긴다.
 *   - 조건이 바뀌어 사라진 태그·출처 선택은 자동으로 풀어 0건에 갇히지 않게 한다.
 */

type Status = 'all' | 'unread' | 'read';

interface State {
  category: string;
  status: Status;
  source: string;
  /** 선택한 태그 (원래 표기 유지) */
  tags: string[];
  q: string;
  sort: string;
}

interface ItemMeta {
  item: HTMLElement;
  category: string;
  status: string;
  source: string;
  tags: string[];
  search: string;
}

interface TagChip {
  button: HTMLButtonElement;
  li: HTMLElement;
  tag: string;
  lower: string;
  count: number;
  countEl: HTMLElement | null;
}

interface SourceButton {
  button: HTMLButtonElement;
  source: string;
  countEl: HTMLElement | null;
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
  const sourceButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-source]'));
  const tagButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tag]'));
  const searchInput = root.querySelector<HTMLInputElement>('[data-search]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-sort]');
  const countEl = root.querySelector<HTMLElement>('[data-visible-count]');
  const clearSearchButton = root.querySelector<HTMLButtonElement>('[data-search-clear]');
  const clearTagsButton = root.querySelector<HTMLButtonElement>('[data-clear-tags]');
  const tagRow = root.querySelector<HTMLElement>('[data-tag-row]');
  const tagList = root.querySelector<HTMLElement>('[data-tag-list]');
  const tagToggle = root.querySelector<HTMLButtonElement>('[data-tag-toggle]');
  const filterToggle = root.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const filterPanel = root.querySelector<HTMLElement>('[data-filter-panel]');
  const toggleCount = root.querySelector<HTMLElement>('[data-filter-toggle-count]');
  const activeFilters = root.querySelector<HTMLElement>('[data-active-filters]');

  // 처음에 펼쳐 보여 줄 태그 수는 FilterBar 가 내려 준다.
  const limit = Number(tagList?.dataset.tagLimit ?? '');
  const visibleLimit = Number.isFinite(limit) && limit > 0 ? limit : 12;

  const metas: ItemMeta[] = items.map((item) => ({
    item,
    category: item.dataset.category ?? '',
    status: item.dataset.status ?? '',
    source: item.dataset.source ?? '',
    tags: (item.dataset.tags ?? '').split('|').filter(Boolean),
    search: item.dataset.search ?? '',
  }));

  const tagChips: TagChip[] = tagButtons
    .map((button) => ({
      button,
      li: button.closest('li') as HTMLElement | null,
      tag: button.dataset.tag ?? '',
      lower: (button.dataset.tag ?? '').toLowerCase(),
      count: 0,
      countEl: button.querySelector<HTMLElement>('[data-tag-count]'),
    }))
    .filter((chip): chip is TagChip => Boolean(chip.tag && chip.li));

  const sourceList: SourceButton[] = sourceButtons.map((button) => ({
    button,
    source: button.dataset.source ?? 'all',
    countEl: button.querySelector<HTMLElement>('[data-source-count]'),
  }));

  let tagsExpanded = false;

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

  const requestedSource = params.get('source') ?? 'all';
  const validSource = ['all', ...sourceButtons.map((button) => button.dataset.source ?? '')].includes(
    requestedSource,
  )
    ? requestedSource
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
    source: validSource,
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

  /** 입력값이 있을 때만 검색창 오른쪽 끝의 × 버튼을 보여 준다. */
  function syncClearButton() {
    if (!clearSearchButton || !searchInput) return;
    clearSearchButton.hidden = searchInput.value.length === 0;
  }

  function syncControls() {
    for (const button of categoryButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.category === state.category));
    }
    for (const button of statusButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.status === state.status));
    }
    for (const button of sourceButtons) {
      button.setAttribute('aria-pressed', String((button.dataset.source ?? 'all') === state.source));
    }
    for (const button of tagButtons) {
      button.setAttribute(
        'aria-pressed',
        String(state.tags.some((tag) => tag.toLowerCase() === (button.dataset.tag ?? '').toLowerCase())),
      );
    }
    if (sortSelect) sortSelect.value = state.sort;
    if (toggleCount) {
      const active = activeCount();
      const expanded = filterPanel ? !filterPanel.hidden : false;
      toggleCount.textContent = active > 0 ? String(active) : '';
      toggleCount.hidden = active === 0 || !expanded;
    }
    if (clearTagsButton) {
      const wrapper = clearTagsButton.closest('li');
      clearTagsButton.hidden = state.tags.length === 0;
      if (wrapper) wrapper.hidden = state.tags.length === 0;
    }
  }

  /** 지금 걸려 있는 필터 수 — 검색어는 검색창에 보이니 세지 않는다. */
  function activeCount(): number {
    return (
      (state.category !== 'all' ? 1 : 0) +
      (state.status !== 'all' ? 1 : 0) +
      (state.source !== 'all' ? 1 : 0) +
      state.tags.length
    );
  }

  /** 필터 버튼·분류 이름만 (편수 뺀 글자). */
  function labelOf(button: HTMLButtonElement | undefined, fallback: string): string {
    if (!button) return fallback;
    const clone = button.cloneNode(true) as HTMLElement;
    for (const count of Array.from(clone.querySelectorAll('.segmented__count'))) count.remove();
    return clone.textContent?.trim() || fallback;
  }

  /**
   * 필터를 접어 둔 동안, 걸려 있는 필터를 칩으로 보여 준다 — 누르면 그 필터만 풀린다.
   */
  function renderActiveFilters() {
    if (!activeFilters) return;

    const items: { label: string; clear: () => void }[] = [];
    if (state.category !== 'all') {
      const button = categoryButtons.find((candidate) => candidate.dataset.category === state.category);
      items.push({
        label: labelOf(button, state.category),
        clear: () => {
          state.category = 'all';
        },
      });
    }
    if (state.status !== 'all') {
      const button = statusButtons.find((candidate) => candidate.dataset.status === state.status);
      items.push({
        label: labelOf(button, state.status),
        clear: () => {
          state.status = 'all';
        },
      });
    }
    if (state.source !== 'all') {
      items.push({
        label: state.source,
        clear: () => {
          state.source = 'all';
        },
      });
    }
    for (const tag of state.tags) {
      items.push({
        label: tag,
        clear: () => {
          state.tags = state.tags.filter((selected) => selected !== tag);
        },
      });
    }

    activeFilters.replaceChildren();
    const collapsed = filterPanel ? filterPanel.hidden : true;
    activeFilters.hidden = !collapsed || items.length === 0;
    if (activeFilters.hidden) return;

    for (const item of items) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tag-chip';
      chip.setAttribute('aria-pressed', 'true');
      chip.setAttribute('aria-label', `${item.label} 필터 해제`);
      chip.textContent = item.label;
      const x = document.createElement('span');
      x.className = 'tag-chip__x';
      x.setAttribute('aria-hidden', 'true');
      x.textContent = '×';
      chip.append(x);
      chip.addEventListener('click', () => {
        item.clear();
        apply();
      });
      activeFilters.append(chip);
    }
  }

  function syncUrl() {
    const next = new URLSearchParams();
    if (state.category !== 'all') next.set('category', state.category);
    if (state.status !== 'all') next.set('status', state.status);
    if (state.source !== 'all') next.set('source', state.source);
    if (state.tags.length > 0) next.set('tags', state.tags.join(','));
    const query = state.q.trim();
    if (query) next.set('q', query);
    if (state.sort !== 'published-desc') next.set('sort', state.sort);
    const search = next.toString();
    window.history.replaceState(null, '', window.location.pathname + (search ? `?${search}` : ''));
  }

  /** 출처 버튼의 편수 갱신 — 0편인 출처는 숨기고, '전체'는 남은 출처의 합. */
  function renderSources(counts: Map<string, number>) {
    let total = 0;
    for (const value of counts.values()) total += value;

    for (const entry of sourceList) {
      const isAll = entry.source === 'all';
      const count = isAll ? total : (counts.get(entry.source) ?? 0);
      const isSelected = isAll ? state.source === 'all' : state.source === entry.source;
      if (entry.countEl) entry.countEl.textContent = String(count);
      entry.button.hidden = !isAll && count === 0 && !isSelected;
    }
  }

  /**
   * 태그 칩 갱신 — `counts` 는 지금 조건(+선택한 태그)을 만족하는 글에서 센 태그별 편수.
   * 글 수 많은 순으로 줄 세우고, 선택한 태그는 같은 수 안에서 앞으로 모아 해제하기 쉽게 둔다.
   */
  function renderTags(counts: Map<string, number>, selected: Set<string>) {
    const available: TagChip[] = [];

    for (const chip of tagChips) {
      const count = counts.get(chip.lower) ?? 0;
      const isSelected = selected.has(chip.lower);
      chip.count = count;
      chip.button.title = `${chip.tag} · ${count}개`;
      chip.button.setAttribute('aria-label', `${chip.tag} ${count}개`);
      if (chip.countEl) chip.countEl.textContent = String(count);
      if (count > 0 || isSelected) available.push(chip);
    }

    // 글 수 많은 순, 같은 수면 이름순. 선택한 태그는 그 안에서 앞으로 모아 해제하기 쉽게 둔다.
    const ranked = [...available].sort(
      (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'en'),
    );
    const pinned = state.tags
      .map((tag) => ranked.find((chip) => chip.lower === tag.toLowerCase()))
      .filter((chip): chip is TagChip => Boolean(chip));
    const pinnedSet = new Set(pinned);
    const ordered = [...pinned, ...ranked.filter((chip) => !pinnedSet.has(chip))];

    const extra = Math.max(0, ordered.length - visibleLimit);
    if (extra === 0) tagsExpanded = false;
    const shown = new Set(tagsExpanded ? ordered : ordered.slice(0, visibleLimit));

    // 순서를 실제로 바꿔야 글 수 순서가 화면에 반영된다(토글·해제 버튼은 항상 끝).
    if (tagList) {
      for (const chip of ordered) tagList.append(chip.li);
      const toggleItem = tagToggle?.closest('li');
      if (toggleItem) tagList.append(toggleItem);
      const clearItem = clearTagsButton?.closest('li');
      if (clearItem) tagList.append(clearItem);
    }

    for (const chip of tagChips) chip.li.hidden = !shown.has(chip);

    if (tagRow) tagRow.hidden = ordered.length === 0;

    if (tagToggle) {
      tagToggle.setAttribute('aria-expanded', String(tagsExpanded));
      tagToggle.textContent = tagsExpanded ? '태그 접기' : `태그 더 보기 +${extra}`;
      const wrapper = tagToggle.closest('li');
      if (wrapper) wrapper.hidden = extra === 0;
    }
  }

  function apply() {
    const query = state.q.trim().toLowerCase();
    const base = metas.filter(
      (meta) =>
        (state.category === 'all' || meta.category === state.category) &&
        (state.status === 'all' || meta.status === state.status) &&
        (!query || meta.search.includes(query)),
    );
    const baseSet = new Set(base);

    // 고른 출처에 없는 태그 선택은 풀어 준다.
    if (state.tags.length > 0) {
      const reachable = new Set<string>();
      for (const meta of base) {
        if (state.source !== 'all' && meta.source !== state.source) continue;
        for (const tag of meta.tags) reachable.add(tag);
      }
      state.tags = state.tags.filter((tag) => reachable.has(tag.toLowerCase()));
    }

    const activeTags = state.tags.map((tag) => tag.toLowerCase());
    const tagsOk = (meta: ItemMeta) => activeTags.every((tag) => meta.tags.includes(tag));

    // 출처별 편수는 태그까지 반영해 다시 센다. 0편이 된 출처 선택은 풀어 준다.
    const sourceCounts = new Map<string, number>();
    for (const meta of base) {
      if (!tagsOk(meta)) continue;
      sourceCounts.set(meta.source, (sourceCounts.get(meta.source) ?? 0) + 1);
    }
    if (state.source !== 'all' && !sourceCounts.has(state.source)) state.source = 'all';

    let visible = 0;
    const counts = new Map<string, number>();

    for (const meta of metas) {
      const show = baseSet.has(meta) && tagsOk(meta) && (state.source === 'all' || meta.source === state.source);
      meta.item.classList.toggle('is-hidden', !show);
      if (!show) continue;
      visible += 1;
      for (const tag of meta.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }

    if (countEl) countEl.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
    renderSources(sourceCounts);
    renderTags(counts, new Set(activeTags));
    syncControls();
    renderActiveFilters();
    syncClearButton();
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

  for (const button of sourceButtons) {
    button.addEventListener('click', () => {
      state.source = button.dataset.source ?? 'all';
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

  // 검색창 안 × : 값을 비우고 바로 필터·주소를 다시 맞춘다.
  if (clearSearchButton && searchInput) {
    clearSearchButton.addEventListener('click', () => {
      searchInput.value = '';
      state.q = '';
      apply();
      searchInput.focus();
    });
  }

  // 검색 버튼/Enter: 지금 입력한 값으로 바로 적용하고 모바일 키보드를 닫는다.
  const searchForm = root.querySelector<HTMLFormElement>('[data-search-form]');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!searchInput) return;
      state.q = searchInput.value;
      apply();
      searchInput.blur();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      applySort();
      apply();
    });
  }

  if (filterToggle) {
    filterToggle.addEventListener('click', () => {
      const expand = filterToggle.getAttribute('aria-expanded') !== 'true';
      if (filterPanel) filterPanel.hidden = !expand;
      filterToggle.setAttribute('aria-expanded', String(expand));
      apply();
    });
  }

  if (tagToggle) {
    tagToggle.addEventListener('click', () => {
      tagsExpanded = tagToggle.getAttribute('aria-expanded') !== 'true';
      apply();
    });
  }

  if (clearTagsButton) {
    clearTagsButton.addEventListener('click', () => {
      state.tags = [];
      apply();
    });
  }

  applySort();
  apply();
}
