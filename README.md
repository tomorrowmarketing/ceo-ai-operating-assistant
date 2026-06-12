# 대표님 운영 비서 (CEO AI Operating Assistant)

대한민국 **리드수집 광고대행사 대표**를 위한 **개인용 AI 운영 비서**.
일반 챗봇이 아니라, 대표가 **매일 오전 5분 안에 회사 운영 상황을 파악**하는 **운영 브리핑 대시보드**입니다.

> 핵심 원칙: **광고주 = 계약 + 업무 + 커뮤니케이션 + 일정 + 재무 + 광고 성과**
> AI는 읽고·요약하고·우선순위를 정하고·추천하며, **대표의 승인 없이 외부 행동을 실행하지 않습니다.**

---

## 현재 단계 (1차 MVP)

**Mock 데이터 기반 웹 대시보드.** 실제 외부 API 연동/인증/자동 실행 기능은 포함하지 않습니다.

### 화면 구성 (대표가 먼저 판단할 순서)
1. **일일 브리핑 헤더** — 인사, 오늘의 운영 헤드라인, 핵심 지표 6종
2. **대표님이 먼저 판단할 항목** — 대표의 결정·관계·승인이 필요한 TOP 액션
3. **승인 필요 항목** — AI가 준비한 초안 (승인 전 미실행) / **오늘 일정**
4. **광고주 리스크 신호** / **중요 커뮤니케이션**
5. **직원 업무 병목** / **재무·계약 알림**
6. **AI 추천 액션** — 제안만, 자동 실행 없음

## 기술 스택

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- 데이터: Mock TypeScript (`src/lib/mock/`)

## 빠른 시작

```bash
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

프로덕션 빌드 검증 / 테스트:

```bash
npm run build   # 타입체크 + 프로덕션 빌드
npm test        # 브리핑 비즈니스 로직 단위 테스트 (node:test + tsx)
```

## 주요 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 일일 운영 브리핑 대시보드 |
| `/advertisers` | 광고주 목록 |
| `/advertisers/[id]` | 광고주 360° 상세 (계약·업무·커뮤니케이션·일정·재무·성과) |

## 프로젝트 구조

```
src/
  app/                 # App Router (page.tsx = 대시보드)
  components/          # 영역별 대시보드 컴포넌트 (+ ui/ 공통 프리미티브)
  lib/
    types.ts           # 도메인 타입 단일 정의처
    mock/              # 가상 데이터 + TODAY 기준일
    data/              # DataSource 어댑터 레이어 (실데이터 교체 지점)
    briefing/          # 비즈니스 로직(순수 함수) + 일일 브리핑 조립 (+ *.test.ts)
    advertiser.ts      # 광고주 360° 상세 뷰 빌더
docs/                  # 제품 문서 00~09
CLAUDE.md              # AI 코딩 도구용 단일 기준 문서
AGENTS.md              # 타 AI 도구 호환용 요약
```

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/00-product-vision.md](docs/00-product-vision.md) | 제품 비전 |
| [docs/01-mvp-scope.md](docs/01-mvp-scope.md) | MVP 범위/비범위 |
| [docs/02-user-workflow.md](docs/02-user-workflow.md) | 대표의 하루 사용 흐름 |
| [docs/03-data-model.md](docs/03-data-model.md) | 데이터 모델 |
| [docs/04-integrations.md](docs/04-integrations.md) | 향후 연동 대상 |
| [docs/05-security-policy.md](docs/05-security-policy.md) | 민감정보·보안 정책 |
| [docs/06-agent-rules.md](docs/06-agent-rules.md) | AI 행동 규칙 |
| [docs/07-roadmap.md](docs/07-roadmap.md) | 로드맵 |
| [docs/08-decision-log.md](docs/08-decision-log.md) | 결정 로그 |
| [docs/09-open-questions.md](docs/09-open-questions.md) | 미해결 질문 |

## 보안 / 민감정보

전체 전화번호·계좌·카드·주민번호, 환자/사건 상세, 원본 리드 DB, 개인 일정 상세는
**저장하지 않거나 마스킹**합니다. 자세한 내용은 [docs/05-security-policy.md](docs/05-security-policy.md) 참고.

## 라이선스

비공개 / 내부용.
