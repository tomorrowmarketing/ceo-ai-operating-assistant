# 03. 데이터 모델

타입의 단일 정의처는 [`src/lib/types.ts`](../src/lib/types.ts) 이다. 이 문서는 개념 설명이다.

## 핵심 원칙

> **광고주(Advertiser) = 계약 + 업무 + 커뮤니케이션 + 일정 + 재무 + 광고 성과**

광고주가 모든 데이터의 중심 엔티티이며, 나머지는 `advertiserId` 로 광고주에 연결된다.

## 엔티티

### Advertiser (광고주)
| 필드 | 설명 |
| --- | --- |
| id, name | 식별자, 표시용 상호명(실제 식별정보 아님) |
| industry | `병의원 / 법무법인 / 장기렌트·리스` |
| status | `정상 / 주의 / 위험 / 온보딩` |
| monthlyBudget | 월 광고 예산(원) |
| managerId | 담당 직원 |
| leads30d, leadDeltaPct, consultRate | 광고 성과 집계 지표 (원본 리드 DB 아님) |
| lastContact | 마지막 접점 일자 |

### Staff (직원)
id, name, role, team(`AE / 운영 / 디자인 / 미디어`).

### Task (업무)
title, advertiserId, assigneeId, status(`대기/진행중/지연/완료`), priority, dueDate.
`dueDate < TODAY && status != 완료` → 지연으로 간주.

### Communication (커뮤니케이션)
channel(`이메일/카카오톡/전화/슬랙`), advertiserId, from(마스킹), subject,
**summary(AI 요약)**, receivedAt, requiresReply, sentiment(`긍정/중립/부정`), important.
원문/개인정보는 저장하지 않고 요약만 저장한다.

### CalendarEvent (일정)
title, date, start/end, type(`광고주미팅/상담콜/내부회의/개인`), advertiserId, **isPrivate**.
개인 일정은 제목/내용을 노출하지 않는다.

### FinanceTransaction (재무 거래)
type(`입금예정/미수금/지출/세금계산서`), amount, dueDate, status(`예정/완료/연체`), memo.
**계좌·카드번호·세금계산서 원본은 저장하지 않는다.** 금액/상태/기한만.

### Contract (계약)
title, advertiserId, monthlyValue, startDate/endDate, status(`진행중/갱신예정/만료임박/종료`), autoRenew.

## 파생(브리핑) 타입

`DailyBriefing` 이 최상위 객체이며 다음을 포함한다:
`metrics, schedule, actionItems, riskSignals, staffBottlenecks, commHighlights,
financeAlerts, approvals, recommendations`.

각 파생 항목은 `src/lib/briefing/` 의 순수 함수가 Mock 데이터로부터 계산한다.

## 공통 라벨 — Severity

`긴급 · 주의 · 정상 · 확인필요 · 승인필요`. 정렬 우선순위와 색상의 기준.

## 기준일 (TODAY)

Mock 단계에서는 `src/lib/mock/index.ts` 의 `TODAY` 상수(2026-06-12)를 기준으로 계산한다.
화면을 결정적으로 유지하기 위함이며, 실데이터 연동 시 현재 날짜로 교체한다.
