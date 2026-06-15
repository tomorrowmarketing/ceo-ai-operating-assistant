/**
 * Notion 구조 점검 도구.
 *
 * 대표님의 실제 Notion 데이터베이스가 "어떤 칸(속성)으로 되어 있는지"를 그대로 읽어
 * 출력한다. 기존 Notion을 전혀 바꾸지 않고, 읽기만 한다.
 *
 * 사용:
 * Notion integration is disabled by default. This script only works when
 * ENABLE_NOTION_INTEGRATION=true and credentials are intentionally restored.
 *
 * 출력된 칸 목록을 보고 src/lib/data/notion/map.ts 의 PROPS 매핑을 맞춘다.
 */
import { readNotionEnv } from "@/lib/data/notion/env";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

/** 통합이 접근 가능한 모든 데이터베이스를 검색해 제목+ID 나열 */
async function listAllDatabases(token: string) {
  const res = await fetch(`${NOTION_API}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: { value: "database", property: "object" },
      page_size: 100,
    }),
  });
  if (!res.ok) {
    console.log(`(검색 실패: ${res.status})`);
    return;
  }
  const json = (await res.json()) as { results: { id: string; title?: unknown }[] };
  console.log(`\n===== 통합이 접근 가능한 데이터베이스 (${json.results.length}개) =====`);
  for (const db of json.results) {
    console.log(`   "${plainTitle(db.title)}"  →  ${db.id.replace(/-/g, "")}`);
  }
  console.log("=================================================\n");
}

async function retrieveDatabase(token: string, id: string) {
  const res = await fetch(`${NOTION_API}/databases/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`status ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

function plainTitle(title: unknown): string {
  if (Array.isArray(title)) {
    return title.map((t) => (t as { plain_text?: string }).plain_text ?? "").join("");
  }
  return "(제목 없음)";
}

async function main() {
  const env = readNotionEnv();
  if (!env) {
    console.error(
      "NOTION_TOKEN 이 없습니다. .env.local 에 토큰과 DB ID 를 먼저 입력하세요."
    );
    process.exit(1);
  }

  await listAllDatabases(env.token);

  const targets = Object.entries(env.db) as [string, string][];
  for (const [key, id] of targets) {
    if (!id) {
      console.log(`\n■ ${key}: (DB ID 미설정 - 건너뜀)`);
      continue;
    }
    try {
      const db = await retrieveDatabase(env.token, id);
      const name = plainTitle(db.title);
      const props = db.properties as Record<string, { type: string }>;
      console.log(`\n■ ${key} → "${name}"`);
      for (const [propName, def] of Object.entries(props)) {
        console.log(`   - ${propName}  [${def.type}]`);
      }
    } catch (e) {
      console.log(`\n■ ${key}: 읽기 실패 (${(e as Error).message})`);
      console.log("   → 토큰/DB ID 확인, 그리고 이 DB에 통합을 'Connect' 했는지 확인하세요.");
    }
  }
  console.log("\n완료. 위 칸 목록을 알려주시면 매핑을 맞춰드립니다.");
}

main();
