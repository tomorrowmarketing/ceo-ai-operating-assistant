/** AI 요약 미리보기(발송 없이 생성만). npm run ai:preview */
import { loadDataSource } from "@/lib/data";
import { buildDailyReport } from "@/lib/report";
import { buildAiSummary } from "@/lib/ai/summary";

async function main() {
  const ds = await loadDataSource();
  const report = buildDailyReport(ds);
  const ai = await buildAiSummary(report, ds);
  if (!ai) {
    console.log("AI 요약 생성 안 됨 (키 미설정 또는 실패 → 집계 폴백)");
    return;
  }
  console.log("===== 오늘의 핵심 (overall) =====");
  console.log(ai.overall);
  console.log("\n===== 담당자별 (perStaff) =====");
  for (const [name, summary] of Object.entries(ai.perStaff)) {
    console.log(`■ ${name}\n   ${summary}`);
  }
}

main();
