import type { DailyBriefing as Briefing } from "@/lib/types";

function Metric({
  label,
  value,
  tone = "default",
  suffix,
}: {
  label: string;
  value: number;
  tone?: "default" | "danger" | "warn";
  suffix?: string;
}) {
  const valueColor =
    tone === "danger"
      ? "text-red-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-gray-900";
  return (
    <div className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-inset ring-gray-200">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${valueColor}`}>
        {value}
        {suffix && <span className="ml-0.5 text-sm font-medium">{suffix}</span>}
      </div>
    </div>
  );
}

/** 일일 브리핑 헤더: 인사 + 운영 헤드라인 + 핵심 지표 */
export function DailyBriefingHeader({ briefing }: { briefing: Briefing }) {
  const m = briefing.metrics;
  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{briefing.greeting}</p>
      <h1 className="mt-1 text-lg font-bold leading-snug text-gray-900 sm:text-xl">
        {briefing.headline}
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="운영 광고주" value={m.activeAdvertisers} suffix="곳" />
        <Metric
          label="이탈 위험"
          value={m.atRiskAdvertisers}
          suffix="곳"
          tone={m.atRiskAdvertisers > 0 ? "danger" : "default"}
        />
        <Metric label="오늘 광고주 일정" value={m.todayMeetings} suffix="건" />
        <Metric
          label="지연 업무"
          value={m.overdueTasks}
          suffix="건"
          tone={m.overdueTasks > 0 ? "warn" : "default"}
        />
        <Metric label="회신 대기" value={m.needsReplyComms} suffix="건" />
        <Metric
          label="승인 대기"
          value={m.pendingApprovals}
          suffix="건"
          tone={m.pendingApprovals > 0 ? "warn" : "default"}
        />
      </div>
    </div>
  );
}
