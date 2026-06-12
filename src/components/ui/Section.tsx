import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  /** 좌측 강조 색상 (운영 영역 구분용) */
  accent?: "red" | "amber" | "blue" | "violet" | "emerald" | "gray";
  count?: number;
  description?: string;
  children: ReactNode;
}

const accentBar: Record<NonNullable<SectionProps["accent"]>, string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  gray: "bg-gray-400",
};

/** 대시보드 카드 섹션 공통 래퍼 */
export function Section({
  title,
  accent = "gray",
  count,
  description,
  children,
}: SectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-gray-100 px-4 py-3">
        <span className={`mt-1 h-4 w-1 rounded-full ${accentBar[accent]}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            {typeof count === "number" && (
              <span className="rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-600">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
          )}
        </div>
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-4 text-center text-sm text-gray-400">{message}</p>;
}
