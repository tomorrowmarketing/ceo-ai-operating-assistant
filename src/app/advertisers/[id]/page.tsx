import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDataSource } from "@/lib/data";
import { allAdvertiserIds, buildAdvertiserDetail } from "@/lib/advertiser";
import { formatKRW } from "@/lib/briefing/utils";
import { Section, EmptyState } from "@/components/ui/Section";
import {
  AdvertiserStatusBadge,
  SeverityBadge,
  Chip,
} from "@/components/ui/SeverityBadge";

/** 모든 광고주 상세 페이지를 정적 생성 */
export async function generateStaticParams() {
  const ds = await loadDataSource();
  return allAdvertiserIds(ds).map((id) => ({ id }));
}

export default async function AdvertiserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ds = await loadDataSource();
  const detail = buildAdvertiserDetail(ds, id);
  if (!detail) notFound();

  const { advertiser: a, manager, performance: p, risk } = detail;
  const deltaColor = p.leadDeltaPct < 0 ? "text-red-600" : "text-emerald-600";

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/advertisers"
        className="text-xs font-semibold text-gray-500 hover:text-gray-700"
      >
        ← 광고주 목록
      </Link>

      {/* 헤더 */}
      <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{a.name}</h1>
          <AdvertiserStatusBadge status={a.status} />
          <Chip>{a.industry}</Chip>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="월 광고 예산" value={formatKRW(a.monthlyBudget)} />
          <Stat
            label="최근 30일 리드"
            value={`${p.leads30d}건`}
            extra={
              p.leadDeltaPct !== 0 ? (
                <span className={deltaColor}>
                  {p.leadDeltaPct > 0 ? "+" : ""}
                  {p.leadDeltaPct}%
                </span>
              ) : undefined
            }
          />
          <Stat label="상담 전환율" value={`${p.consultRate}%`} />
          <Stat
            label="담당자"
            value={manager ? `${manager.name}` : "-"}
            extra={manager ? <span className="text-gray-400">{manager.role}</span> : undefined}
          />
        </div>
        <p className="mt-3 text-xs text-gray-400">
          거래 시작 {a.since} · 마지막 접점 {a.lastContact}
        </p>
      </div>

      {/* 리스크 신호 */}
      {risk && (
        <div className="mt-4">
          <Section title="리스크 신호" accent="amber" count={risk.signals.length}>
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={risk.severity} />
              {risk.signals.map((s, i) => (
                <span
                  key={i}
                  className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-600">
              <span className="font-medium text-gray-700">추천 ·</span>{" "}
              {risk.recommendation}
            </p>
          </Section>
        </div>
      )}

      {/* 계약 + 재무 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="계약" accent="emerald" count={detail.contracts.length}>
          {detail.contracts.length === 0 ? (
            <EmptyState message="등록된 계약이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {detail.contracts.map((c) => (
                <li key={c.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {c.title}
                    </span>
                    <Chip>{c.status}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {c.startDate} ~ {c.endDate} · 월 {formatKRW(c.monthlyValue)} ·{" "}
                    {c.autoRenew ? "자동갱신" : "수동갱신"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="재무" accent="emerald" count={detail.finance.length}>
          {detail.finance.length === 0 ? (
            <EmptyState message="재무 내역이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {detail.finance.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Chip>{f.type}</Chip>
                      <span
                        className={`text-xs font-semibold ${f.status === "연체" ? "text-red-600" : "text-gray-500"}`}
                      >
                        {f.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {f.dueDate} · {f.memo}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-gray-900">
                    {formatKRW(f.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* 업무 + 커뮤니케이션 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="업무" accent="amber" count={detail.tasks.length}>
          {detail.tasks.length === 0 ? (
            <EmptyState message="등록된 업무가 없습니다." />
          ) : (
            <ul className="space-y-1.5">
              {detail.tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"
                >
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      t.status === "지연"
                        ? "bg-red-50 text-red-600"
                        : t.status === "완료"
                          ? "bg-gray-100 text-gray-400"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">{t.title}</span>
                  <span className="text-xs tabular-nums text-gray-400">
                    {t.dueDate}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="커뮤니케이션"
          accent="violet"
          count={detail.communications.length}
        >
          {detail.communications.length === 0 ? (
            <EmptyState message="커뮤니케이션 내역이 없습니다." />
          ) : (
            <ul className="space-y-2">
              {detail.communications.map((c) => (
                <li key={c.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-2">
                    <Chip>{c.channel}</Chip>
                    <span
                      className={`text-xs font-semibold ${c.sentiment === "부정" ? "text-red-600" : c.sentiment === "긍정" ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {c.sentiment}
                    </span>
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
      </div>

      {/* 예정 일정 */}
      <div className="mt-4">
        <Section
          title="예정 일정"
          accent="blue"
          count={detail.upcomingEvents.length}
        >
          {detail.upcomingEvents.length === 0 ? (
            <EmptyState message="예정된 일정이 없습니다." />
          ) : (
            <ul className="space-y-1.5">
              {detail.upcomingEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col gap-1 rounded-lg px-2 py-2 hover:bg-gray-50 sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500 sm:w-32">
                    {e.date} {e.start}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">{e.title}</span>
                  <div className="flex">
                    <Chip>{e.type}</Chip>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-inset ring-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-bold text-gray-900">
        {value} {extra && <span className="text-sm font-medium">{extra}</span>}
      </div>
    </div>
  );
}
