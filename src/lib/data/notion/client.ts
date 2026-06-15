/**
 * 의존성 없는 fetch 기반 Notion 클라이언트.
 * Notion REST API(https://api.notion.com/v1)를 직접 호출한다. (새 npm 패키지 없음)
 */

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

/** Notion 페이지(행) 1건. properties 는 속성명 → 값 객체. */
export interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
}

interface QueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * 데이터베이스의 모든 행을 페이지네이션을 따라 끝까지 가져온다.
 * 빈 databaseId 면 빈 배열(연동되지 않은 컬렉션 허용).
 */
export async function queryDatabase(
  token: string,
  databaseId: string
): Promise<NotionPage[]> {
  if (!databaseId) return [];

  const pages: NotionPage[] = [];
  let cursor: string | null = null;

  do {
    const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor ?? undefined }),
      // Next.js: 5분 캐시 후 재검증 (docs/10 §4)
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Notion query 실패 (db=${databaseId}, status=${res.status}): ${detail.slice(0, 200)}`
      );
    }

    const json = (await res.json()) as QueryResponse;
    pages.push(...json.results);
    cursor = json.has_more ? json.next_cursor : null;
  } while (cursor);

  return pages;
}
