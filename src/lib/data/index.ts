import { mockSource } from "./mockSource";
import type { DataSource } from "./source";

export type { DataSource } from "./source";

/**
 * 활성 데이터 소스.
 *
 * 현재는 Mock. 실데이터 연동 단계에서 **이 한 줄만** 다른 어댑터로 교체하면
 * 모든 브리핑/대시보드 로직이 그대로 따라간다.
 */
export const data: DataSource = mockSource;

/** 활성 데이터 소스를 반환한다. (향후 환경별 분기 지점) */
export function getDataSource(): DataSource {
  return data;
}
