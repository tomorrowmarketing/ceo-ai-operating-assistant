import type { FinanceAlert } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { SeverityBadge, Chip } from "./ui/SeverityBadge";
import { formatKRW } from "@/lib/briefing/utils";

/** 재무 및 계약 알림 */
export function FinanceContractAlerts({ items }: { items: FinanceAlert[] }) {
  return (
    <Section
      title="재무 · 계약 알림"
      accent="emerald"
      count={items.length}
      description="미수금·입금예정·지출·세금계산서·계약 만료 (금액은 마스킹 정책 준수)"
    >
      {items.length === 0 ? (
        <EmptyState message="임박한 재무·계약 알림이 없습니다." />
      ) : (
        <ul className="space-y-2">
          {items.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
            >
              <SeverityBadge severity={f.severity} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Chip>{f.category}</Chip>
                  {f.advertiserName && (
                    <span className="text-sm font-semibold text-gray-900">
                      {f.advertiserName}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-700">{f.title}</p>
              </div>
              {typeof f.amount === "number" && (
                <span className="shrink-0 text-sm font-bold tabular-nums text-gray-900">
                  {formatKRW(f.amount)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
