/**
 * Notion 페이지(행) → 도메인 타입 매퍼 (순수 함수).
 *
 * 보안: 마스킹/최소수집을 이 ingestion 경계에서 강제한다. (docs/05, docs/10 §3)
 *  - 전화번호는 마스킹 후 저장
 *  - 계좌/카드/주민번호 등은 애초에 매핑하지 않음 (도메인 객체에 넣지 않음)
 *  - 커뮤니케이션은 요약 속성만 읽고 원문 본문은 읽지 않음
 */
import type {
  Advertiser,
  AdvertiserStatus,
  CalendarEvent,
  CommChannel,
  Communication,
  Contract,
  ContractStatus,
  EventType,
  FinanceStatus,
  FinanceTransaction,
  FinanceType,
  Industry,
  Sentiment,
  Staff,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import type { NotionPage } from "./client";

/**
 * 데이터베이스별 속성명. 대표님의 실제 Notion 속성명에 맞춰 이 한 곳만 바꾸면 된다.
 */
export const PROPS = {
  advertiser: {
    name: "상호명",
    industry: "업종",
    status: "상태",
    monthlyBudget: "월예산",
    manager: "담당자",
    since: "거래시작",
    leads30d: "30일리드",
    leadDeltaPct: "리드증감",
    consultRate: "상담전환율",
    lastContact: "마지막접점",
  },
  staff: { name: "이름", role: "역할", team: "팀" },
  // Tomorrow company "업무 진행 현황" 표 기준 (npm run notion:inspect 로 최종 확인)
  task: {
    title: "이름",
    advertiser: "광고주 진행 상황",
    assignee: "담당자",
    status: "상태",
    priority: "우선순위", // 없으면 기본 '보통'
    dueDate: "날짜",
  },
  communication: {
    channel: "채널",
    advertiser: "광고주",
    from: "발신자",
    subject: "제목",
    summary: "요약",
    receivedAt: "수신시각",
    requiresReply: "회신필요",
    sentiment: "감성",
    important: "중요",
  },
  calendar: {
    title: "제목",
    date: "날짜",
    start: "시작",
    end: "종료",
    type: "유형",
    advertiser: "광고주",
    isPrivate: "개인일정",
  },
  finance: {
    type: "유형",
    advertiser: "광고주",
    amount: "금액",
    dueDate: "기한",
    status: "상태",
    memo: "메모",
  },
  contract: {
    title: "제목",
    advertiser: "광고주",
    monthlyValue: "월계약금액",
    startDate: "시작",
    endDate: "종료",
    status: "상태",
    autoRenew: "자동갱신",
  },
} as const;

// ───────────────────────── 속성 접근 헬퍼 ─────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

function plainText(p: Props, key: string): string {
  const v = p[key];
  const arr = v?.title ?? v?.rich_text;
  if (Array.isArray(arr)) return arr.map((t: any) => t.plain_text ?? "").join("").trim();
  return "";
}
function num(p: Props, key: string): number {
  const n = p[key]?.number;
  return typeof n === "number" ? n : 0;
}
/** Select / Status 두 타입 모두 지원 (Notion 'Status' 타입은 .status 아래에 있음) */
function select(p: Props, key: string): string {
  const v = p[key];
  return v?.select?.name ?? v?.status?.name ?? "";
}

/** 페이지 목록에서 Person 속성의 고유 사용자 {id, name} 추출 (직원 도출용) */
export function extractPeople(
  pages: { properties: Props }[],
  key: string
): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const pg of pages) {
    const ppl = pg.properties[key]?.people;
    if (Array.isArray(ppl)) {
      for (const u of ppl) if (u?.id) seen.set(u.id, u.name ?? "");
    }
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

/** 거래처의 자유로운 상태 표기를 우리 TaskStatus 로 정규화 */
export function normalizeTaskStatus(raw: string): TaskStatus {
  const v = raw.replace(/\s/g, "");
  if (v.includes("완료")) return "완료";
  if (v.includes("지연") || v.includes("보류")) return "지연";
  if (v.includes("진행")) return v.includes("전") ? "대기" : "진행중";
  if (v.includes("대기") || v.includes("예정")) return "대기";
  return "대기";
}
function dateOnly(p: Props, key: string): string {
  return (p[key]?.date?.start ?? "").slice(0, 10);
}
function dateEnd(p: Props, key: string): string {
  return (p[key]?.date?.end ?? "").slice(0, 10);
}
function dateTime(p: Props, key: string): string {
  const s: string = p[key]?.date?.start ?? "";
  return s ? s.replace("T", " ").slice(0, 16) : "";
}
function checkbox(p: Props, key: string): boolean {
  return p[key]?.checkbox === true;
}
/** 첫 relation/people id (광고주·담당자 연결) */
function refId(p: Props, key: string): string {
  const rel = p[key]?.relation;
  if (Array.isArray(rel) && rel[0]?.id) return rel[0].id;
  const ppl = p[key]?.people;
  if (Array.isArray(ppl) && ppl[0]?.id) return ppl[0].id;
  return "";
}

/** 전화번호 마스킹: 010-1234-5678 / 01012345678 → 010-****-5678 */
export function maskPhone(text: string): string {
  return text.replace(/(\d{2,3})[-\s]?\d{3,4}[-\s]?(\d{4})/g, "$1-****-$2");
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ───────────────────────── 엔티티 매퍼 ─────────────────────────

export function mapAdvertiser(page: NotionPage): Advertiser {
  const p = page.properties as Props;
  const k = PROPS.advertiser;
  return {
    id: page.id,
    name: plainText(p, k.name),
    industry: (select(p, k.industry) || "병의원") as Industry,
    status: (select(p, k.status) || "정상") as AdvertiserStatus,
    monthlyBudget: num(p, k.monthlyBudget),
    managerId: refId(p, k.manager),
    since: dateOnly(p, k.since).slice(0, 7),
    leads30d: num(p, k.leads30d),
    leadDeltaPct: num(p, k.leadDeltaPct),
    consultRate: num(p, k.consultRate),
    lastContact: dateOnly(p, k.lastContact),
  };
}

export function mapStaff(page: NotionPage): Staff {
  const p = page.properties as Props;
  const k = PROPS.staff;
  return {
    id: page.id,
    name: plainText(p, k.name),
    role: plainText(p, k.role),
    team: (select(p, k.team) || "운영") as Staff["team"],
  };
}

export function mapTask(page: NotionPage): Task {
  const p = page.properties as Props;
  const k = PROPS.task;
  return {
    id: page.id,
    title: plainText(p, k.title),
    advertiserId: refId(p, k.advertiser) || null,
    assigneeId: refId(p, k.assignee),
    status: normalizeTaskStatus(select(p, k.status)),
    priority: (select(p, k.priority) || "보통") as TaskPriority,
    dueDate: dateOnly(p, k.dueDate),
  };
}

export function mapCommunication(page: NotionPage): Communication {
  const p = page.properties as Props;
  const k = PROPS.communication;
  return {
    id: page.id,
    channel: (select(p, k.channel) || "이메일") as CommChannel,
    advertiserId: refId(p, k.advertiser) || null,
    from: maskPhone(plainText(p, k.from)), // 마스킹 강제
    subject: plainText(p, k.subject),
    summary: plainText(p, k.summary), // 요약만, 원문 본문 미수집
    receivedAt: dateTime(p, k.receivedAt),
    requiresReply: checkbox(p, k.requiresReply),
    sentiment: (select(p, k.sentiment) || "중립") as Sentiment,
    important: checkbox(p, k.important),
  };
}

export function mapCalendarEvent(page: NotionPage): CalendarEvent {
  const p = page.properties as Props;
  const k = PROPS.calendar;
  const isPrivate = checkbox(p, k.isPrivate);
  return {
    id: page.id,
    // 개인 일정은 제목을 노출하지 않는다
    title: isPrivate ? "개인 일정" : plainText(p, k.title),
    date: dateOnly(p, k.date),
    start: plainText(p, k.start),
    end: plainText(p, k.end),
    type: (select(p, k.type) || "내부회의") as EventType,
    advertiserId: isPrivate ? null : refId(p, k.advertiser) || null,
    isPrivate,
  };
}

export function mapFinance(page: NotionPage): FinanceTransaction {
  const p = page.properties as Props;
  const k = PROPS.finance;
  // 계좌/카드/세금계산서 원본 속성은 의도적으로 매핑하지 않는다.
  return {
    id: page.id,
    advertiserId: refId(p, k.advertiser) || null,
    type: (select(p, k.type) || "입금예정") as FinanceType,
    amount: num(p, k.amount),
    dueDate: dateOnly(p, k.dueDate),
    status: (select(p, k.status) || "예정") as FinanceStatus,
    memo: plainText(p, k.memo),
  };
}

export function mapContract(page: NotionPage): Contract {
  const p = page.properties as Props;
  const k = PROPS.contract;
  return {
    id: page.id,
    advertiserId: refId(p, k.advertiser),
    title: plainText(p, k.title),
    monthlyValue: num(p, k.monthlyValue),
    startDate: dateOnly(p, k.startDate),
    endDate: dateEnd(p, k.endDate) || dateOnly(p, k.endDate),
    status: (select(p, k.status) || "진행중") as ContractStatus,
    autoRenew: checkbox(p, k.autoRenew),
  };
}
