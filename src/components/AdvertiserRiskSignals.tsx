import type { RiskSignal } from "@/lib/types";
import { Section, EmptyState } from "./ui/Section";
import { SeverityBadge, Chip } from "./ui/SeverityBadge";

/** 광고주 리스크 신호 (광고주 중심 정리) */
export function AdvertiserRiskSignals({ signals }: { signals: RiskSignal[] }) {
  return (
    <Section
      title="광고주 리스크 신호"
      accent="amber"
      count={signals.length}
      description="성과·커뮤니케이션·재무·계약을 종합한 광고주별 위험 신호"
    >
      {signals.length === 0 ? (
        <EmptyState message="감지된 리스크 신호가 없습니다." />
      ) : (
        <ul className="space-y-2.5">
          {signals.map((r) => (
            <li
              key={r.advertiserId}
              className="rounded-lg border border-gray-100 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={r.severity} />
                <span className="text-sm font-semibold text-gray-900">
                  {r.advertiserName}
                </span>
                <Chip>{r.industry}</Chip>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.signals.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-600">
                <span className="font-medium text-gray-700">추천 ·</span>{" "}
                {r.recommendation}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
