import type { DataSource } from "../source";
import { queryDatabase } from "./client";
import { readNotionEnv } from "./env";
import {
  PROPS,
  extractPeople,
  mapAdvertiser,
  mapCalendarEvent,
  mapCommunication,
  mapContract,
  mapFinance,
  mapStaff,
  mapTask,
} from "./map";
import type { Staff } from "@/lib/types";

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

  // 표 하나가 실패(미연결/404 등)해도 나머지는 표시되도록 부분 실패를 허용한다.
  const safe = async (label: string, id: string) => {
    try {
      return await queryDatabase(token, id);
    } catch (e) {
      if (id) console.warn(`[notion] '${label}' 로드 실패:`, (e as Error).message);
      return [];
    }
  };

  const [
    advPages,
    staffPages,
    taskPages,
    commPages,
    calPages,
    finPages,
    contractPages,
  ] = await Promise.all([
    safe("광고주", db.advertisers),
    safe("직원", db.staff),
    safe("업무", db.tasks),
    safe("커뮤니케이션", db.communications),
    safe("일정", db.calendar),
    safe("재무", db.finance),
    safe("계약", db.contracts),
  ]);

  const advertisers = advPages.map(mapAdvertiser);
  const tasks = taskPages.map(mapTask);

  // 직원 DB가 없으면 업무의 '담당자(사람)' 속성에서 직원 목록을 도출한다.
  let staff: Staff[] = staffPages.map(mapStaff);
  if (staff.length === 0) {
    staff = extractPeople(taskPages, PROPS.task.assignee).map((p) => ({
      id: p.id,
      name: p.name || "이름없음",
      role: "",
      team: "운영",
    }));
  }

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
