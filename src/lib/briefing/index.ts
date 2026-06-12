import type { DailyBriefing } from "@/lib/types";
import { data } from "@/lib/data";
import { isOverdue } from "./utils";

const { advertisers, communications, tasks } = data;
import { buildScheduleSummary } from "./schedule";
import { buildCeoActionItems } from "./actionItems";
import { buildRiskSignals } from "./riskSignals";
import { buildStaffBottlenecks } from "./staffBottlenecks";
import { buildCommHighlights } from "./communications";
import { buildFinanceAlerts } from "./financeAlerts";
import { buildApprovals } from "./approvals";
import { buildRecommendations } from "./recommendations";

export * from "./utils";
export { buildScheduleSummary } from "./schedule";
export { buildCeoActionItems } from "./actionItems";
export { buildRiskSignals } from "./riskSignals";
export { buildStaffBottlenecks } from "./staffBottlenecks";
export { buildCommHighlights } from "./communications";
export { buildFinanceAlerts } from "./financeAlerts";
export { buildApprovals } from "./approvals";
export { buildRecommendations } from "./recommendations";

/** YYYY-MM-DD → "6월 12일 (금)" 형식 */
function formatKoreanDate(d: string): string {
  const date = new Date(`${d}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

/**
 * 일일 브리핑 객체를 조립한다.
 * 대시보드는 이 단일 객체를 받아 화면을 구성한다.
 */
export function buildDailyBriefing(today: string = data.today): DailyBriefing {
  const schedule = buildScheduleSummary(today);
  const actionItems = buildCeoActionItems(today);
  const riskSignals = buildRiskSignals(today);
  const staffBottlenecks = buildStaffBottlenecks(today);
  const commHighlights = buildCommHighlights();
  const financeAlerts = buildFinanceAlerts(today);
  const approvals = buildApprovals();
  const recommendations = buildRecommendations();

  const activeAdvertisers = advertisers.filter(
    (a) => a.status !== "온보딩"
  ).length;
  const atRiskAdvertisers = riskSignals.filter(
    (r) => r.severity === "긴급"
  ).length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "완료" && (t.status === "지연" || isOverdue(t.dueDate, today))
  ).length;
  const needsReplyComms = communications.filter((c) => c.requiresReply).length;

  const metrics = {
    activeAdvertisers,
    atRiskAdvertisers,
    todayMeetings: schedule.advertiserMeetingCount,
    overdueTasks,
    needsReplyComms,
    pendingApprovals: approvals.length,
  };

  const headline =
    atRiskAdvertisers > 0
      ? `오늘 가장 중요한 것: 이탈 위험 광고주 ${atRiskAdvertisers}곳에 대한 대표님의 직접 대응입니다.`
      : "오늘은 큰 위험 신호 없이 운영이 안정적입니다. 기회성 항목에 집중하세요.";

  return {
    date: today,
    greeting: `${formatKoreanDate(today)} · 대표님 오늘의 운영 브리핑`,
    headline,
    metrics,
    schedule,
    actionItems,
    riskSignals,
    staffBottlenecks,
    commHighlights,
    financeAlerts,
    approvals,
    recommendations,
  };
}
