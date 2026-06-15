import type { DataSource } from "../source";
import { queryDatabase } from "./client";
import { readNotionEnv } from "./env";
import {
  mapAdvertiser,
  mapCalendarEvent,
  mapCommunication,
  mapContract,
  mapFinance,
  mapStaff,
  mapTask,
} from "./map";

/** Asia/Seoul 기준 오늘 날짜 (YYYY-MM-DD) */
function seoulToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date()
  );
}

/**
 * Notion 7개 DB를 병렬 fetch → 매핑 → DataSource 스냅샷으로 조립한다.
 * 토큰 미설정 시 throw (호출부 loadDataSource 에서 Mock 폴백).
 */
export async function createNotionSource(): Promise<DataSource> {
  const env = readNotionEnv();
  if (!env) throw new Error("NOTION_TOKEN 이(가) 설정되지 않았습니다.");
  const { token, db } = env;

  const [
    advPages,
    staffPages,
    taskPages,
    commPages,
    calPages,
    finPages,
    contractPages,
  ] = await Promise.all([
    queryDatabase(token, db.advertisers),
    queryDatabase(token, db.staff),
    queryDatabase(token, db.tasks),
    queryDatabase(token, db.communications),
    queryDatabase(token, db.calendar),
    queryDatabase(token, db.finance),
    queryDatabase(token, db.contracts),
  ]);

  const advertisers = advPages.map(mapAdvertiser);
  const staff = staffPages.map(mapStaff);
  const tasks = taskPages.map(mapTask);
  const communications = commPages.map(mapCommunication);
  const calendarEvents = calPages.map(mapCalendarEvent);
  const financeTransactions = finPages.map(mapFinance);
  const contracts = contractPages.map(mapContract);

  const advIndex = new Map(advertisers.map((a) => [a.id, a]));
  const staffIndex = new Map(staff.map((s) => [s.id, s]));

  return {
    today: seoulToday(),
    advertisers,
    staff,
    tasks,
    communications,
    calendarEvents,
    financeTransactions,
    contracts,
    advertiserById: (id) => (id ? advIndex.get(id) : undefined),
    advertiserName: (id) => (id ? advIndex.get(id)?.name : undefined),
    staffById: (id) => staffIndex.get(id),
  };
}
