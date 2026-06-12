import {
  TODAY,
  advertiserById,
  advertiserName,
  advertisers,
  calendarEvents,
  communications,
  contracts,
  financeTransactions,
  staff,
  staffById,
  tasks,
} from "@/lib/mock";
import type { DataSource } from "./source";

/** Mock 데이터를 DataSource 인터페이스로 노출하는 어댑터 */
export const mockSource: DataSource = {
  today: TODAY,
  advertisers,
  staff,
  tasks,
  communications,
  calendarEvents,
  financeTransactions,
  contracts,
  advertiserById,
  advertiserName,
  staffById,
};
