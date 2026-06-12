/**
 * 도메인 타입 정의
 *
 * 핵심 원칙:
 *   광고주 = 계약 + 업무 + 커뮤니케이션 + 일정 + 재무 + 광고 성과
 *
 * 모든 식별 정보는 마스킹된 형태로만 저장한다. (docs/05-security-policy.md 참고)
 */

/** 운영 상태 라벨. UI 전반에서 우선순위/색상 기준으로 사용한다. */
export type Severity = "긴급" | "주의" | "정상" | "확인필요" | "승인필요";

/** 광고주 업종 */
export type Industry = "병의원" | "법무법인" | "장기렌트/리스";

/** 광고주 운영 상태 */
export type AdvertiserStatus = "정상" | "주의" | "위험" | "온보딩";

export interface Advertiser {
  id: string;
  /** 표시용 상호명 (실제 식별정보 아님) */
  name: string;
  industry: Industry;
  status: AdvertiserStatus;
  /** 월 광고 예산 (원) */
  monthlyBudget: number;
  /** 담당 직원 id */
  managerId: string;
  /** 거래 시작월 (YYYY-MM) */
  since: string;
  /** 최근 30일 리드 수 */
  leads30d: number;
  /** 직전 30일 대비 리드 증감률 (%) */
  leadDeltaPct: number;
  /** 최근 상담 전환율 (%) */
  consultRate: number;
  /** 마지막 접점 일자 (YYYY-MM-DD) */
  lastContact: string;
}

/** 직원 */
export interface Staff {
  id: string;
  name: string;
  role: string;
  team: "AE" | "운영" | "디자인" | "미디어";
}

export type TaskStatus = "대기" | "진행중" | "지연" | "완료";
export type TaskPriority = "높음" | "보통" | "낮음";

/** 업무 */
export interface Task {
  id: string;
  title: string;
  advertiserId: string | null;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** 마감일 (YYYY-MM-DD) */
  dueDate: string;
}

export type CommChannel = "이메일" | "카카오톡" | "전화" | "슬랙";
export type Sentiment = "긍정" | "중립" | "부정";

/** 커뮤니케이션 (수신 요약본만 저장, 원문/개인정보 미저장) */
export interface Communication {
  id: string;
  channel: CommChannel;
  advertiserId: string | null;
  /** 발신 주체 표시명 (마스킹됨) */
  from: string;
  subject: string;
  /** AI 요약 1~2문장 */
  summary: string;
  receivedAt: string; // YYYY-MM-DD HH:mm
  requiresReply: boolean;
  sentiment: Sentiment;
  important: boolean;
}

export type EventType = "광고주미팅" | "상담콜" | "내부회의" | "개인";

/** 캘린더 일정 */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  type: EventType;
  advertiserId: string | null;
  /** 개인 일정은 제목/세부내용을 노출하지 않는다. */
  isPrivate: boolean;
}

export type FinanceType = "입금예정" | "미수금" | "지출" | "세금계산서";
export type FinanceStatus = "예정" | "완료" | "연체";

/** 재무 거래 (금액/상태만, 계좌·카드번호 미저장) */
export interface FinanceTransaction {
  id: string;
  advertiserId: string | null;
  type: FinanceType;
  /** 금액 (원) */
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: FinanceStatus;
  memo: string;
}

export type ContractStatus = "진행중" | "갱신예정" | "만료임박" | "종료";

/** 계약 */
export interface Contract {
  id: string;
  advertiserId: string;
  title: string;
  /** 월 계약금액 (원) */
  monthlyValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: ContractStatus;
  autoRenew: boolean;
}

// ───────────────────────── 브리핑 파생 타입 ─────────────────────────

/** 대표가 직접 처리해야 할 액션 아이템 */
export interface CeoActionItem {
  id: string;
  severity: Severity;
  title: string;
  context: string;
  advertiserName?: string;
  /** 왜 대표가 직접 봐야 하는지 */
  reason: string;
}

/** 광고주 리스크 신호 */
export interface RiskSignal {
  advertiserId: string;
  advertiserName: string;
  industry: Industry;
  severity: Severity;
  /** 리스크 사유 목록 */
  signals: string[];
  recommendation: string;
}

/** 직원별 업무 병목 요약 */
export interface StaffBottleneck {
  staffId: string;
  staffName: string;
  team: Staff["team"];
  overdueCount: number;
  inProgressCount: number;
  /** 가장 오래 지연된 업무 제목 */
  topOverdueTask?: string;
  severity: Severity;
}

/** 중요 커뮤니케이션 요약 항목 */
export interface CommHighlight {
  id: string;
  channel: CommChannel;
  advertiserName?: string;
  from: string;
  summary: string;
  receivedAt: string;
  severity: Severity;
  requiresReply: boolean;
}

/** 재무 및 계약 알림 */
export interface FinanceAlert {
  id: string;
  severity: Severity;
  category: "미수금" | "입금예정" | "지출" | "세금계산서" | "계약";
  title: string;
  amount?: number;
  dueDate?: string;
  advertiserName?: string;
}

/** 승인 필요 항목 (AI가 초안을 준비했으나 대표 승인 전까지 실행 불가) */
export interface ApprovalItem {
  id: string;
  title: string;
  /** AI가 준비한 액션 종류 */
  actionType: "메일발송" | "메시지발송" | "일정조정" | "계약갱신" | "예산조정";
  advertiserName?: string;
  draftSummary: string;
  /** 승인 시 실행될 외부 행동 (현재 MVP는 실행하지 않음) */
  ifApproved: string;
}

/** AI 추천 액션 (실행 아님, 제안만) */
export interface RecommendedAction {
  id: string;
  title: string;
  rationale: string;
  advertiserName?: string;
  expectedImpact: string;
}

/** 오늘 일정 요약 */
export interface ScheduleSummary {
  totalCount: number;
  advertiserMeetingCount: number;
  firstEvent?: string;
  events: Array<{
    id: string;
    time: string;
    title: string;
    type: EventType;
    advertiserName?: string;
  }>;
}

/** 일일 브리핑 최상위 객체 */
export interface DailyBriefing {
  date: string; // YYYY-MM-DD
  greeting: string;
  /** 한 줄 운영 헤드라인 */
  headline: string;
  /** 핵심 지표 요약 */
  metrics: {
    activeAdvertisers: number;
    atRiskAdvertisers: number;
    todayMeetings: number;
    overdueTasks: number;
    needsReplyComms: number;
    pendingApprovals: number;
  };
  schedule: ScheduleSummary;
  actionItems: CeoActionItem[];
  riskSignals: RiskSignal[];
  staffBottlenecks: StaffBottleneck[];
  commHighlights: CommHighlight[];
  financeAlerts: FinanceAlert[];
  approvals: ApprovalItem[];
  recommendations: RecommendedAction[];
}

/**
 * 광고주 360° 상세 뷰.
 * 핵심 원칙(광고주 = 계약+업무+커뮤니케이션+일정+재무+광고 성과)을 한 화면에 모은다.
 */
export interface AdvertiserDetail {
  advertiser: Advertiser;
  manager?: Staff;
  performance: {
    leads30d: number;
    leadDeltaPct: number;
    consultRate: number;
    monthlyBudget: number;
  };
  contracts: Contract[];
  tasks: Task[];
  communications: Communication[];
  upcomingEvents: CalendarEvent[];
  finance: FinanceTransaction[];
  /** 해당 광고주에 감지된 리스크 신호 (없으면 undefined) */
  risk?: RiskSignal;
}
