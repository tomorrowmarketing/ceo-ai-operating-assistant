import type { ApprovalItem } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { SeverityBadge, Chip } from "./ui/SeverityBadge";

/**
 * 승인 필요 항목.
 * 버튼은 의도적으로 비활성화 상태다 — MVP는 외부 행동을 실행하지 않으며,
 * AI는 대표의 명시적 승인 없이 어떤 외부 행동도 실행하지 않는다.
 */
export function ApprovalQueue({ items }: { items: ApprovalItem[] }) {
  return (
    <Section
      title="승인 필요 항목"
      accent="violet"
      count={items.length}
      description="AI가 초안을 준비했습니다. 대표님 승인 전까지 실행되지 않습니다."
    >
      {items.length === 0 ? (
        <EmptyState message="승인 대기 중인 항목이 없습니다." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-violet-100 bg-violet-50/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity="승인필요" />
                <Chip>{a.actionType}</Chip>
                {a.advertiserName && (
                  <span className="text-sm font-semibold text-gray-900">
                    {a.advertiserName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-gray-800">{a.title}</p>
              <p className="mt-0.5 text-xs text-gray-600">{a.draftSummary}</p>
              <p className="mt-1 text-[11px] text-gray-400">{a.ifApproved}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled
                  title="MVP 단계에서는 실행되지 않습니다"
                  className="cursor-not-allowed rounded-md bg-violet-600/40 px-3 py-1 text-xs font-semibold text-white"
                >
                  승인 (미연동)
                </button>
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-400"
                >
                  보류
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
