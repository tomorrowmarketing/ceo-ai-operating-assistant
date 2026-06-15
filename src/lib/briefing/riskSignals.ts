import type { RiskSignal } from "@/lib/types";
import type { DataSource } from "@/lib/data";
import { bySeverity, daysBetween } from "./utils";

/**
 * 광고주 리스크 신호를 산출한다.
 * 광고주 = 계약 + 업무 + 커뮤니케이션 + 일정 + 재무 + 광고 성과 원칙에 따라
 * 성과 하락, 부정 커뮤니케이션, 미수금, 계약 만료, 접점 공백을 종합한다.
 */
export function buildRiskSignals(
  ds: DataSource,
  today: string
): RiskSignal[] {
  const { advertisers, communications, contracts, financeTransactions } = ds;
  const result: RiskSignal[] = [];

  for (const adv of advertisers) {
    const signals: string[] = [];

    // 1) 광고 성과 하락
    if (adv.leadDeltaPct <= -30) {
      signals.push(`리드 ${Math.abs(adv.leadDeltaPct)}% 급감`);
    } else if (adv.leadDeltaPct <= -15) {
      signals.push(`리드 ${Math.abs(adv.leadDeltaPct)}% 감소`);
    }
    if (adv.status !== "온보딩" && adv.consultRate > 0 && adv.consultRate < 15) {
      signals.push(`상담 전환율 ${adv.consultRate}%로 저조`);
    }

    // 2) 부정적 커뮤니케이션
    const negative = communications.filter(
      (c) => c.advertiserId === adv.id && c.sentiment === "부정"
    );
    if (negative.length > 0) {
      signals.push(`최근 불만성 커뮤니케이션 ${negative.length}건`);
    }

    // 3) 미수금/연체
    const overdueMoney = financeTransactions.filter(
      (f) => f.advertiserId === adv.id && f.status === "연체"
    );
    if (overdueMoney.length > 0) {
      signals.push("미수금 연체 발생");
    }

    // 4) 계약 만료 임박
    const expiring = contracts.filter(
      (c) =>
        c.advertiserId === adv.id &&
        (c.status === "만료임박" ||
          (c.status !== "종료" && daysBetween(c.endDate, today) <= 30 && daysBetween(c.endDate, today) >= 0))
    );
    if (expiring.length > 0 && expiring.some((c) => !c.autoRenew)) {
      signals.push("계약 만료 임박 (자동갱신 아님)");
    }

    // 5) 접점 공백
    const sinceContact = daysBetween(today, adv.lastContact);
    if (adv.status !== "온보딩" && sinceContact >= 10) {
      signals.push(`마지막 접점 ${sinceContact}일 경과`);
    }

    if (signals.length === 0) continue;

    // severity 결정
    let severity: RiskSignal["severity"] = "주의";
    if (adv.status === "위험" || negative.length > 0 || overdueMoney.length > 0) {
      severity = "긴급";
    } else if (signals.length >= 3) {
      severity = "긴급";
    }

    result.push({
      advertiserId: adv.id,
      advertiserName: adv.name,
      industry: adv.industry,
      severity,
      signals,
      recommendation: buildRecommendation(adv.id, signals),
    });
  }

  return result.sort(bySeverity);
}

function buildRecommendation(advertiserId: string, signals: string[]): string {
  if (signals.some((s) => s.includes("불만"))) {
    return "대표가 직접 연락해 신뢰를 회복하고, 개선안과 일정 제시.";
  }
  if (signals.some((s) => s.includes("미수금"))) {
    return "담당 AE를 통해 입금 일정 확인 후 결제 정상화 협의.";
  }
  if (signals.some((s) => s.includes("급감") || s.includes("감소"))) {
    return "소재/타겟/랜딩 점검 후 회복 플랜을 광고주에게 공유.";
  }
  if (signals.some((s) => s.includes("계약 만료"))) {
    return "성과 리포트와 함께 갱신 미팅을 선제 제안.";
  }
  return "담당자와 상태 점검 후 선제적으로 접점 확보.";
}
