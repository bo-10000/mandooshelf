# site — mandooshelf 웹사이트

저장소 루트의 마크다운 노트(`recommendation/**`, `ai-agent/**`)를 그대로 읽어서 만드는 Astro 정적 사이트입니다.
노트 파일은 옮기지 않고, 웹 코드만 이 폴더에 모여 있습니다.

## 구조

```text
site/
├── astro.config.mjs       # site/base, trailing slash, 코드 하이라이트
├── src/
│   ├── content.config.ts  # 상위 폴더의 .md 수집 (README.md 제외), frontmatter 스키마
│   ├── lib/notes.ts       # [UNREAD] 제거한 URL 슬러그, 날짜 정규화, 카테고리·태그 집계
│   ├── layouts/BaseLayout.astro
│   ├── components/        # NoteList, FilterBar
│   ├── scripts/notes-filter.ts
│   ├── pages/
│   │   ├── index.astro              # 홈: 요약·안 읽은 글·카테고리·최근 읽은 글
│   │   ├── [category]/index.astro   # 카테고리: 읽음/태그/검색/정렬 필터
│   │   ├── [category]/[slug].astro  # 글 상세
│   │   ├── search/index.astro       # 전체 글 검색
│   │   └── 404.astro
│   └── styles/global.css
└── public/favicon.svg
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

## 노트 추가·수정

1. 루트에서 노트를 추가합니다 — `{category}/[UNREAD] {slug} (YYYY).md`, frontmatter는 `templates/note-template.md` 참고.
2. `main`에 푸시하면 `.github/workflows/deploy.yml`이 `site/`를 빌드해 GitHub Pages에 배포합니다. (약 1분)
3. 파일명의 `[UNREAD]`가 빠지거나 붙어도 URL은 바뀌지 않습니다. 슬러그를 `lib/notes.ts`에서 정규화하기 때문입니다.

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

## 배포

GitHub Pages(https://bo-10000.github.io/mandooshelf/) 기준으로 설정되어 있습니다.
다른 호스트로 옮길 때는 `astro.config.mjs`의 `site`·`base`를 바꾸고 빌드 결과(`site/dist`)를 올리면 됩니다.
