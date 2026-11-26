# mandooshelf 🥟

테크 블로그·컨퍼런스에서 읽을 글과 발표를 모아 두고, 정리본을 쌓아 가는 아카이브입니다.
글은 `notes/` 아래 카테고리 폴더에 모으고, 아직 안 읽은 글은 파일명 앞에 `[UNREAD] `를 붙여 구분합니다.

## 🗂 구조

```text
notes/            # 읽고 정리한 글 — 카테고리 폴더별
├── recommendation/
├── ai-agent/
└── etc/
templates/        # 새 노트 템플릿
site/             # 글을 읽어 만드는 Astro 사이트 (GitHub Pages)
```

## 📂 카테고리

- [**recommendation**](notes/recommendation/) · 추천 시스템·개인화·랭킹·파운데이션 모델 (읽음 3 / 전체 7)
- [**ai-agent**](notes/ai-agent/) · AI 에이전트·LLM 활용·팀 지식 (읽음 0 / 전체 4)
- [**etc**](notes/etc/) · 추천·에이전트로 묶기 애매한 글 (읽음 1 / 전체 3)

## 📌 안 읽은 글 (10)

- [에이전트엔 크롤링 대신 검색을: Cloudflare Search for Agents (2026)](notes/ai-agent/%5BUNREAD%5D%20cloudflare-search-for-agents%20(2026).md) · Cloudflare Blog
- [디자인 시스템이 있는데도 화면은 왜 제각각일까? — 토스뱅크 대출 심사 툴 (2026)](notes/etc/%5BUNREAD%5D%20toss-design-system-loan-review-tool%20(2026).md) · TOSS Tech
- [아마추어 천문학자가 Codex·Astra로 외계행성 후보를 찾다 (OpenAI) (2026)](notes/etc/%5BUNREAD%5D%20openai-astra-distant-planets%20(2026).md) · OpenAI · Science
- [작은 에이전시가 '점(dot)' 하나로: Intentful의 리서치·제안서·메시지 처리 (OpenAI) (2026)](notes/ai-agent/%5BUNREAD%5D%20openai-intentful-dots-agent-workflow%20(2026).md) · OpenAI for Business
- [판단 전에 사실을 찾지 않게: 사내 법무팀을 위한 연결된 지능 (OpenAI 웨비나) (2026)](notes/ai-agent/%5BUNREAD%5D%20openai-connected-intelligence-in-house-legal%20(2026).md) · OpenAI for Business
- [목적마다, 상품마다 늘던 모델을 하나로: 금융 도메인에 멀티태스크 학습 적용하기 (2026)](notes/recommendation/%5BUNREAD%5D%20toss-multi-task-learning-finance%20(2026).md) · TOSS Tech
- [Foundation Model for Personalized Recommendation (2025)](notes/recommendation/%5BUNREAD%5D%20netflix-foundation-model-personalized-recommendation%20(2025).md) · Netflix TechBlog
- [PinFM: Foundation Model for User Activity Sequences (2025)](notes/recommendation/%5BUNREAD%5D%20pinterest-pinfm-user-activity-sequence-foundation-model%20(2025).md) · Pinterest · arXiv 2507.12704
- [Generalized User Representations for Large-Scale Recommendations (2025)](notes/recommendation/%5BUNREAD%5D%20spotify-generalized-user-representations%20(2025).md) · Spotify Research · RecSys 2025
- [부족한 건 모델이 아니라 팀 문서였다: 팀 공유 지식층 Third Brain 구축기 (2026)](notes/ai-agent/%5BUNREAD%5D%20naver-d2-third-brain-team-wiki%20(2026).md) · NAVER D2

## 📝 관리 규칙

- 새 글은 `templates/note-template.md`를 복사해 `notes/{category}/[UNREAD] {slug} (YYYY).md`로 추가합니다. `(YYYY)`는 글의 발행연도이고, 새 카테고리 폴더를 만들어도 사이트가 자동으로 읽습니다.
- 읽고 정리를 마치면 파일명에서 `[UNREAD] `를 떼고 ` (YYYY)`는 그대로 두며, frontmatter를 `status: read`로 바꿉니다.
- 같은 글을 이 「안 읽은 글」 목록에서 빼고, 해당 카테고리의 편수(읽음/전체)를 함께 갱신합니다.
- 새 글을 추가하거나 읽음 처리할 때는 그 카테고리 폴더의 `README.md`도 함께 갱신합니다 — 읽은 글은 제목 + 요점 한 줄, 안 읽은 글은 제목만 적습니다.
- 원문에 의미 있는 도표·그림이 있으면 `site/public/images/{slug}/`에 저장하고 본문에 `![설명](/mandooshelf/images/{slug}/파일명)`으로 답니다.
