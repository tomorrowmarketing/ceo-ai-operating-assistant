import type { CommHighlight } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { SeverityBadge, Chip } from "./ui/SeverityBadge";

/** 중요 커뮤니케이션 */
export function KeyCommunications({ items }: { items: CommHighlight[] }) {
  return (
    <Section
      title="중요 커뮤니케이션"
      accent="violet"
      count={items.length}
      description="회신이 필요하거나 감정·중요도가 높은 메시지 요약"
    >
      {items.length === 0 ? (
        <EmptyState message="확인이 필요한 커뮤니케이션이 없습니다." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((c) => (
            <li key={c.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={c.severity} />
                <Chip>{c.channel}</Chip>
                {c.advertiserName && (
                  <span className="text-sm font-semibold text-gray-900">
                    {c.advertiserName}
                  </span>
                )}
                {c.requiresReply && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                    회신 필요
                  </span>
                )}
                <span className="ml-auto text-xs tabular-nums text-gray-400">
                  {c.receivedAt}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{c.from}</p>
              <p className="mt-0.5 text-sm text-gray-700">{c.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
