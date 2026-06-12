import type { ScheduleSummary } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { Chip } from "./ui/SeverityBadge";

const typeChip: Record<string, string> = {
  광고주미팅: "bg-blue-50 text-blue-700",
  상담콜: "bg-violet-50 text-violet-700",
  내부회의: "bg-gray-100 text-gray-600",
  개인: "bg-gray-100 text-gray-400",
};

/** 오늘 일정 */
export function TodaySchedule({ schedule }: { schedule: ScheduleSummary }) {
  return (
    <Section
      title="오늘 일정"
      accent="blue"
      count={schedule.totalCount}
      description={`광고주 미팅·상담 ${schedule.advertiserMeetingCount}건 포함`}
    >
      {schedule.events.length === 0 ? (
        <EmptyState message="오늘 등록된 일정이 없습니다." />
      ) : (
        <ul className="space-y-1.5">
          {schedule.events.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-1 rounded-lg px-2 py-2 hover:bg-gray-50 sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500 sm:w-24">
                {e.time}
              </span>
              <span className="flex-1 text-sm text-gray-800">{e.title}</span>
              <div className="flex flex-wrap items-center gap-2">
                {e.advertiserName && <Chip>{e.advertiserName}</Chip>}
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${typeChip[e.type] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {e.type}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
