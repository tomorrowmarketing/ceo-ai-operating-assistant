import type { FinanceAlert, Severity } from "@/lib/types";
import { data } from "@/lib/data";

const { advertiserName, contracts, financeTransactions } = data;
import { bySeverity, daysBetween } from "./utils";

/**
 * 재무 및 계약 알림을 산출한다.
 * - 미수금/연체: 긴급
 * - 임박한 입금예정/지출/세금계산서: 확인필요~주의
 * - 만료임박/갱신예정 계약: 주의~확인필요
 */
export function buildFinanceAlerts(today: string): FinanceAlert[] {
  const alerts: FinanceAlert[] = [];

  // 재무 거래
  for (const f of financeTransactions) {
    const dday = daysBetween(f.dueDate, today);

    if (f.status === "연체") {
      alerts.push({
        id: f.id,
        severity: "긴급",
        category: "미수금",
        title: `${f.memo} (${Math.abs(dday)}일 연체)`,
        amount: f.amount,
        dueDate: f.dueDate,
        advertiserName: advertiserName(f.advertiserId),
      });
      continue;
    }

    if (f.status === "예정" && dday >= 0 && dday <= 3) {
      const severity: Severity =
        f.type === "지출" || f.type === "세금계산서" ? "주의" : "확인필요";
      const category =
        f.type === "입금예정"
          ? "입금예정"
          : f.type === "지출"
            ? "지출"
            : f.type === "세금계산서"
              ? "세금계산서"
              : "입금예정";
      alerts.push({
        id: f.id,
        severity,
        category,
        title:
          dday === 0
            ? `오늘 ${f.memo}`
            : `${dday}일 후 ${f.memo}`,
        amount: f.amount,
        dueDate: f.dueDate,
        advertiserName: advertiserName(f.advertiserId),
      });
    }
  }

  // 계약 알림
  for (const c of contracts) {
    if (c.status === "종료") continue;
    const dday = daysBetween(c.endDate, today);
    if (c.status === "만료임박" || (dday >= 0 && dday <= 30)) {
      alerts.push({
        id: `contract-${c.id}`,
        severity: c.autoRenew ? "확인필요" : "주의",
        category: "계약",
        title: `${c.title} 계약 만료 D-${dday}${c.autoRenew ? " (자동갱신)" : " (갱신 협의 필요)"}`,
        amount: c.monthlyValue,
        dueDate: c.endDate,
        advertiserName: advertiserName(c.advertiserId),
      });
    }
  }

  return alerts.sort(bySeverity);
}
