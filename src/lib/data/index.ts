import { mockSource } from "./mockSource";
import { activeSourceName } from "./notion/env";
import { createNotionSource } from "./notion/notionSource";
import type { DataSource } from "./source";

export type { DataSource } from "./source";
export { mockSource } from "./mockSource";

/**
 * 활성 데이터 소스를 비동기로 로드한다.
 *
 * - `DATA_SOURCE=notion` 이면 Notion API에서 실데이터를 가져온다.
 * - 토큰 미설정 / 호출 실패 시 자동으로 Mock 으로 폴백해 화면이 깨지지 않는다.
 * - 기본값(`mock`)은 네트워크 없이 즉시 반환된다.
 *
 * 실데이터 전환은 환경변수 `DATA_SOURCE` 하나로 토글된다. (docs/10)
 */
export async function loadDataSource(): Promise<DataSource> {
  if (activeSourceName() === "notion") {
    try {
      return await createNotionSource();
    } catch (e) {
      console.warn(
        "[data] Notion 로드 실패 → Mock 으로 폴백합니다:",
        (e as Error).message
      );
    }
  }
  return mockSource;
}
