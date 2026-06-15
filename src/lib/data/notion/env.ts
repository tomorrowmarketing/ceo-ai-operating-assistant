/**
 * Notion 연동 환경변수 읽기/검증. (서버 전용)
 * 토큰은 절대 클라이언트로 노출되지 않으며 서버 코드에서만 참조한다.
 */
export interface NotionEnv {
  token: string;
  db: {
    advertisers: string;
    staff: string;
    tasks: string;
    communications: string;
    calendar: string;
    finance: string;
    contracts: string;
  };
}

/** DATA_SOURCE 값 (mock | notion). 미설정 시 mock. */
export function activeSourceName(): "mock" | "notion" {
  return process.env.DATA_SOURCE === "notion" ? "notion" : "mock";
}

/**
 * Notion 환경변수를 읽는다. 필수 값이 없으면 null (→ 호출부에서 Mock 폴백).
 */
export function readNotionEnv(): NotionEnv | null {
  const token = process.env.NOTION_TOKEN;
  if (!token) return null;

  const db = {
    advertisers: process.env.NOTION_DB_ADVERTISERS ?? "",
    staff: process.env.NOTION_DB_STAFF ?? "",
    tasks: process.env.NOTION_DB_TASKS ?? "",
    communications: process.env.NOTION_DB_COMMUNICATIONS ?? "",
    calendar: process.env.NOTION_DB_CALENDAR ?? "",
    finance: process.env.NOTION_DB_FINANCE ?? "",
    contracts: process.env.NOTION_DB_CONTRACTS ?? "",
  };

  return { token, db };
}
