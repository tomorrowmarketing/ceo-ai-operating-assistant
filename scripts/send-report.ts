/**
 * 일일 보고서 수동 발송(테스트용).
 * 배포 전, .env.local 설정이 맞는지 확인할 때 사용한다.
 *
 *   npm run report:send
 */
import { sendDailyReport } from "@/lib/notify/sendReport";

async function main() {
  const { subject, results } = await sendDailyReport();
  console.log("제목:", subject);
  for (const r of results) {
    console.log(`- ${r.channel}: ${r.ok ? "성공 ✓" : "실패/건너뜀 (" + r.detail + ")"}`);
  }
}

main();
