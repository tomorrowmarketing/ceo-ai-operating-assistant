import type { Severity } from "@/lib/types";

const styles: Record<Severity, string> = {
  긴급: "bg-red-50 text-red-700 ring-red-200",
  주의: "bg-amber-50 text-amber-700 ring-amber-200",
  정상: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  확인필요: "bg-blue-50 text-blue-700 ring-blue-200",
  승인필요: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

/** 일반 텍스트 라벨(칩) */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {children}
    </span>
  );
}
