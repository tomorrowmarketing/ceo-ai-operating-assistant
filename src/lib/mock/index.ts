/**
 * Mock 데이터 진입점.
 *
 * TODAY 는 대시보드 계산의 기준일이다. 1차 MVP는 Mock 데이터만 사용하므로,
 * 실제 시스템 날짜가 아닌 고정 기준일을 사용해 화면을 결정적으로(deterministic)
 * 유지한다. 실데이터 연동 단계에서 이 값을 현재 날짜로 교체한다.
 */
export const TODAY = "2026-06-12";

export { staff, staffById } from "./staff";
export { advertisers, advertiserById, advertiserName } from "./advertisers";
export { tasks } from "./tasks";
export { communications } from "./communications";
export { calendarEvents } from "./calendar";
export { financeTransactions } from "./finance";
export { contracts } from "./contracts";
