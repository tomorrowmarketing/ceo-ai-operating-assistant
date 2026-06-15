import Link from "next/link";
import { loadDataSource } from "@/lib/data";
import { formatKRW } from "@/lib/briefing/utils";
import { AdvertiserStatusBadge, Chip } from "@/components/ui/SeverityBadge";

export const metadata = {
  title: "광고주 목록 | 대표님 운영 비서",
};

/** 광고주 목록 (각 항목 → 360° 상세 페이지) */
export default async function AdvertisersPage() {
  const { advertisers, staffById } = await loadDataSource();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">광고주</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            총 {advertisers.length}곳 · 항목을 누르면 360° 상세 뷰로 이동합니다.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          ← 브리핑으로
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {advertisers.map((a) => (
          <li key={a.id}>
            <Link
              href={`/advertisers/${a.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{a.name}</span>
                <AdvertiserStatusBadge status={a.status} />
                <Chip>{a.industry}</Chip>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-gray-400">월 예산</div>
                  <div className="font-semibold text-gray-800">
                    {formatKRW(a.monthlyBudget)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">30일 리드</div>
                  <div className="font-semibold text-gray-800">
                    {a.leads30d}건
                    {a.leadDeltaPct !== 0 && (
                      <span
                        className={`ml-1 ${a.leadDeltaPct < 0 ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {a.leadDeltaPct > 0 ? "+" : ""}
                        {a.leadDeltaPct}%
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">담당</div>
                  <div className="font-semibold text-gray-800">
                    {staffById(a.managerId)?.name ?? "-"}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
