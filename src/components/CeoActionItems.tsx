import type { CeoActionItem } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { SeverityBadge } from "./ui/SeverityBadge";

/** 대표가 직접 처리해야 할 TOP 액션 아이템 (대시보드 최상단 우선 영역) */
export function CeoActionItems({ items }: { items: CeoActionItem[] }) {
  return (
    <Section
      title="대표님이 먼저 판단할 항목"
      accent="red"
      count={items.length}
      description="위임 전, 대표님의 결정·관계·승인이 필요한 일만 모았습니다."
    >
      {items.length === 0 ? (
        <EmptyState message="오늘 대표님이 직접 처리할 긴급 항목은 없습니다." />
      ) : (
        <ol className="space-y-2.5">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="rounded-lg border border-gray-100 bg-gray-50/60 p-3"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={item.severity} />
                    <span className="text-sm font-semibold text-gray-900">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{item.context}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    <span className="font-medium text-gray-600">판단 근거 ·</span>{" "}
                    {item.reason}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
