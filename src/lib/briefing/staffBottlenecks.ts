import type { StaffBottleneck } from "@/lib/types";
import { data } from "@/lib/data";

const { staff, tasks } = data;
import { bySeverity, daysBetween, isOverdue } from "./utils";

/**
 * 직원별 지연 업무 요약(병목)을 산출한다.
 * 지연 업무가 많거나, 가장 오래된 지연이 클수록 severity가 높아진다.
 */
export function buildStaffBottlenecks(today: string): StaffBottleneck[] {
  const result: StaffBottleneck[] = [];

  for (const member of staff) {
    const own = tasks.filter(
      (t) => t.assigneeId === member.id && t.status !== "완료"
    );
    const overdue = own.filter(
      (t) => t.status === "지연" || isOverdue(t.dueDate, today)
    );
    const inProgress = own.filter((t) => t.status === "진행중");

    if (overdue.length === 0 && inProgress.length === 0) continue;

    // 가장 오래 지연된 업무
    const topOverdue = [...overdue].sort(
      (a, b) => daysBetween(a.dueDate, today) - daysBetween(b.dueDate, today)
    )[0];

    let severity: StaffBottleneck["severity"] = "정상";
    if (overdue.length >= 3) severity = "긴급";
    else if (overdue.length >= 1) severity = "주의";

    result.push({
      staffId: member.id,
      staffName: member.name,
      team: member.team,
      overdueCount: overdue.length,
      inProgressCount: inProgress.length,
      topOverdueTask: topOverdue?.title,
      severity,
    });
  }

  return result.sort(bySeverity);
}
