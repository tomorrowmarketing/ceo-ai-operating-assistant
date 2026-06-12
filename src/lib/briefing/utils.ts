import type { Severity } from "@/lib/types";

/** YYYY-MM-DD 문자열을 로컬 자정 Date로 파싱 */
export function parseDate(d: string): Date {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day);
}

/** a - b (일 단위). 양수면 a가 미래. */
export function daysBetween(a: string, b: string): number {
  const ms = parseDate(a).getTime() - parseDate(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** dueDate가 today 이전이면 지연 */
export function isOverdue(dueDate: string, today: string): boolean {
  return daysBetween(dueDate, today) < 0;
}

/** 금액을 한국어 친화 표기로 (예: 9,000,000 → "900만원") */
export function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = amount / 100_000_000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`;
  }
  if (amount >= 10_000) {
    const man = Math.round(amount / 10_000);
    return `${man.toLocaleString("ko-KR")}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 라벨 정렬 우선순위 (작을수록 위로) */
export const severityRank: Record<Severity, number> = {
  긴급: 0,
  승인필요: 1,
  주의: 2,
  확인필요: 3,
  정상: 4,
};

/** severity 기준 정렬 비교자 */
export function bySeverity<T extends { severity: Severity }>(
  a: T,
  b: T
): number {
  return severityRank[a.severity] - severityRank[b.severity];
}
