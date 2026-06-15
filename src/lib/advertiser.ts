import type { AdvertiserDetail } from "@/lib/types";
import type { DataSource } from "@/lib/data";
import { buildRiskSignals } from "@/lib/briefing/riskSignals";
import { daysBetween } from "@/lib/briefing/utils";

/** 모든 광고주 id (정적 경로 생성용) */
export function allAdvertiserIds(ds: DataSource): string[] {
  return ds.advertisers.map((a) => a.id);
}

/** 미완료 → 마감 임박 순으로 업무 정렬 */
function sortTasks(today: string) {
  const statusWeight: Record<string, number> = {
    지연: 0,
    진행중: 1,
    대기: 2,
    완료: 3,
  };
  return (a: { status: string; dueDate: string }, b: { status: string; dueDate: string }) => {
    const w = statusWeight[a.status] - statusWeight[b.status];
    if (w !== 0) return w;
    return daysBetween(a.dueDate, today) - daysBetween(b.dueDate, today);
  };
}

/**
 * 단일 광고주의 360° 상세 뷰를 조립한다.
 * 존재하지 않는 id 면 undefined.
 */
export function buildAdvertiserDetail(
  ds: DataSource,
  id: string,
  today: string = ds.today
): AdvertiserDetail | undefined {
  const {
    advertisers,
    calendarEvents,
    communications,
    contracts,
    financeTransactions,
    staffById,
    tasks,
  } = ds;
  const advertiser = advertisers.find((a) => a.id === id);
  if (!advertiser) return undefined;

  const detailTasks = tasks
    .filter((t) => t.advertiserId === id)
    .sort(sortTasks(today));

  const detailComms = communications
    .filter((c) => c.advertiserId === id)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  const upcomingEvents = calendarEvents
    .filter((e) => e.advertiserId === id && daysBetween(e.date, today) >= 0)
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));

  const finance = financeTransactions
    .filter((f) => f.advertiserId === id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const risk = buildRiskSignals(ds, today).find((r) => r.advertiserId === id);

  return {
    advertiser,
    manager: staffById(advertiser.managerId),
    performance: {
      leads30d: advertiser.leads30d,
      leadDeltaPct: advertiser.leadDeltaPct,
      consultRate: advertiser.consultRate,
      monthlyBudget: advertiser.monthlyBudget,
    },
    contracts: contracts.filter((c) => c.advertiserId === id),
    tasks: detailTasks,
    communications: detailComms,
    upcomingEvents,
    finance,
    risk,
  };
}
