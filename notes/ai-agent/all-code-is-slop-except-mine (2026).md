---
title: "다 슬롭이다, 내 코드만 빼고: 에이전트를 믿게 만드는 환경 (Lauren Tan)"
published_at: 2026-11-14
source: "AI Engineer"
url: "https://www.youtube.com/watch?v=O_zcc6Xl12g"
tags: [coding-agents, verification, lint-rules, pstack]
status: read
read_at: 2026-11-28
---

## 한 줄 요약

**에이전트가 같은 실수를 또 하면 `AGENTS.md`에 경고를 한 줄 더 쓰고 싶어지는데, 그 경고를 코드·API·린트 규칙처럼 무시할 수 없는 곳에 심어야 한다**는 주장. Lauren Tan은 agent 환경에 6개월 투자해 지난 한 달에 **혼자 PR 3,000개**를 프로덕션에 넣었고, 팀은 **11,000개**를 넣었다고 말한다. 비결은 더 좋은 프롬프트가 아니라 **"에이전트가 알아서 옳은 쪽으로 가게 만든 코드베이스"** 다. 결정을 코드가 대신하게 만들면 리뷰할 것이 줄고, 결국 에이전트가 자기 PR을 스스로 머지하는 단계까지 간다.

> 발표: Lauren Tan(핸들 `poteto`), SpaceXSI Grok Bot 팀 Principal Engineer. AI Engineer CODE 2026(2026-11-11) 발표, YouTube 공개본 2026-11-14.

## 발표자·맥락

- Grok Bot은 Electron으로 만든 데스크톱 에이전트 앱이다. Tan은 이전에 Cursor에서 일했고, 발표의 반례(안티패턴) 상당수가 그때 겪은 것이다.
- 출발점은 "볼륨"이 아니라 **"생산성을 크게 올리면서 품질을 유지하는 일이 이제 소프트웨어 엔지니어의 본업(meta)이 됐다"** 는 관찰. 에이전트 이전에는 극소수만 '코딩 머신'이었는데, 이제 누구나 될 수 있다는 것.
- 그래서 "software factory" 같은 말을 쓰지만, Tan이 강조하는 건 **신뢰(trust)** 다. 맹목적 신뢰가 아니라, 에이전트가 도는 환경에 투자해서 믿을 수 있게 만드는 신뢰. 여기까지 오는 데 6개월이 걸렸고, 따라오는 사람은 더 짧게 걸릴 거라고 말한다.

## 신뢰의 역피라미드 — 어디에 시간을 쓸 것인가

위로 갈수록 사람의 판단이 필요하고, 아래로 갈수록 기계가 강제한다. 시간은 **아래(넓은 쪽)에 먼저** 써야 한다.

- **1층 · 코드 그 자체 (결정적)**: 좋은 API 설계, 아키텍처, 리팩터링. 선택지를 없애 버리는 층.
- **2층 · 정적 분석 (결정적)**: 린트 규칙, 타입 시스템, 컴파일러, 각종 테스트. 코드가 아직 허용하는 선택지를 잡아내는 층.
- **3층 · 검증**: 런타임 검증과 형식 검증. 버그를 찾고, 지켜야 할 성질·불변식이 실제로 성립하는지 확인한다. 동시에 **에이전트가 우리 의도와 목표를 제대로 이해했는지** 확인하는 수단이기도 하다.
- **4층(맨 위, 가장 좁게) · 산문**: 규칙, 스킬, `AGENTS.md`. 판단이 필요한 것만 여기 남긴다.

핵심 원칙은 **"에이전트를 교정할 때마다 그걸 결정적 검사로 바꿔라"** 다. 규칙 파일에 한 줄 추가하는 것보다 코드에 있는 게 재현 가능하고, 그래서 믿을 수 있다.

## 코드베이스는 정원이다

- 2024년에는 출근해서 동료가 쓴 PR **3개**를 리뷰했는데, 지금 비교 대상은 **300개** 수준이다. 엔지니어 한 명이 이제 수백에서 수천 개 에이전트의 팀을 거느린 셈이고, 코드가 연속된 흐름처럼 유기적으로 들어온다.
- 이때 코드베이스와 가드레일은 **에이전트가 새 코드를 자라게 할 콘크리트 기반** 이다. 기반이 어긋나 있으면 그 위에 자란 것도 어긋난다.
- 더 큰 문제는 **복사**다. 코드가 에이전트의 가장 큰 입력이기 때문에, 남아 있는 우회 코드·안티패턴·폐기된 패턴·기술 부채는 다음 에이전트에게 "이 저장소의 표준 방식"으로 보인다. 정원의 잡초·해충이 눈 깜짝할 사이에 퍼지는 것과 같다.
- 그래서 정원을 최대한 깨끗하게 유지하는 일 자체가 성능 작업이다. 과거 부채 청산이 아니라 **다음 출력의 품질을 결정하는 입력 정리**다.

## 사례 1 — Dune: `useEffect`를 금지하다

- Dune은 Grok Bot을 위해 직접 만든 클라이언트 프레임워크다. 기술적으로 특별한 건 없고 "Electron 앱을 위한 Next.js" 정도로 보면 된다. 중요한 건 그 안에 데스크톱 앱을 만들며 배운 교훈을 **제약과 린트 규칙으로 인코딩**해 뒀다는 점.
- 교훈 하나: **"잘 쓰려면 뉘앙스가 필요한 API는 슬롭을 만든다."** 대표 예가 React의 `useEffect`. 쓸 데가 있지만 오용이 흔하고, 농담으로 "쓰려면 박사 학위가 필요하다"고 할 정도로 미묘하다. 에이전트는 이걸 잘 못 쓴다.
- 해법은 문서화가 아니라 **제품 코드에서 금지**. Dune API 내부의 일부 위치에서만 허용한다. 결과적으로 이 문제는 **분류 자체가 사라졌고**, 코드 리뷰에서 다시 잡을 일이 없어졌다.
- 주의: "`useEffect`는 나쁘다"가 아니라 "이 코드베이스에서는 프레임워크가 지원 경로를 제공하고, 그 밖의 선택지는 검사로 거부한다"는 국소적 아키텍처 결정이다.

## 사례 2 — 디렉터리 구조로 맥락 주기 (Electron main / renderer)

- Cursor 시절 자주 본 안티패턴: 에이전트가 **main 스레드 코드를 renderer로 import** 해서 롱 태스크와 버벅임을 만드는 것.
- Grok Bot과 Dune에서는 이걸 아주 관습적으로 만들었다. 최상위 디렉터리 이름을 문자 그대로 `electron-renderer`, `electron-main` 으로 두고, **두 디렉터리 사이 import는 의존성 그래프 분석기와 린트 규칙으로 금지**한다.
- 규칙 자체는 만들기 쉬운 린트 한 줄이지만, 리뷰에서 고민할 거리가 하나 줄어든다. 디렉터리 이름이 설계를 말하고, 실행되는 검사가 그걸 강제한다.

## 사례 3 — 주석과 마크다운은 '탈출구'가 된다

- 의외의 실패: 에이전트가 문서·주석·규칙·스킬 같은 **마크다운을 자기 변명을 적는 자리**로 쓴다. 안 해도 되는 일을 정당화하는 근거를 남기는 것.
- 또한 작은 교정 하나에 과하게 반응해서, 그걸 영원히 깨면 안 되는 절대 규칙처럼 다루기도 한다.
- **타이머 사례(Cursor)**: 에이전트들이 `setTimeout`, `requestAnimationFrame`, `requestIdleCallback` 같은 명령형 타이머를 애용했다. VS Code의 명령형 스타일과 React의 선언형 스타일이 부딪히는 **아키텍처 충돌을 국소적으로 덮는 반창고**였기 때문이다. 즉 아키텍처 선택이 클라이언트와 에이전트 성능을 둘 다 나쁘게 만든 경우.
- 자바스크립트에서 타이머가 빠르게 생성·파괴되면 **메이저 GC**가 잦아지고 렉·버벅임으로 체감된다. 최악은 그 옆에 "이 타이머가 왜 정당한지" 설명하는 주석이 붙어 있던 것. 다음 에이전트에게는 그 주석이 **허가증**이 되고, 타이머는 점점 '관례'처럼 퍼졌다.
- **Grok Bot의 대응**: 주석의 **99%를 금지**했다. 이유는 세 가지 — 쉽게 낡는다, 사람은 어차피 주석 슬롭을 안 읽는다, 그리고 에이전트에게 "어려우니까 안 해도 되는 이유"를 적을 자리를 준다. 무엇보다 **강제력이 없다**.
- 대신 **린트 규칙의 오류 메시지**에 안내를 담았다. 에이전트가 규칙을 위반하는 바로 그 순간, "국소 처방 말고 근본 원인을 고쳐라"라고 읽게 만드는 것.
- 일반 원칙: 교정이 생길 때마다 (1) 결정적 검사로 만들거나 (2) 더 나은 API·아키텍처로 그 문제를 분류째 없앤다. 이걸 충분히 반복하면 리뷰에서 볼 게 줄고, 어느 시점엔 **리뷰할 게 남지 않아 에이전트가 자기 PR 대부분을 직접 머지**하게 된다.

## 검증 — 코드가 아니라 증거를 리뷰한다

- Grok Bot의 코드 리뷰는 이제 **검증 산출물(verification artifacts)** 을 보는 일로 줄었다. 영상, 스크린샷, 다이어그램, 형식 검증 결과.
- **런타임 검증**: 말이 거창하지만 결국 "에이전트가 코드를 직접 돌리고, 사람이 쓰는 디버깅 도구를 같이 쓰게 하는 것". Chrome DevTools Protocol(CDP)이 그 예다.
  - **feature map**: 사용자 관점에서 앱의 모든 기능을 정리한 일종의 사이트맵. "왼쪽 사이드바에 있는 그거" 같은 요청에서 에이전트가 추측하지 않게 **공유 어휘**를 준다.
    - **어디에 두나**: 검증 스킬 폴더(`.cursor/skills/verify-<앱>/`) 안. 실행·진단·조작·증거·정리 절차가 담긴 `SKILL.md` 옆의 `references/features/` 아래에 `README.md`(전체 지도이자 목차)와 기능별 짧은 마크다운 파일을 둔다. 예시 앱 Atlas는 로그인·좌측 레일·프롬프트·레이아웃·소스 컨트롤·호스팅 등 영역으로 나뉜 약 30개 파일이다.
    - **파일 하나에 네 칸**: `Sub-features`(그 기능 안에서 사용자가 할 수 있는 일), `How to get to it (user POV)`(클릭·단축키로 도달하는 경로), `Driving it with <CLI>`(커스텀 CLI 명령과 a11y·DOM 셀렉터, 무엇을 보면 통과인지), `Gotchas`(포커스·플랜·데이터 유무 같은 함정과 확인이 실패한 이유).
    - **자동 생성·유지**: `/create-verification-skill`이 사람에게 묻기 전에 저장소를 먼저 훑어 앱을 조작할 CLI와 feature map 초안을 만든다. 이후 기능 PR과 같이 고치고, `/maintain-verification-skill`을 하루 한 번 돌려 소스를 다시 읽고 실제 앱을 구동해 드리프트를 잡는다(고칠 게 있으면 PR 하나, 제품 코드는 건드리지 않음).
    - **토큰 경제**: 코드베이스 전체를 읽히는 대신 작업에 걸린 기능 파일 한두 개만 연다. poteto는 코드베이스(진짜 기억)를 압축한 **materialized memory**라고 부르고, 저장소에 커밋되는 마크다운이라 팀 전체가 같은 기억을 공유한다고 말한다.
    - 예시 저장소(가상 앱 Atlas·Harbor Labs, 드라이버 스크립트는 의도적으로 생략): https://github.com/poteto/verification-skill-example
  - **커스텀 CLI**: 스킬 안에 CLI·드라이버를 넣어 두면 에이전트가 매번 같은 도구를 재사용한다. 앱을 조작하는 방법을 새로 알아내느라 쓰는 토큰이 줄고, 팀 입장에서는 테스트할 수 있는 자산이 생긴다.
- **형식 검증(최근 실험)**:
  - **TLA+**: 여러 기기·플랫폼에 걸친 알림 같은 주요 사용자 흐름을 모델 체킹.
  - **Lean**: 특정 알고리즘 증명. 직접 만든 **가상화(virtualization) 라이브러리**에서 깜빡임·떨림(jitter) 문제가 없다는 걸 확인하는 데 쓴다.
  - 아직 실험 단계지만 유망하고, 이미 형식 검증으로 **버그를 꽤 찾았다**. 다만 은탄환이 아니라 환경에 층을 하나 더 얹는 도구로 취급한다.
- **속성 기반(property based) UI 테스트**: `Bombadil`이라는 라이브러리로 시작한 단계. 이것도 UI 버그를 몇 개 잡았다.
- **상태도(state chart)**: Tan이 만든 플러그인(`poteto stack`)의 `state chart` 스킬로, 사용자 관점의 상태 기계를 시각화한다. 성공한 화면 한 장으로는 보이지 않는 **가능한 상태와 전이**를 영상·스크린샷과 함께 리뷰할 수 있어 편하다고 한다.
- **경제 논리**: 여기 쓰인 기법 중 새롭거나 참신한 건 하나도 없다. 그냥 **좋은 소프트웨어 엔지니어링 도구**다. 다만 예전에는 이해·작성·유지 비용이 비싸서 못 썼고, 에이전트가 그 비용을 크게 낮췄다. 그래서 "테스트와 검증의 황금기"가 열렸다는 게 Tan의 표현이다.
- 참고 사례: 6개월 전 "미묘한 버그가 머지돼서 에이전트를 못 믿겠다"던 동료(Cindy)가 지금은 **하루 토큰의 70%를 검증에 쓴다**고 한다. Tan도 자기 토큰 대부분이 검증으로 간다고 말한다.

## 결과 (발표자가 말한 수치)

- 개인: 지난달 **PR 3,000개**를 프로덕션에. 상당수는 자는 동안.
- 팀: 지난달 **11,000개**. 클라이언트 안정 버전은 **하루에 한 번** 꼴로 낸다.
- 기여자: 10월에 PR을 하나 이상 낸 사람이 **227명**. 맥락이 많지 않은 즉흥 기여자(driveby)도 포함된다.
- 품질: 리버트(revert) 비율은 **상대적으로 오히려 낮아져 0.5% 수준에서 안정**. 볼륨이 늘면 혼돈이 될 거란 걱정과 반대.
- 성능: 출시 시점 대비 **시작, 타이핑, 새 채팅 열기, 채팅 전환**이 모두 빨라졌다. 여전히 Electron이라 한계는 있지만, 이 속도와 이 기여자 수를 감안하면 괜찮다는 평가.

## 순서가 중요하다 — 안쪽 루프부터

- 자동화부터 달려들지 말 것. 교정이 생기면 **먼저 코드베이스를 고친다**: 안티패턴의 재발을 막는 린트 규칙을 넣고, 기존 패턴도 같이 청소한다. 그다음 검증 체계를 튼튼히 한다.
- 이 작업은 자동화의 **전제조건**이기도 하다. 안쪽(inner) 코딩 루프가 슬롭을 만들면, 그 루프를 자동화하면 슬롭이 더 빨리 나올 뿐이고 토큰을 더 퍼부어야 한다.
- 기반이 갖춰지면 바깥 루프(factory)는 그 위에 쉽게 얹힌다. Grok Bot에는 커넥터와 루틴으로 Cursor 클라우드 에이전트·프로젝트를 띄워 수백에서 수천 에이전트를 조율하는 구조가 있다.
- 그 예: 새 릴리스를 자를 때마다 Cursor 프로젝트를 자동으로 띄워 **앱 전체와 빌드를 퍼징**하고, 실제 사용자처럼 앱을 쓰면서 버그를 찾고, 버그마다 **수정 PR을 열어 자동 머지**한다. 미친 소리 같지만, 코드베이스가 충분히 좋아서 PR이 기본적으로 좋게 나오고, 들어가는 제품 코드 대부분이 더는 깊은 사람 리뷰를 필요로 하지 않기 때문에 가능한 일이다.

## 공개된 스킬·도구와 실제 코드베이스 적용법

발표에 나온 검증·상태도·병렬 실행 도구는 말로만 끝나지 않고 공개돼 있다. 2026-11-28에 저장소를 직접 열어 확인한 내용으로, 무엇이 들어 있고 내 저장소에는 어떻게 가져다 쓰는지 정리한다.

### pstack — poteto가 매일 쓰는 스킬 묶음 (Cursor 플러그인, 스킬 59개)

- 위치: https://github.com/cursor/plugins/tree/main/pstack — MIT 라이선스, `plugin.json` 기준 버전 0.15.48(2026-11-28 확인). 발표에서 "내가 매일 쓰는 스킬"이라고 한 그 묶음이고, 저장소 소개도 "더 적지만 더 좋은 코드를 쓰게 해 준다"는 쪽이다.
- 설치: Cursor에서는 `/add-plugin pstack` 한 줄. Claude Code에서는 `/plugin marketplace add cursor/plugins` 다음 `/plugin install pstack@cursor-plugins`로 설치하고, 명령 앞에 `pstack:`이 붙는다(`/poteto-mode`가 `/pstack:poteto-mode`가 된다). 설치 뒤 `/setup-pstack`으로 역할별 모델을 고르고, 작업을 시작할 때 `/poteto-mode`를 쓴다.
- 진입점 `poteto-mode`: 요청을 읽어 22개 플레이북(investigation, bug fix, perf, hillclimb, runtime forensics, feature, refactoring, prototype, visual parity, eval, babysit, shipping, autonomous run, autopilot, session pickup, multi-phase plan, opening a PR 등) 중 하나에 매칭하고, 그 단계를 그대로 복사한 todo list를 연 뒤 필요한 스킬로 라우팅한다. 계획 스킬은 기본이 아니다 — "최선의 스펙은 코드"라는 입장이다.

**검증 생성·유지 (발표의 핵심과 직결)**

- `create-verification-skill`: 프로젝트에 앱 동작을 증명할 스크립트가 없을 때, 사용자가 앱을 쓰는 방식 그대로 조작하는 프로젝트 로컬 검증 스킬을 만든다. 언어·프레임워크·플랫폼을 가리지 않는다. 결과물이 `SKILL.md`와 feature map(`references/features/`)이다.
- `maintain-verification-skill`: feature map이 앱과 어긋났는지 주기적으로 점검한다. 기능별 소스 리더를 병렬로 돌리고 실제 앱을 한 번 구동해 본 뒤, 증명된 수정만 담아 최대 PR 하나를 낸다(제품 코드는 건드리지 않는다). 결과는 clean(고칠 것 없음), changed(PR 하나), blocked(끝내지 못함) 중 하나로만 보고한다.
- `maintain-verification-skill`은 frontmatter에 `disable-model-invocation: true`가 붙어 있어 모델이 문맥을 보고 알아서 집어 들지 않는다. `features/` 전체를 병렬로 읽고 앱의 모든 기능을 한 바퀴씩 실제로 돌리는 전체 감사라서, `/maintain-verification-skill`을 직접 부르거나 스케줄 실행으로 거는 쪽을 전제로 설계된 스킬이다. `unslop`, `statechart`, `how`, `why`, `no-comments`처럼 확인해 본 다른 스킬도 같은 값을 두고 있다.
- `create-formal-verification-skill`: 테스트가 닿지 않는 곳 — 동시성, 재시도, 상태 기계, 파서, unsafe 코드 — 에서 성질 하나를 골라 TLA+·Lean 같은 맞는 도구로 검증하고, 코드가 바뀔 때마다 다시 돌릴 프로젝트 로컬 스킬을 만든다.
- `maintain-formal-verification-skill`: 검증이 덮는 코드가 바뀐 뒤 모델·하네스·속성을 지금 코드에 맞게 고치고 다시 돌려, 실패가 검증 쪽 드리프트인지 코드 버그인지 갈라 말한다.

**시각화·병렬 실행**

- `statechart`: 그림만 그리는 도구가 아니다. 저장소 밖 scratch 폴더에 TLA+ 명세와 설정을 쓴 뒤 `scripts/statechart`로 TLC 모델 체커를 돌려(첫 실행 때 mise로 TLC와 Java를 설치) 규칙을 깨는 상태가 있는지 먼저 검사하고, 그 모델을 사용자가 보는 상태 기준의 Mermaid 상태도로 그린다. 규칙을 깨는 상태마다 거기까지 가는 최단 경로를 함께 준다.
- `swarm`: 워커 N개를 병렬로 띄워 각자 다른 조각이나 경쟁을 맡기고, 다 끝나면 리포트 하나로 모은다. 예: `packages/` 아래 패키지마다 `check.sh`를 워커 하나씩 돌려 한 장으로 정리.
- `arena`: 같은 일을 N개 시도해 놓고 각 시도의 좋은 부분을 골라 합친다. `interrogate`는 여러 모델이 diff를 깨뜨리려 시도하고, 실행으로 증명된 지적만 남긴다.

**코드 품질·가드레일**

- `no-comments`: **코드 쪽** 주석 정리 도구. Comment Sicko라는 읽기 전용 서브에이전트로 주석을 걷어내고, 받아들인 지적을 고친 뒤 "이 제약이 정당하다"는 주장에는 주석 대신 린트·타입·런타임 검사로 인코딩할 방법을 제안한다.
- `unslop`: 코드가 아니라 **산문 쪽** 도구다. README·기술 문서·글에서 AI 티를 지우는 33개 규칙을 두고 있고, `crucial`·`delve`·`landscape` 같은 AI 단골 단어, 끝에 붙는 `-ing` 구문, `not just X, but Y`, "I hope this helps!" 같은 챗봇 인사말, 장식 이모지, em dash를 금지한다. 규칙마다 고정 번호가 있어 다른 스킬이 그 번호로 인용한다.
- `typescript-best-practices`: `type-system-discipline` 원칙을 TS 문법 수준으로 풀어 준다.
- `principle-*` 24개: 원칙 하나에 짧은 스킬 하나. core / architecture / verification / delegation / meta 다섯 묶음이고, 발표 내용과 바로 이어지는 것들이 있다.
  - `encode-lessons-in-structure`: 규칙을 글로 더 쓰지 말고 린트·메타데이터 플래그·런타임 검사·스크립트로 인코딩한다.
  - `prove-it-works`: 완료를 선언하기 전에 실제 산출물로 확인한다(기능을 돌려 보고, 실제 값을 읽고, diff를 본다). "컴파일된다"는 증거가 아니다.
  - `fix-root-causes`: 증상마다 시스템이 처음 잘못된 지점을 찾아 거기서 고친다. 가드는 그 상태가 정당할 때만 수정이다.
  - `guard-the-context-window`: 대량 작업은 서브에이전트로 보내고 메인 스레드에는 요약만 둔다.
  - 그 밖에 `laziness-protocol`, `subtract-before-you-add`, `boundary-discipline`, `type-system-discipline`, `make-operations-idempotent`, `test-behavior-not-implementation` 등.
- 그 밖에 `correct`(저장소에서 에이전트가 반복하는 실수를 캐내 아키텍처 → 타입 → 고치는 법을 알려 주는 린트 → 테스트 → 문서 순으로 막고, 규칙마다 그걸 강제하는 수단을 짝지어 둔다), `tdd`, `benchmark-checklist`, `technical-writing`, `reflect`, `how`, `why`, `teach`가 있다.

**가져다 쓰는 방법**

- 통째로: Cursor에서 `/add-plugin pstack` → `/setup-pstack` → 필요할 때 `/poteto-mode`.
- 골라서: `pstack/skills/스킬이름/SKILL.md`(와 `references/`)를 저장소의 `.cursor/skills/스킬이름/`에 복사한다. 스킬은 마크다운 폴더라 다른 에이전트의 스킬 폴더에도 같은 방식으로 넣을 수 있다. 팀과 함께 쓰려면 저장소에 커밋해 두는 편이 낫다(feature map을 "팀이 공유하는 기억"으로 쓰는 방식과 같다).
- 걸리는 점: pstack은 Cursor를 기준으로 쓰였고 bugbot·automations처럼 Cursor 전용 기능을 쓰는 단계가 있다(Claude Code에서는 그 단계만 한 줄 안내와 함께 건너뛴다). 59개 스킬은 서로를 참조하므로 하나만 복사하면 그 스킬이 부르는 원칙·플레이북이 빠질 수 있다. 처음엔 `create-verification-skill`처럼 자기완결적인 것부터 떼어 쓰는 편이 안전하다.

### poteto 개인 GitHub 공개 저장소 3종

앞서 본 `verification-skill-example`까지 넣으면 발표와 직결된 공개물이 네 개인데, 모두 이번 11월 발표를 위해 새로 만든 것이 아니라 2026년 상반기부터 차례로 공개한 것이다. 저장소 생성일은 `noodle` 2026-02-22, `brainmaxxing` 2026-02-27, `how` 2026-04-14, `verification-skill-example` 2026-07-30이다(2026-11-28 GitHub API로 확인).

- `poteto/how` — https://github.com/poteto/how
  - 코드베이스 설명 전용 Cursor 플러그인(`/how` 스킬 하나). "이 서브시스템은 어떻게 돌아가나"를 시니어가 새 영역에 온보딩하듯 설명한다: Overview, Key Concepts, How It Works, Where Things Live, Gotchas.
  - 질문이 여러 파일·서비스에 걸치면 탐색 각도를 2에서 4개로 쪼개 explorer 서브에이전트를 병렬로 띄우고, 합성 에이전트가 그 결과를 하나의 설명으로 맞춘다. 단순한 질문은 팬아웃 없이 한 번에 끝낸다.
  - "설계도 비판해 줘"를 덧붙이면 Critique 모드로 넘어가 여러 모델의 독립 비평가를 붙인다.
  - 적용: `skills/how/` 폴더를 `.cursor/skills/how/`로 복사하거나 플러그인으로 추가한다. `SKILL.md`가 라우팅을 맡고 `references/`의 프롬프트 템플릿을 서브에이전트에 넘긴다.
  - pstack 안의 `how`와는 뿌리가 같고 버전이 다르다. 이 저장소의 `SKILL.md`는 140줄짜리 풀 버전으로 병렬 explorer와 여러 모델이 붙는 Critique 모드를 갖췄고, `pstack/skills/how/SKILL.md`는 21줄로 압축해 서브에이전트 하나만 띄워 한 번에 설명한다. 대신 "왜 이렇게 짰는지"를 묻는 일은 `why` 스킬로 떼어 냈고, `disable-model-invocation: true`가 붙어 있다.
- `poteto/noodle` — https://github.com/poteto/noodle
  - 스킬 기반 다중 에이전트 오케스트레이션. Go로 만들었다. 주방 비유를 그대로 쓴다 — 스케줄러(헤드 셰프)가 `.noodle/mise.json`(백로그·활성 에이전트·이력·등록 스킬)을 읽어 `.noodle/orders-next.json`에 주문을 쓰고, 루프가 주문을 승격해 격리된 워크트리에서 에이전트 세션을 띄운다. 에이전트는 스킬 하나를 지시서로 받고, 끝나면 워크트리가 main으로 머지된다.
  - 최소 루프는 "스케줄 → 실행"이고, 품질 리뷰·회고 같은 단계는 그 단계용 스킬을 써서 붙인다. 스킬 frontmatter에 `schedule` 값을 넣으면 자율 실행 대상이 되고, 없으면 평소처럼 직접 부른다.
  - 적용: `brew install poteto/tap/noodle`(리눅스·윈도는 릴리스 바이너리), `.agents/skills/noodle/SKILL.md`와 references 복사, `.noodle.toml`에 Claude/Codex 중 provider 지정. 문서는 https://noodle-run.github.io/noodle/.
  - 성격: 저장소 안에 에이전트가 CLI를 쓰는 법을 가르치는 스킬이 따로 있어, 오케스트레이션 자체를 스킬로 배우는 구조다. 혼자 쓰는 작은 저장소보다 여러 작업을 병렬로 돌리는 팀·장기 작업에 맞다.
- `poteto/brainmaxxing` — https://github.com/poteto/brainmaxxing
  - Claude Code용 "멍청할 만큼 단순한" 영속 메모리. 마크다운 vault(`brain/`)를 세션 시작에 읽고, 배운 게 있으면 거기에 쓴다. Obsidian vault라서 에이전트 기억을 직접 열어 볼 수 있다.
  - 원칙 16개를 시작 내용으로 주고 스킬 6개를 준다. 학습 루프가 넷: `reflect`(세션 끝이나 교정 직후 대화에서 기억할 것을 뽑아 씀), `ruminate`(지난 대화를 훑어 reflect가 놓친 패턴을 캐냄), `meditate`(쌓인 brain과 스킬을 대조해 모순·낡은 노트를 정리하고, 여러 항목에 흩어진 암묵 원칙을 드러냄). 작업 지원이 둘: `plan`(여러 파일에 걸친 작업을 단계 계획으로 쪼개 `brain/plans/`에 씀, 구현은 하지 않음), `review`(원칙에 근거해 코드·계획을 심각도와 트레이드오프로 리뷰). 나머지 둘은 훅으로, 시작할 때 brain 인덱스를 넣고 파일이 바뀌면 인덱스를 다시 만든다.
  - 적용: Claude Code에 저장소를 가리키면 `brain/`, `.agents/skills/`, `.claude/hooks/`를 복사하고 `CLAUDE.md` 지침을 프로젝트에 합친다. 전부 쓸 필요는 없고 `reflect`만 돌려도 값의 대부분이 나온다고 한다.
  - 참고: pstack이 "저장소에 커밋되는 feature map은 팀이 공유하는 기억"이라고 말한 것과 결이 같다. 다만 brainmaxxing은 앱 검증이 아니라 대화에서 배운 규칙·취향을 쌓는 쪽이다.

### 실제 코드베이스에 바로 적용해 볼 4단계

발표의 순서(안쪽 루프 먼저)를 내 저장소에 옮긴다면 이 순서가 된다. ①·②는 결정적 층, ③은 입력 정리, ④는 검증 층이다.

- **① 교정을 린트 규칙으로 승격하고, 오류 메시지에 대안을 적기**: 에이전트가 같은 실수를 할 때마다 `AGENTS.md`에 한 줄을 더하는 대신 린트 규칙으로 막는다. 규칙을 어긴 그 순간 읽히도록 "이건 왜 안 되는지, 대신 무엇을 써야 하는지"를 오류 메시지 안에 넣는다. pstack의 `correct`가 쓰는 순서와 같다 — 아키텍처로 없앨 수 있으면 없애고, 안 되면 타입, 그다음이 "고치는 법을 알려 주는 린트"다.
- **② 폴더 경계·import 규칙을 코드로 잠그기**: `eslint-plugin-boundaries`나 `no-restricted-paths`(`import/no-restricted-paths`, typescript-eslint `no-restricted-imports`)로 잘못된 참조를 빌드 단계에서 막는다. 예: `electron-main`에서 `electron-renderer`로 가는 import 금지. 디렉터리 이름이 설계를 말하고 검사가 그걸 강제하게 만든다.
- **③ 임시방편 주석과 반창고 코드 청소하기**: "이 `setTimeout`이 왜 필요한지" 설명하는 주석은 다음 에이전트에게 허가증이 된다. 그런 처방이 필요했던 근본 원인을 고치고, 정말 지켜야 할 제약이면 주석 대신 타입·린트·테스트·런타임 검사로 인코딩한다(주석은 쉽게 낡고 아무것도 강제하지 않는다).
- **④ 고정 검증 명령 하나와 작은 feature map부터**: 매번 일회성 확인 스크립트를 새로 짜게 두지 말고 `npm run verify` 같은 명령 하나를 정해 둔다. 그리고 핵심 기능 몇 개만 담은 작은 `references/features/`에서 시작한다. 파일 하나에 네 칸 — Sub-features(그 기능 안에서 사용자가 할 수 있는 일), How to get to it (user POV)(클릭·단축키로 도달하는 경로), Driving it with CLI(명령과 셀렉터, 무엇을 보면 통과인지), Gotchas(포커스·플랜·데이터 유무 같은 함정과 확인이 실패한 이유). 기능이 늘면 `maintain-verification-skill`로 드리프트를 잡고, 동시성·상태 기계처럼 테스트가 못 닿는 곳은 `create-formal-verification-skill`로 넘긴다.

## 한계 / 확인되지 않은 것

- 수치는 모두 **발표자·그 팀의 자기 보고**다. 리버트율 0.5%, 227명, 11,000개 같은 값은 통제된 실험이 아니라서 다른 저장소에 그대로 옮겨질 근거는 아니다. "머지 볼륨이 늘면 품질이 오른다"는 인과도 이 발표로는 증명되지 않는다.
- "주석 99% 금지"는 Grok Bot·Dune의 제품 코드 정책이다. 문서 전체를 없애자는 주장이 아니고, 왜 그렇게까지 했는지(강제력 없음, 변명의 자리)가 요지다.
- TLA+·Lean·속성 기반 테스트는 아직 실험이며, 어떤 버그를 몇 개 잡았는지 같은 정량은 발표에 없다.
- 발표는 Grok Bot 홍보 성격을 겸한다. 특히 마지막의 "Grok Bot으로 factory를 만들면 된다"는 부분은 제품 소개다.

## 내 생각 / 메모

- **기존 에이전트·스킬(`superpowers` 등)과 겹치는 부분**: `noodle`은 워크트리 병렬 실행, `brainmaxxing`은 서브에이전트·자동 메모리를 노리는 구조라 요즘 코딩 에이전트가 기본으로 주는 기능과 겹친다. 그래서 지금 따로 설치할 메리트는 크지 않다고 본다. `how`도 처음 보는 대규모 레포를 훑을 때 쓰는 도구라, 구조를 이미 아는 개인 프로젝트에서는 쓸 일이 드물 것 같다.
- **전체 설치보다 선별 도입**: `pstack` 59개(그중 `principle-*` 24개)를 통째로 넣으면 스킬 이름과 설명이 매 턴 컨텍스트에 올라와 비대해지고, 이미 쓰는 `superpowers`의 TDD·플래닝·리뷰 흐름과 `poteto-mode`·`tdd`·`swarm` 같은 단계가 부딪힐 수 있다. 필요한 스킬만 떼어 쓰는 편이 낫다.
- **1순위 후보는 `create-verification-skill` 하나**: `superpowers`에 없는 "내 앱 전용 조작 CLI와 `features/` feature map"을 만들어 주는 쪽이라 중복이 가장 적고 체감이 클 것 같다. 개인 웹앱에 먼저 얹어 "고치고 브라우저로 직접 확인" 루프를 한 번 돌려 보려 한다.
- **`maintain-verification-skill` 운영 방식**: `disable-model-invocation`을 `false`로 열어 두면 작은 수정에도 전체 감사가 돌아 무거워진다. 평소에는 `AGENTS.md`에 "기능이나 UI를 고치면 해당 `features/*.md`만 같이 갱신" 한 줄을 두고, 큰 개편 뒤에만 직접 `/maintain-verification-skill`을 돌리는 쪽이 현실적이다.
- **`unslop`·`no-comments`는 `AGENTS.md` 몇 줄로 충분**: `unslop`의 33개 규칙은 영어 단어와 문법 기준이라 한국어 문서에는 그대로 맞지 않는다. "볼드·이모지 남발 금지, 과장된 결론 금지, 문장 짧게"처럼 핵심 원칙 몇 줄만 한국어에 맞게 옮겨 쓰면 된다. `no-comments`의 "주석 99% 금지"는 에이전트끼리 하루 수백 개 PR을 머지하는 환경의 규칙이라 일반 프로젝트엔 과하다. "임시방편을 정당화하는 변명 주석은 남기지 말고, 제약은 타입·린트로 옮긴다" 정도만 넣는 게 깔끔하다.

## 출처

- 영상: AI Engineer, "All Code Is Slop (Except Mine) — Lauren Tan, SpaceXSI" (2026-11-14 공개) — https://www.youtube.com/watch?v=O_zcc6Xl12g
- 발표 페이지(AI Engineer CODE 2026, 2026-11-11): https://ai.engineer/code/2026/talks/lauren-tan
- pstack 가이드: Lauren Tan(poteto), "The Complete Guide to pstack" 중 검증·출시 장 — https://github.com/cursor/plugins/blob/main/pstack/docs/guide/06-verify-and-ship.md
- 예시 저장소: https://github.com/poteto/verification-skill-example — 가상 앱 Atlas용 검증 스킬과 feature map. 공개 저장소(HTTP 200)로 확인했고, 본문의 feature map 구현 설명(`SKILL.md` 구조, `references/features/` 아래 `README.md`와 기능별 파일, 네 개의 H2)은 이 저장소 파일을 직접 열어 정리했다.
- 즉 영상에는 feature map이 개념으로만 나오고, **폴더 구조·파일 포맷·`/create-verification-skill`·`/maintain-verification-skill` 자동화·"materialized memory"라는 표현**은 poteto의 pstack 가이드와 예시 저장소에서 가져온 내용이다.
- pstack 스킬 목록·설명·설치 방법: https://github.com/cursor/plugins/tree/main/pstack (스킬 폴더: https://github.com/cursor/plugins/tree/main/pstack/skills) — 2026-11-28에 `README.md`, `plugin.json`, 주요 `SKILL.md`를 직접 열어 확인했다. 스킬 59개는 `pstack/skills` 디렉터리 항목 수 기준이고, 24개는 `principle-*` 원칙 스킬이다.
- 각 스킬의 `SKILL.md` frontmatter(`disable-model-invocation`), `unslop`의 33개 규칙, `statechart`의 TLA+·TLC 실행 절차, `maintain-verification-skill`의 결과 구분(clean/changed/blocked)은 원문 파일에서 직접 확인했다. `poteto/how` 140줄과 `pstack/skills/how` 21줄도 파일 줄 수를 센 값이다.
- 저장소 생성일은 GitHub API `GET /repos/poteto/{noodle}` 같은 엔드포인트의 `created_at`으로 받아 확인했다(2026-11-28).
- `poteto/how`: https://github.com/poteto/how — README와 `skills/how/SKILL.md` 기준.
- `poteto/noodle`: https://github.com/poteto/noodle — README와 `INSTALL.md` 기준, 문서 https://noodle-run.github.io/noodle/.
- `poteto/brainmaxxing`: https://github.com/poteto/brainmaxxing — README 기준(스킬 6개·원칙 16개, Claude Code용).
- 위 스킬·도구 설명과 적용법은 이 공개 저장소들에서 가져왔고, "4단계"는 발표 내용을 저장소의 스킬·원칙과 대조해 정리한 것이다.
- 이 정리는 위 영상의 **전체 스크립트(자동 생성 자막)** 를 바탕으로 했다. 자막 오인식이 일부 있어(Grok Bot이 Grabbot/Grockbot/Grathbot 등으로 표기됨) 고유명사는 발표 페이지 표기를 따랐고, 화면에 띄운 슬라이드 이미지는 옮기지 않았다.
