import type { CeoActionItem } from "@/lib/types";
import type { DataSource } from "@/lib/data";
import { buildRiskSignals } from "./riskSignals";
import { buildCommHighlights } from "./communications";
import { buildFinanceAlerts } from "./financeAlerts";
import { bySeverity } from "./utils";

/**
 * 대표가 직접 처리해야 할 TOP 액션 아이템을 산출한다.
 *
 * 위임 가능한 일반 업무는 제외하고, 대표의 판단/관계/의사결정이 필요한 항목만
 * 끌어올린다. 리스크 신호 · 부정 커뮤니케이션 · 재무 긴급 건을 종합한다.
 */
export function buildCeoActionItems(
  ds: DataSource,
  today: string
): CeoActionItem[] {
  const items: CeoActionItem[] = [];

  // 1) 긴급 리스크 광고주 → 대표 직접 개입
  for (const r of buildRiskSignals(ds, today)) {
    if (r.severity !== "긴급") continue;
    items.push({
      id: `risk-${r.advertiserId}`,
      severity: "긴급",
      title: `${r.advertiserName} 이탈 위험 - 대표 직접 대응 필요`,
      context: r.signals.join(" · "),
      advertiserName: r.advertiserName,
      reason: r.recommendation,
    });
  }

  // 2) 부정적 커뮤니케이션 (대표 명의 응대가 필요)
  for (const c of buildCommHighlights(ds)) {
    if (c.severity !== "긴급") continue;
    // 이미 리스크로 잡힌 광고주는 중복 방지
    if (items.some((i) => i.advertiserName && i.advertiserName === c.advertiserName)) {
      continue;
    }
    items.push({
      id: `comm-${c.id}`,
      severity: "긴급",
      title: `${c.advertiserName ?? "내부"} 불만 응대 - 회신 검토 필요`,
      context: c.summary,
      advertiserName: c.advertiserName,
      reason: "감정이 상한 핵심 광고주는 대표의 직접 응대가 신뢰 회복에 효과적.",
    });
  }

  // 3) 재무 긴급 (연체/미수금) - 대표 인지 필요
  for (const f of buildFinanceAlerts(ds, today)) {
    if (f.severity !== "긴급") continue;
    items.push({
      id: `fin-${f.id}`,
      severity: "주의",
      title: `${f.advertiserName ?? ""} ${f.title}`.trim(),
      context: "미수금은 관계 리스크로 번질 수 있어 대표 인지가 필요합니다.",
      advertiserName: f.advertiserName,
      reason: "담당 AE에게 입금 일정 확인을 지시할지 판단 필요.",
    });
  }

  return items.sort(bySeverity).slice(0, 5);
}
