# recommendation

추천 시스템·개인화·랭킹·파운데이션 모델을 읽고 정리한 글 모음입니다.
서비스마다 쓰던 사용자 이해를 한 모델·한 표현으로 모아 여러 제품이 나눠 쓰는 흐름이 중심입니다. (읽음 3 / 전체 7)

[← 전체 목록으로 돌아가기](../README.md)

## 읽음 (3)

- [흩어진 행동을 연결하다: 네이버 전 지면의 사용자 행동을 학습하는 추천 모델 개발기 (2026)](naver-d2-vms-cross-domain-recommendation%20(2026).md) — 지면별로 따로 학습하던 추천을 전 지면 행동 시퀀스 하나로 배운 VM(리트리버 4종 + 통합 랭커)으로 바꿔 실시간 서빙까지 붙였고, 홈피드 CTR +20.0%. 초거대 FM(LYNX) 지식 증류는 그 위에 얹는 확장 트랙이다.
- [TASTE, 토스의 추천 파운데이션 플랫폼 (2026)](toss-taste-recommendation-foundation-platform%20(2026).md) — 결제·앱이벤트·소비 행동을 한 모델로 학습한 사용자 임베딩을 푸시 타기팅·쇼핑·광고·미니앱 모델의 입력 피처로 재사용해 성과를 낸 사례. 모델을 합치는 게 아니라 표현 하나를 여러 문제가 나눠 쓰는 구조다.
- [LLM을 활용한 유저 프로파일링과 개인화 추천 (if(kakao)25) (2025)](kakao-llm-user-profiling-personalized-recommendation%20(2025).md) — UFO(룰·ML 카테고리 점수)로 전사 공통 프로파일 1층을 깔고, 그 위에 LLM 페르소나를 배치로 만들어 저장해 기존 ML 피처와 카나나 선톡(검색어 생성 → 필터링 → BM25+SBERT 검색 → UCB·LP 발송 최적화)에 같이 쓰는 구조. 주 contribution은 LLM 페르소나·선톡 쪽이다.

## 안 읽음 (4)

- [[UNREAD] 목적마다, 상품마다 늘던 모델을 하나로: 금융 도메인에 멀티태스크 학습 적용하기 (2026)](%5BUNREAD%5D%20toss-multi-task-learning-finance%20(2026).md)
- [[UNREAD] Foundation Model for Personalized Recommendation (2025)](%5BUNREAD%5D%20netflix-foundation-model-personalized-recommendation%20(2025).md)
- [[UNREAD] PinFM: Foundation Model for User Activity Sequences at a Billion-scale Visual Discovery Platform (2025)](%5BUNREAD%5D%20pinterest-pinfm-user-activity-sequence-foundation-model%20(2025).md)
- [[UNREAD] Generalized User Representations for Large-Scale Recommendations (2025)](%5BUNREAD%5D%20spotify-generalized-user-representations%20(2025).md)
