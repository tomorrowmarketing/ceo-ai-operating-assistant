/** 발송될 보고서 전체 미리보기(발송 없이 생성만). npm run ai:preview */
import { loadDataSource } from "@/lib/data";
import { buildDailyReport, reportToText } from "@/lib/report";
import { buildAiSummary } from "@/lib/ai/summary";

async function main() {
  const ds = await loadDataSource();
  const report = buildDailyReport(ds);
  const ai = await buildAiSummary(report, ds);
  console.log(ai ? "(AI 요약 포함)\n" : "(AI 요약 없음 — 집계 보고서)\n");
  console.log(reportToText(report, ai));
}

main();
