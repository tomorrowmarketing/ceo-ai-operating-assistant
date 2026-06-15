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
  if (process.env.ENABLE_NOTION_INTEGRATION !== "true") return "mock";
  return process.env.DATA_SOURCE === "notion" ? "notion" : "mock";
}

/**
 * 입력된 값에서 Notion 데이터베이스 ID(32 hex)만 추출한다.
 * 전체 URL(`.../<id>?v=<view>`)이나 대시 포함/미포함 모두 허용.
 */
export function cleanDatabaseId(raw?: string): string {
  if (!raw) return "";
  const m = raw.match(
    /[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}/
  );
  return (m ? m[0] : raw).replace(/-/g, "").trim();
}

/**
 * Notion 환경변수를 읽는다. 필수 값이 없으면 null (→ 호출부에서 Mock 폴백).
 */
export function readNotionEnv(): NotionEnv | null {
  if (process.env.ENABLE_NOTION_INTEGRATION !== "true") return null;

  const token = process.env.NOTION_TOKEN;
  if (!token) return null;

  const db = {
    advertisers: cleanDatabaseId(process.env.NOTION_DB_ADVERTISERS),
    staff: cleanDatabaseId(process.env.NOTION_DB_STAFF),
    tasks: cleanDatabaseId(process.env.NOTION_DB_TASKS),
    communications: cleanDatabaseId(process.env.NOTION_DB_COMMUNICATIONS),
    calendar: cleanDatabaseId(process.env.NOTION_DB_CALENDAR),
    finance: cleanDatabaseId(process.env.NOTION_DB_FINANCE),
    contracts: cleanDatabaseId(process.env.NOTION_DB_CONTRACTS),
  };

  return { token, db };
}
