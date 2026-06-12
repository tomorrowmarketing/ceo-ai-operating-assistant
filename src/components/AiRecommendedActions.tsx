import type { RecommendedAction } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { Chip } from "./ui/SeverityBadge";

/** AI 추천 액션 (제안 only — 자동 실행하지 않음) */
export function AiRecommendedActions({ items }: { items: RecommendedAction[] }) {
  return (
    <Section
      title="AI 추천 액션"
      accent="blue"
      count={items.length}
      description="AI의 제안이며 자동 실행되지 않습니다. 채택 여부는 대표님이 결정합니다."
    >
      {items.length === 0 ? (
        <EmptyState message="추천할 액션이 없습니다." />
      ) : (
        <ul className="space-y-2.5">
          {items.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {r.title}
                </span>
                {r.advertiserName && <Chip>{r.advertiserName}</Chip>}
              </div>
              <p className="mt-1 text-xs text-gray-600">
                <span className="font-medium text-gray-700">근거 ·</span>{" "}
                {r.rationale}
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                <span className="font-medium">기대 효과 ·</span>{" "}
                {r.expectedImpact}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
