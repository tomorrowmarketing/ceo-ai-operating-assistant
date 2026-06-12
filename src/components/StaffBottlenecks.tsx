import type { StaffBottleneck } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { SeverityBadge, Chip } from "./ui/SeverityBadge";

/** 직원 업무 병목 */
export function StaffBottlenecks({ items }: { items: StaffBottleneck[] }) {
  return (
    <Section
      title="직원 업무 병목"
      accent="amber"
      count={items.length}
      description="지연·진행 업무가 쌓인 담당자 (위임/재조정 판단용)"
    >
      {items.length === 0 ? (
        <EmptyState message="병목으로 분류된 담당자가 없습니다." />
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.staffId}
              className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
            >
              <SeverityBadge severity={s.severity} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {s.staffName}
                  </span>
                  <Chip>{s.team}</Chip>
                </div>
                {s.topOverdueTask && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    최우선 지연: {s.topOverdueTask}
                  </p>
                )}
              </div>
              <div className="text-right text-xs">
                <div className="font-semibold text-red-600">
                  지연 {s.overdueCount}
                </div>
                <div className="text-gray-500">진행 {s.inProgressCount}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
