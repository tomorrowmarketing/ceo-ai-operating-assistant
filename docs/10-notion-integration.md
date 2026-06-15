# 10. Notion 실데이터 연동 설계 (1순위 어댑터)

> 상태: **설계 단계** (2026-06-12). 로드맵 2단계(실데이터 읽기)의 첫 어댑터로 Notion을 선택.
> 방식: **자동 API 연동** (Notion API, 읽기 전용). 쓰기(외부 행동)는 4단계에서 승인 기반으로.

이 문서는 Notion에 흩어진 운영 데이터를 대시보드의 도메인 모델(`src/lib/types.ts`)로
가져오는 방법을 정의한다. 핵심은 **기존 `DataSource` 인터페이스를 그대로 만족하는
Notion 어댑터를 추가**하는 것이며, 대시보드/브리핑 로직은 한 줄도 바뀌지 않는다.

---

## 1. 전체 구조

```
Notion API ──(fetch)──> notionClient ──> mappers(+마스킹) ──> DataSource ──> 브리핑 로직 ──> 대시보드
                                                  ▲
                                   환경변수로 mock ⇄ notion 선택
```

- 소비자(브리핑/상세 로직)는 **`DataSource` 인터페이스에만 의존** (이미 구현됨, `docs/04`).
- Notion 연동은 `DataSource`를 만족하는 **새 어댑터**일 뿐이다.
- 토큰이 없거나 호출 실패 시 **자동으로 Mock으로 폴백**해 화면이 깨지지 않는다.

### 동기/비동기 경계 (중요)
현재 `DataSource`는 동기 배열을 노출한다. 실데이터는 네트워크 fetch가 필요하므로
**비동기 로딩 경계**를 도입한다.

```ts
// 한 번 fetch해서 메모리 스냅샷(DataSource)으로 만들어 반환
export async function loadDataSource(): Promise<DataSource>
```

- 서버 컴포넌트(페이지)에서 `const ds = await loadDataSource()` 후 빌더에 주입한다.
- Mock 어댑터는 즉시 반환(네트워크 없음), Notion 어댑터는 모든 DB를 **병렬 fetch** 후 매핑.

---

## 2. Notion 데이터베이스 ↔ 도메인 매핑

대표님 워크스페이스에 아래 7개 데이터베이스가 있다고 가정한다.
(이미 있으면 속성명만 맞추고, 없으면 이 스키마로 생성하면 된다.)

### 2-1. 광고주 DB → `Advertiser`
| Notion 속성 | 타입 | 도메인 필드 |
| --- | --- | --- |
| 상호명 | Title | name |
| 업종 | Select(병의원/법무법인/장기렌트·리스) | industry |
| 상태 | Select(정상/주의/위험/온보딩) | status |
| 월예산 | Number | monthlyBudget |
| 담당자 | Relation(직원 DB) 또는 Person | managerId |
| 거래시작 | Date | since |
| 30일리드 | Number | leads30d |
| 리드증감 | Number(%) | leadDeltaPct |
| 상담전환율 | Number(%) | consultRate |
| 마지막접점 | Date | lastContact |

### 2-2. 직원 DB → `Staff`
이름(Title), 역할(Text), 팀(Select: AE/운영/디자인/미디어).

### 2-3. 업무 DB → `Task`
제목(Title), 광고주(Relation), 담당자(Relation/Person), 상태(Select: 대기/진행중/지연/완료),
우선순위(Select: 높음/보통/낮음), 마감일(Date).

### 2-4. 커뮤니케이션 DB → `Communication`
채널(Select), 광고주(Relation), 발신자(Text·**마스킹된 값만**), 제목(Text),
요약(Text·**원문 아님**), 수신시각(Date), 회신필요(Checkbox), 감성(Select), 중요(Checkbox).

### 2-5. 일정 DB → `CalendarEvent`
제목(Title), 날짜(Date), 시작/종료(Text HH:mm 또는 Date 범위), 유형(Select),
광고주(Relation), 개인일정(Checkbox → isPrivate).
> 향후 Google Calendar 직접 연동으로 대체 가능. (지금은 Notion 일정 DB 기준)

### 2-6. 재무 DB → `FinanceTransaction`
유형(Select), 광고주(Relation), 금액(Number), 기한(Date), 상태(Select), 메모(Text).
> **계좌·카드번호·세금계산서 원본은 Notion에도 두지 않는다.** 금액/상태/기한만.

### 2-7. 계약 DB → `Contract`
제목(Title), 광고주(Relation), 월계약금액(Number), 시작/종료(Date),
상태(Select), 자동갱신(Checkbox).

---

## 3. 인증 · 보안

- **Notion 토큰은 서버 전용 환경변수** `NOTION_TOKEN`. 클라이언트로 절대 전달하지 않는다.
  (모든 fetch는 서버 컴포넌트/서버 코드에서만 수행)
- 데이터베이스 ID도 환경변수(`NOTION_DB_*`).
- `.env` 는 git에 커밋하지 않는다(`.gitignore` 적용됨). `.env.example` 로 키 목록만 공유.
- **마스킹은 매퍼(ingestion) 경계에서 강제**한다 (`docs/05-security-policy.md`):
  - 전화번호 → `010-****-1234` 형태로 변환 후 저장
  - 계좌/카드/주민번호 → 매핑 단계에서 제거(아예 도메인 객체에 넣지 않음)
  - 커뮤니케이션은 **요약 속성만** 읽고 원문 본문은 읽지 않는다
  - 개인 일정은 `isPrivate=true` 시 제목을 "개인 일정"으로 치환
- Notion 통합(Integration)에는 **필요한 DB만 공유**하고 **읽기 권한**만 부여한다.

---

## 4. 동기화 전략

- 1차: **요청 시 fetch + ISR 재검증**(예: `revalidate = 300`초)으로 대시보드를 5분 단위 최신화.
- 호출 최소화: 7개 DB를 **병렬 query**, 페이지네이션(`has_more`/`next_cursor`) 처리.
- 실패 처리: 일부 DB 실패 시 해당 컬렉션만 비우고 나머지는 표시(부분 성공) + 로그.
- 토큰 미설정/전체 실패 시 **Mock 폴백**.

---

## 5. 소스 선택 (환경변수)

```
DATA_SOURCE=mock     # 기본값. 토큰 없이 동작
DATA_SOURCE=notion   # Notion API 사용 (NOTION_TOKEN 필요)
```

`src/lib/data/index.ts` 의 `loadDataSource()` 가 이 값을 보고 어댑터를 고른다.
**실데이터 전환은 이 환경변수 하나로 토글**된다.

---

## 6. 구현 골격 (예정 파일)

```
src/lib/data/
  source.ts            # DataSource 인터페이스 (기존)
  index.ts             # loadDataSource(): 환경변수로 mock/notion 선택 + 폴백
  mockSource.ts        # 기존 Mock 어댑터
  notion/
    client.ts          # 의존성 없는 fetch 기반 Notion 클라이언트(쿼리+페이지네이션)
    map.ts             # Notion page → 도메인 타입 매퍼(+마스킹). 순수 함수 → 테스트 대상
    notionSource.ts    # 7개 DB 병렬 fetch → 매핑 → DataSource 스냅샷
    env.ts             # 환경변수 읽기/검증
```

> **새 npm 의존성 없이** `fetch` + Notion REST API(`https://api.notion.com/v1`,
> 헤더 `Authorization: Bearer`, `Notion-Version`)로 구현한다. (과설계 금지 원칙)

---

## 7. 빌더 의존성 주입(DI) 리팩터링

실데이터(비동기)를 받기 위해, 브리핑 빌더가 모듈 전역 `data` 대신
**`DataSource`를 인자로 받도록** 전환한다.

```ts
// 변경 전: const { advertisers } = data;  (모듈 전역)
// 변경 후: buildRiskSignals(ds: DataSource, today: string)
```

- 페이지: `const ds = await loadDataSource(); const briefing = buildDailyBriefing(ds);`
- 장점: 테스트에서 임의 DataSource 주입 가능, mock/notion 무관하게 동일 로직.

---

## 8. 대표님이 준비할 것 (연결 시)

1. Notion 좌측 상단 → **설정 → 연결(Integrations) → 새 통합 만들기**(내부용, 읽기 권한).
2. 발급된 **토큰(secret)** 을 안전하게 전달(메신저 평문 X, 비밀 보관소 권장).
3. 위 7개 DB(또는 기존 DB) 각각을 그 통합과 **공유**.
4. 각 DB의 **링크에서 데이터베이스 ID** 확보 → 환경변수에 입력.
   > 이미 운영 중인 Notion 구조가 있으면 속성명만 알려주시면 매퍼를 그에 맞춥니다.

---

## 9. 단계 요약

1. (이번) 어댑터 골격 + 매퍼 + 환경변수 토글 + Mock 폴백 + 매퍼 테스트 — **토큰 없이도 빌드/실행**
2. 토큰·DB ID 입력 후 `DATA_SOURCE=notion` 로 실제 데이터 검증
3. ISR 재검증·부분실패 처리 튜닝
4. (이후) 다른 소스(캘린더/광고/재무) 어댑터 추가, 쓰기는 승인 기반(4단계)
