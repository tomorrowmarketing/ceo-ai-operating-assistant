import type {
  Advertiser,
  CalendarEvent,
  Communication,
  Contract,
  FinanceTransaction,
  Staff,
  Task,
} from "@/lib/types";

/**
 * 데이터 소스 추상화.
 *
 * 대시보드/브리핑 로직은 이 인터페이스에만 의존한다. 현재 구현은 Mock 이며,
 * 실데이터(메일·캘린더·광고·재무 등) 연동 시 같은 인터페이스를 만족하는
 * 어댑터로 교체하면 소비자 코드는 바뀌지 않는다. (docs/04-integrations.md)
 */
export interface DataSource {
  /** 계산 기준일 (YYYY-MM-DD) */
  readonly today: string;

  readonly advertisers: Advertiser[];
  readonly staff: Staff[];
  readonly tasks: Task[];
  readonly communications: Communication[];
  readonly calendarEvents: CalendarEvent[];
  readonly financeTransactions: FinanceTransaction[];
  readonly contracts: Contract[];

  advertiserById(id: string | null): Advertiser | undefined;
  advertiserName(id: string | null): string | undefined;
  staffById(id: string): Staff | undefined;
}
