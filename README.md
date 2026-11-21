# mandooshelf 🥟

테크 블로그·컨퍼런스에서 읽을 글과 발표를 모아 두고, 정리본을 쌓아 가는 아카이브입니다.
글은 카테고리 폴더에 모으고, 아직 안 읽은 글은 파일명 앞에 `[UNREAD] `를 붙여 구분합니다.

## 📂 카테고리

- [**recommendation**](notes/recommendation/) · 추천 시스템·개인화·랭킹·파운데이션 모델 (읽음 2 / 전체 6)
- [**ai-agent**](notes/ai-agent/) · AI 에이전트·LLM 활용·팀 지식 (읽음 0 / 전체 1)

## 📌 안 읽은 글 (5)

- [LLM을 활용한 유저 프로파일링과 개인화 추천](notes/recommendation/%5BUNREAD%5D%20kakao-llm-user-profiling-personalized-recommendation.md) · kakao tech · if(kakao)25
- [Foundation Model for Personalized Recommendation](notes/recommendation/%5BUNREAD%5D%20netflix-foundation-model-personalized-recommendation.md) · Netflix TechBlog
- [PinFM: Foundation Model for User Activity Sequences](notes/recommendation/%5BUNREAD%5D%20pinterest-pinfm-user-activity-sequence-foundation-model.md) · Pinterest · arXiv 2507.12704
- [Generalized User Representations for Large-Scale Recommendations](notes/recommendation/%5BUNREAD%5D%20spotify-generalized-user-representations.md) · Spotify Research · RecSys 2025
- [부족한 건 모델이 아니라 팀 문서였다: 팀 공유 지식층 Third Brain 구축기](notes/ai-agent/%5BUNREAD%5D%20naver-d2-third-brain-team-wiki.md) · NAVER D2

## 📝 관리 규칙

- 새 글은 `templates/note-template.md`를 복사해 `notes/{category}/[UNREAD] {slug}.md`로 추가합니다.
- 읽고 정리를 마치면 파일명에서 `[UNREAD] `를 떼고, frontmatter를 `status: read`로 바꿉니다.
- 같은 글을 이 「안 읽은 글」 목록에서 빼고, 해당 카테고리의 편수(읽음/전체)를 함께 갱신합니다.
- 새 글을 추가하거나 읽음 처리할 때는 그 카테고리 폴더의 `README.md`도 함께 갱신합니다 — 읽은 글은 제목 + 요점 한 줄, 안 읽은 글은 제목만 적습니다.
