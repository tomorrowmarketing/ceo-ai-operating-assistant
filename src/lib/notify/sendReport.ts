import { loadDataSource } from "@/lib/data";
import { buildDailyReport, reportToText } from "@/lib/report";
import { buildAiSummary } from "@/lib/ai/summary";
import { emailConfigured, sendEmail } from "./email";
import { sendTelegram, telegramConfigured } from "./telegram";

export interface SendResult {
  channel: "email" | "telegram";
  ok: boolean;
  detail?: string;
}

/**
 * 오늘의 일일 보고서를 만들어 설정된 채널(메일·텔레그램)로 발송한다.
 * 한 채널이 실패해도 다른 채널은 계속 시도한다. (미설정 채널은 건너뜀)
 */
export async function sendDailyReport(): Promise<{
  subject: string;
  results: SendResult[];
}> {
  const ds = await loadDataSource();
  const report = buildDailyReport(ds);
  const ai = await buildAiSummary(report, ds); // 키 없으면 null → 집계 보고서로
  const text = reportToText(report, ai);
  const subject = `[운영비서] ${report.dateLabel} 일일 보고서`;
  const results: SendResult[] = [];

  if (emailConfigured()) {
    try {
      await sendEmail(subject, text);
      results.push({ channel: "email", ok: true });
    } catch (e) {
      results.push({ channel: "email", ok: false, detail: (e as Error).message });
    }
  } else {
    results.push({ channel: "email", ok: false, detail: "미설정(건너뜀)" });
  }

  if (telegramConfigured()) {
    try {
      await sendTelegram(`${subject}\n\n${text}`);
      results.push({ channel: "telegram", ok: true });
    } catch (e) {
      results.push({ channel: "telegram", ok: false, detail: (e as Error).message });
    }
  } else {
    results.push({ channel: "telegram", ok: false, detail: "미설정(건너뜀)" });
  }

  return { subject, results };
}
