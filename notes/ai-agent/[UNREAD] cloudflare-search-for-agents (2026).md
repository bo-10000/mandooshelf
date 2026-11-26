---
title: "에이전트엔 크롤링 대신 검색을: Cloudflare Search for Agents"
published_at: 2026-11-25
source: "Cloudflare Blog"
url: "https://blog.cloudflare.com/search-for-agents/"
tags: [ai-agent, ai-search, cloudflare, agent-readiness, discoverability, http-query, rfc-10008, markdown-for-agents]
status: unread
---

## 한 줄 요약

Cloudflare가 **존(zone) 단위 토글 하나로 AI Search 인스턴스를 만들고, 그 검색 API를 사이트가 스스로 광고하게** 한 기능(2026-11-25 공개, 대시보드에는 Beta 배지). 에이전트는 페이지를 하나씩 크롤링하는 대신 `/.well-known/search`를 호출해 사이트 내용을 **Markdown 결과**로 받는다. 인덱스 생성·엔드포인트 연결·에이전트 안내문 작성까지 고객이 직접 하던 배선을 네트워크 레벨에서 대신해 준다.

> 글: Celso Martinho, Gabriel Massadas, Nelson Duarte (Cloudflare), 2026-11-25. 앞선 **Markdown for Agents**의 자연스러운 확장으로 소개한다.

## 핵심 구도

- **토글** — Cloudflare 대시보드의 존 페이지 > Quick Actions에 `Search for Agents` 스위치가 생겼다(또는 API로 켠다). 켜면 끝.
- **자동 인덱싱** — 켜는 순간 계정에 **AI Search 인스턴스가 생성되고** 존의 콘텐츠를 크롤링·변환·인덱싱한다. 기존에는 사이트를 데이터 소스로 등록하고, 검색 엔드포인트를 자기 도메인에 붙이고, 에이전트가 인덱스 위치와 사용법을 알게 하는 통합 작업을 손으로 해야 했다.
- **자동 광고(discoverability)** — 사이트의 **모든 페이지 응답에 검색 엔드포인트를 붙인다.** HTML이면 `<meta name="agent:*">` 4개, Markdown for Agents까지 켜 두면 같은 내용이 응답의 **YAML frontmatter**로 실린다.
- **검색 API** — `https://{도메인}/.well-known/search?q={query}` GET. 결과는 **생성된 답변이 아니라 검색된 문서 조각(Markdown + score)** 이다.
- **HTTP `QUERY` 메서드 지원** — 2026년 6월 RFC 10008(IETF Proposed Standard, Cloudflare의 James Snell 공저)로 검색 조건을 요청 본문에 실어 보내는 새 메서드를 네이티브로 받는다.

## 동작 방식

1. **켜기** — 대시보드 토글 또는 API.

![Cloudflare 대시보드 Quick Actions의 Search for Agents 토글 — 켜면 인스턴스가 Ready로 표시된다](/mandooshelf/images/cloudflare-search-for-agents-2026/01-dashboard-toggle.png)

2. **인덱싱** — AI Search 인스턴스가 **기본 설정으로** 생성되고 크롤링이 시작된다. 이후 rerank 켜기, 캐시 설정 같은 옵션은 언제든 바꿀 수 있고, 인스턴스는 대시보드에서 바로 열거나 계정의 **AI > AI Search** 목록에서도 볼 수 있다.
   - Cloudflare 자사 블로그 인스턴스 화면: 페이지 10.27k 인덱싱, 벡터 10,369개(1,024차원), 저장 2.53GB, 크롤 1시간 39분.

![자동 생성된 AI Search 인스턴스 — blog.cloudflare.com 10.27k 페이지·벡터 10,369개·저장 2.53GB](/mandooshelf/images/cloudflare-search-for-agents-2026/02-ai-search-instance.png)

3. **광고** — HTML 응답의 `<head>`에 다음 네 줄이 붙는다.

```html
<meta name="agent:instructions" content="Use this search API to find relevant content across this site with keywords or natural-language queries, instead of crawling individual pages. Results are returned in Markdown.">
<meta name="agent:endpoint" content="https://developers.cloudflare.com/.well-known/search?q={query}">
<meta name="agent:method" content="GET">
<meta name="agent:documentation" content="https://developers.cloudflare.com/ai-search/how-to/search-for-agents/">
```

   - `Accept: text/markdown`으로 페이지를 요청하면 같은 정보가 frontmatter로 온다.

```yaml
---
agent:
  instructions: "Use this search API to find relevant content across this site ... Results are returned in Markdown."
  endpoint: "https://developers.cloudflare.com/.well-known/search?q={query}"
  method: "GET"
  documentation: "https://developers.cloudflare.com/ai-search/how-to/search-for-agents/"
---
```

4. **검색** — GET으로 키워드, 또는 자연어 질문을 던진다. 결과는 문서 경로·score·Markdown 본문의 나열이다.

```bash
curl "https://developers.cloudflare.com/.well-known/search?q=cloudflare+artifacts"
# Search results for: "cloudflare artifacts"
## docs/artifacts/api/workers-binding/index.md (score: 1.000)
## docs/artifacts/index.md (score: 0.951)

curl --get "https://developers.cloudflare.com/.well-known/search" \
  --data-urlencode "q=What is the maximum push size for Cloudflare Artifacts?"
```

   - `QUERY`는 본문에 평문이나 JSON을 실어 보낸다. GET처럼 URL 길이·인코딩에 묶이지 않고, 서버 상태를 바꾸지 않는 멱등 요청이라 검색에 맞는다.

```bash
curl -X QUERY 'https://developers.cloudflare.com/.well-known/search' \
  --data 'What is the maximum payload size per ingestion request in Basin Pipelines?'

curl -X QUERY 'https://developers.cloudflare.com/.well-known/search' \
  --header 'Content-Type: application/json' \
  --data '{"q":"How many bulk import requests per minute does Email Service allow?"}'
```

   - 설계 관점: **답을 만들어 주지 않는다.** "에이전트에게는 이미 모델과 대화가 있으니, 사이트는 관련 정보만 주면 된다"는 것 — 다른 AI의 답변을 끼워 넣는 대신 검색된 재료를 그대로 넘긴다.

## 실제 세션에서 보이는 모습

- 글쓴이가 개발자 문서에 먼저 켜 두고 OpenCode 세션으로 시험했다. 에이전트가 홈페이지에서 검색 엔드포인트를 발견하고, `/.well-known/search`에 질문을 던져 정답(Artifacts 최대 push 크기 64 MiB)을 받아 답했다.
- 한 번 API를 찾으면 같은 세션에서 그 사이트를 검색할 때마다 재사용한다.

![OpenCode 세션이 검색 API로 'Cloudflare Artifacts 최대 push 크기'를 찾아 64 MiB로 답한 장면](/mandooshelf/images/cloudflare-search-for-agents-2026/03-opencode-answer.png)

![개발자 문서에서 Search for Agents가 호출된 로그 — 한 번 발견한 뒤 여러 번 재사용된다](/mandooshelf/images/cloudflare-search-for-agents-2026/04-request-log.png)

## 직접 확인한 것 (2026-11-26)

글에서 켜 두었다고 한 `developers.cloudflare.com`에서 실제 응답을 확인했다.

- HTML 응답에 `agent:instructions` · `agent:endpoint` · `agent:method` · `agent:documentation` meta 4개가 그대로 들어 있다.
- `GET /.well-known/search?q=cloudflare+artifacts` → `# Search results for: "cloudflare artifacts"` 형식의 Markdown과 score(1.000, 0.951, 0.939 …) 내림차순 결과.
- `QUERY`로 본문에 질문을 실어 보내도 같은 형식으로 결과가 온다.
- `Accept: text/markdown`으로 페이지를 받으면 frontmatter에 `agent:` 블록이 실려 온다.

즉 글의 설명·화면과 실제 응답이 일치한다. 다만 우리 도메인에서 토글했을 때의 동작은 확인하지 못했으니(Cloudflare 존 없음) 그 부분은 글과 문서 기준이다.

## 서비스 범위·제약

- **대상**: 모든 고객 — **Free 포함(한도 내)**. 대시보드에는 Beta 배지가 붙어 있다.
- **과금**: AI Search 요금제를 그대로 따른다(수집·인덱스 저장·쿼리 모두). 계정 공통 포함량은 월 **수집 500만 토큰 · 저장 10GB-month · semantic 1,000회 · full-text 1,000회**(AI Search 과금은 2026-12-01 시작). 초과 시 $0.75/백만 토큰, $2.00/GB-month, semantic $0.75/1,000회, full-text $0.10/1,000회.
- **Free 플랜 한도**: 하루 **500페이지 크롤**이 실질 병목, 인스턴스당 파일 10만 개.
- **접근 통제는 존 설정을 그대로 따른다** — 봇 관리 설정, AI Crawl Control, WAF. 검색 API도 우리가 정한 크롤러 정책 밖에서 열리지 않는다.
- **여전히 AI Search 인스턴스** — 같은 인덱스로 public REST API, MCP 엔드포인트, Workers 바인딩, 사이트 내 검색 UI(사람 방문자용)를 함께 쓸 수 있다.

![같은 인덱스를 사람 방문자용 사이트 검색으로 임베드한 화면](/mandooshelf/images/cloudflare-search-for-agents-2026/05-ai-search-snippet.png)

- 글은 **Agent Readiness** 페이지(에이전트 인증 방식, 보여줄 콘텐츠 범위, 받는 포맷, 과금 방식)도 함께 보라고 권한다.

## 쓸모 / 주의할 점

- llms.txt·사이트맵·크롤 정책을 손으로 관리하던 "에이전트 발견성" 문제를 **응답 메타데이터로 자동화**한 사례. RAG 인프라를 직접 만들지 않고 검색 계층만 얹는 선택지가 생긴다.
- 다만 "토글만 켜면 최신"이라고 가정하면 안 된다 — 크롤 주기·캐시 설정에 따라 인덱스가 늦는다.
- `QUERY`는 아직 채택 초기다(curl·undici는 채택, fetch 명세는 논의 중). 상대 에이전트가 GET만 쓴다면 GET 경로가 기본.
- 검색 결과에 score가 붙어 오지만, 문서에 적힌 표·수치가 한 덩어리 텍스트로 뭉개져 오는 경우가 있다(위 Limits 예시처럼 표가 한 줄로 붙는다). 표 기반 문서는 결과 품질이 떨어질 수 있다.

## 내 생각 / 메모

<!-- 읽고 나서 정리: 사내 문서·블로그에 얹을 만한지, MCP 엔드포인트로 우리 문서를 물릴 때와 뭐가 다른지, Free 한도(하루 500페이지)가 우리 사이트 규모에 맞는지 -->
