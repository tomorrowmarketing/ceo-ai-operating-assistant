import Link from "next/link";
import { loadDataSource } from "@/lib/data";
import { buildDailyReport, reportToText } from "@/lib/report";
import { buildAiSummary } from "@/lib/ai/summary";
import { Section, EmptyState } from "@/components/ui/Section";
import { Chip } from "@/components/ui/SeverityBadge";
import { CopyButton } from "@/components/CopyButton";

export const metadata = {
  title: "오늘의 일일 보고서 | 대표님 운영 비서",
};

// AI 요약 생성 비용을 고려해 30분 캐시 (ISR)
export const revalidate = 1800;

export default async function ReportPage() {
  const ds = await loadDataSource();
  const report = buildDailyReport(ds);
  const ai = await buildAiSummary(report, ds); // 키 없으면 null
  const text = reportToText(report, ai);
  const s = report.summary;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            오늘의 일일 보고서
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{report.dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={text} />
          <Link
            href="/"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            ← 브리핑
          </Link>
        </div>
      </div>

      {/* AI 핵심 요약 */}
      {ai?.overall && (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <div className="text-xs font-bold text-violet-700">🤖 오늘의 핵심 (AI 요약)</div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {ai.overall}
          </p>
        </div>
      )}

      {/* 요약 */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="운영 광고주" value={`${s.advertisers}곳`} />
        <Stat label="진행중 업무" value={`${s.inProgress}건`} />
        <Stat label="대기 업무" value={`${s.waiting}건`} />
        <Stat
          label="날짜 지난 미완료"
          value={`${s.stale}건`}
          tone={s.stale > 0 ? "warn" : "default"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* 담당자별 상세 */}
        <Section
          title="담당자별 업무 (상세)"
          accent="amber"
          count={report.byStaff.length}
        >
          {report.byStaff.length === 0 ? (
            <EmptyState message="표시할 업무가 없습니다." />
          ) : (
            <ul className="space-y-3">
              {report.byStaff.map((st) => (
                <li
                  key={st.name}
                  className="rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      {st.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      진행 {st.inProgress} · 대기 {st.waiting}
                      {st.stale > 0 && (
                        <span className="ml-1 font-semibold text-amber-600">
                          · 지연 {st.stale}
                        </span>
                      )}
                    </span>
                  </div>
                  {ai?.perStaff?.[st.name] && (
                    <p className="mt-1 rounded bg-violet-50 px-2 py-1 text-xs text-violet-800">
                      🤖 {ai.perStaff[st.name]}
                    </p>
                  )}
                  <ul className="mt-2 space-y-1">
                    {st.tasks.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span
                          className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-semibold ${
                            t.stale
                              ? "bg-red-50 text-red-600"
                              : t.status === "진행중"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {t.stale ? "지연" : t.status}
                        </span>
                        <span className="flex-1 text-gray-700">
                          {t.title}
                          {(t.advertiserName || t.date) && (
                            <span className="text-gray-400">
                              {" — "}
                              {[t.advertiserName, t.date]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 광고주별 */}
        <Section
          title="광고주별 진행"
          accent="blue"
          count={report.byAdvertiser.length}
        >
          {report.byAdvertiser.length === 0 ? (
            <EmptyState message="표시할 광고주가 없습니다." />
          ) : (
            <ul className="space-y-1.5">
              {report.byAdvertiser.map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"
                >
                  <span className="flex-1 text-sm text-gray-800">{a.name}</span>
                  <Chip>{a.industry}</Chip>
                  <span className="text-xs text-gray-500">
                    업무 {a.total}
                    {a.stale > 0 && (
                      <span className="ml-1 font-semibold text-amber-600">
                        · 지난건 {a.stale}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* 복사용 텍스트 */}
      <div className="mt-4">
        <Section
          title="복사용 텍스트 (카톡·메일 붙여넣기)"
          accent="gray"
          description="오른쪽 위 '보고서 복사' 버튼을 누르면 아래 내용이 클립보드에 복사됩니다."
        >
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
            {text}
          </pre>
        </Section>
      </div>

      {report.notIncluded.length > 0 && (
        <p className="mt-4 text-center text-xs text-gray-400">
          ※ 아직 미연동(다음 단계): {report.notIncluded.join(", ")}
        </p>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-gray-200">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={`text-lg font-bold ${tone === "warn" ? "text-amber-600" : "text-gray-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
