# site — mandooshelf 웹사이트

저장소 `notes/` 아래의 마크다운 노트(`notes/recommendation/**`, `notes/ai-agent/**`, `notes/etc/**`)를 그대로 읽어서 만드는 Astro 정적 사이트입니다.
노트 파일은 옮기지 않고, 웹 코드만 이 폴더에 모여 있습니다.
`notes/` 바로 밑에 새 카테고리 폴더를 만들어도 `content.config.ts`를 고치지 않고 자동으로 읽힙니다.

## 구조

```text
notes/                     # 사이트가 읽는 노트 — 카테고리 폴더별
└── {category}/[UNREAD] {slug} (YYYY).md
site/
├── astro.config.mjs       # site/base, trailing slash, 코드 하이라이트
├── src/
│   ├── content.config.ts  # ../notes 아래 .md 수집 (README.md 제외), frontmatter 스키마
│   ├── lib/notes.ts       # [UNREAD] 제거한 URL 슬러그, 날짜 정규화, 카테고리·태그 집계
│   ├── layouts/BaseLayout.astro
│   ├── components/        # NoteList, FilterBar
│   ├── scripts/notes-filter.ts
│   ├── pages/
│   │   ├── index.astro              # 홈: 카테고리 → 안 읽은 글 → 최근 읽은 글
│   │   ├── search/index.astro       # 통합 목록: 카테고리·상태·태그(다중)·검색·정렬
│   │   ├── [category]/index.astro   # 예전 카테고리 주소 → /search/?category=… 리다이렉트
│   │   ├── [category]/[slug].astro  # 글 상세
│   │   └── 404.astro
│   └── styles/global.css
└── public/
    ├── favicon.svg
    └── images/{slug}/   # 노트 본문 이미지 (원문 도표·다이어그램·화면)
```

## 로컬 실행

Node 22 이상이 필요합니다.

```bash
cd site
npm install
npm run dev      # http://localhost:4321/mandooshelf/
npm run build    # 결과물: site/dist
npm run preview
```

## 필터 주소 규칙

목록은 `/search/` 한 페이지에서 카테고리·읽음 상태·태그·검색어·정렬을 함께 건다.
선택한 상태는 주소 쿼리에 그대로 남아 공유·새로고침해도 유지된다.

| 파라미터 | 값 | 기본값(생략) |
| --- | --- | --- |
| `category` | 카테고리 폴더명 (`recommendation`, `ai-agent`, …) | 전체 |
| `status` | `unread` \| `read` | 전체 |
| `tags` | 태그를 쉼표로 연결 (`cold-start,embedding`) — 모두 포함한 글만 | 전체 |
| `q` | 제목·출처·태그·카테고리 검색어 | 없음 |
| `sort` | `published-desc` \| `published-asc` \| `year-desc` \| `title` | 최신순 |

예) `/search/?category=recommendation&status=unread&tags=cold-start`

예전 카테고리 주소(`/recommendation/`, `/ai-agent/`)는 필터를 옮겨 `/search/?category=…`로 보내는 안내 페이지로 남겨 둔다.

## 노트 추가·수정

1. `notes/`에서 노트를 추가합니다 — `notes/{category}/[UNREAD] {slug} (YYYY).md`, frontmatter는 `templates/note-template.md` 참고.
2. `main`에 푸시하면 `.github/workflows/deploy.yml`이 `site/`를 빌드해 GitHub Pages에 배포합니다. (약 1분)
3. 파일명의 `[UNREAD]`가 빠지거나 붙어도 URL은 바뀌지 않습니다. 슬러그를 `lib/notes.ts`에서 정규화하기 때문입니다.

### 본문 이미지

- 원문의 도표·다이어그램·화면처럼 의미 있는 이미지만 넣습니다. 로고·아이콘·장식용 배경은 넣지 않습니다.
- 파일은 `site/public/images/{slug}/`에 두고, 본문에는 마크다운 이미지로 씁니다 (앞에 `base`를 붙입니다).

```markdown
![이미지 설명](/mandooshelf/images/{slug}/figure-1.png)
```

- 이미지 스타일은 `.prose img`에서 `max-width: 100%; height: auto;`로 잡혀 있어 모바일에서도 잘리지 않습니다.

frontmatter는 아래 값을 읽습니다. 모두 없어도 빌드됩니다.

| 필드 | 형식 | 비고 |
| --- | --- | --- |
| `title` | 문자열 | 없으면 파일명 사용 |
| `source` | 문자열 | 출처 |
| `url` | 문자열 | 원문 링크 |
| `tags` | 배열 | 태그 필터에 사용 |
| `status` | `read` / `unread` | 읽음 뱃지·필터 |
| `published_at` | `2026-11-16`, `2026-11`, `2026` | 문자열/날짜 모두 허용 |
| `read_at` | `2026-11-22` | 읽은 날 |

## 스타일 규격

여백은 `global.css`의 `:root`에 있는 간격 토큰(`--space-1` 4px … `--space-10` 56px)만 사용합니다.

- 페이지 좌우 패딩: `--pad-inline` — 데스크톱 20px, 520px 이하 16px
- 블록 사이: 홈 상단 여백 44px(모바일 32px), 홈 헤더→요약 16px, 요약→첫 섹션 32px, 섹션 사이 40px(모바일 32px)
- 카드 안쪽 패딩 16px, 카드 사이 `--gap-cards` 10px, 필터 카드 안 행 간격 12px
- `.filter__search input`만 모바일에서도 16px을 유지합니다(iOS 포커스 확대 방지). 정렬 `.select`는 12.5~13px.

## 배포

GitHub Pages(https://bo-10000.github.io/mandooshelf/) 기준으로 설정되어 있습니다.
다른 호스트로 옮길 때는 `astro.config.mjs`의 `site`·`base`를 바꾸고 빌드 결과(`site/dist`)를 올리면 됩니다.

### 배포를 트리거하는 경로

`.github/workflows/deploy.yml`의 `paths` 필터에 걸린 경로가 바뀔 때만 자동 배포됩니다.
현재 목록은 아래와 같습니다.

- `site/**`
- `recommendation/**`
- `ai-agent/**`
- `.github/workflows/deploy.yml`

노트를 `notes/` 아래로 옮긴 뒤로는 `recommendation/**`·`ai-agent/**`가 더 이상 노트를 가리키지 않습니다. 즉 지금은 `site/`가 바뀌는 커밋만 배포를 트리거합니다.
`notes/**`만 고친 커밋도 자동 배포되게 하려면 저장소 소유자가 GitHub 웹에서 `deploy.yml`의 `paths`에 `notes/**`를 넣거나(또는 `paths-ignore`로 전환), 그때까지는 노트 변경 커밋에 `site/` 변경을 함께 넣어 배포를 트리거합니다.
