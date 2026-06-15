import Link from "next/link";
import { loadDataSource } from "@/lib/data";
import { buildDailyBriefing } from "@/lib/briefing";
import { DailyBriefingHeader } from "@/components/DailyBriefing";
import { CeoActionItems } from "@/components/CeoActionItems";
import { TodaySchedule } from "@/components/TodaySchedule";
import { AdvertiserRiskSignals } from "@/components/AdvertiserRiskSignals";
import { KeyCommunications } from "@/components/KeyCommunications";
import { StaffBottlenecks } from "@/components/StaffBottlenecks";
import { FinanceContractAlerts } from "@/components/FinanceContractAlerts";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import { AiRecommendedActions } from "@/components/AiRecommendedActions";

/**
 * 대표 운영 브리핑 대시보드.
 *
 * 배치 원칙 (CLAUDE.md):
 *   대표가 먼저 판단해야 할 항목을 상단에 배치하고,
 *   이후 정보를 광고주 중심으로 정리한다. 일반 TODO 앱처럼 보이지 않게 한다.
 */
export default async function DashboardPage() {
  const ds = await loadDataSource();
  const briefing = buildDailyBriefing(ds);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* 상단 내비게이션 */}
      <nav className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight text-gray-400">
          대표님 운영 비서
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/report"
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
          >
            오늘의 보고서
          </Link>
          <Link
            href="/advertisers"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            광고주 목록 →
          </Link>
        </div>
      </nav>

      {/* 1. 일일 브리핑 헤더 + 핵심 지표 */}
      <DailyBriefingHeader briefing={briefing} />

      {/* 2. 대표가 먼저 판단할 항목 (최우선) */}
      <div className="mt-5">
        <CeoActionItems items={briefing.actionItems} />
      </div>

      {/* 3. 승인 필요 + 오늘 일정 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ApprovalQueue items={briefing.approvals} />
        <TodaySchedule schedule={briefing.schedule} />
      </div>

      {/* 4. 광고주 중심 위험/커뮤니케이션 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdvertiserRiskSignals signals={briefing.riskSignals} />
        <KeyCommunications items={briefing.commHighlights} />
      </div>

      {/* 5. 운영 병목 + 재무/계약 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <StaffBottlenecks items={briefing.staffBottlenecks} />
        <FinanceContractAlerts items={briefing.financeAlerts} />
      </div>

      {/* 6. AI 추천 액션 */}
      <div className="mt-4">
        <AiRecommendedActions items={briefing.recommendations} />
      </div>

      <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
        Mock 데이터 기반 MVP · AI는 읽고·요약하고·추천하며, 대표님 승인 없이 외부
        행동을 실행하지 않습니다.
      </footer>
    </main>
  );
}
