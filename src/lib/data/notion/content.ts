/**
 * Notion 페이지(업무) 본문 읽기 — 블록의 텍스트와 이미지 URL을 추출한다.
 * AI 요약이 "글과 이미지를 파악"할 수 있도록 본문 내용을 가져온다.
 * (읽기 전용 — 현재 토큰 권한으로 가능)
 */
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

/* eslint-disable @typescript-eslint/no-explicit-any */
function plain(rich: any): string {
  if (!Array.isArray(rich)) return "";
  return rich.map((t: any) => t.plain_text ?? "").join("");
}

export interface TaskContent {
  text: string;
  imageUrls: string[];
}

/**
 * 한 페이지의 자식 블록(첫 100개)에서 본문 텍스트와 이미지 URL을 추출한다.
 */
export async function fetchTaskContent(
  token: string,
  pageId: string
): Promise<TaskContent> {
  const res = await fetch(
    `${NOTION_API}/blocks/${pageId}/children?page_size=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
      },
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) throw new Error(`block children 실패 (${res.status})`);

  const json = (await res.json()) as { results: any[] };
  const lines: string[] = [];
  const imageUrls: string[] = [];

  for (const block of json.results) {
    const type: string = block.type;
    const data = block[type];
    if (data?.rich_text) {
      const t = plain(data.rich_text).trim();
      if (t) lines.push(t);
    }
    if (type === "image") {
      const url =
        data?.type === "external" ? data.external?.url : data?.file?.url;
      if (url) imageUrls.push(url);
    }
  }

  return { text: lines.join("\n"), imageUrls };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
