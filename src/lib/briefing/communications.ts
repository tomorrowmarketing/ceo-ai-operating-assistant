import type { CommHighlight, Severity } from "@/lib/types";
import type { DataSource } from "@/lib/data";
import { bySeverity } from "./utils";

/**
 * 중요 커뮤니케이션 요약을 산출한다.
 * 부정 감성/회신 필요/중요 표시를 기준으로 severity를 부여한다.
 */
export function buildCommHighlights(ds: DataSource): CommHighlight[] {
  const { advertiserName, communications } = ds;
  const highlights = communications
    .filter((c) => c.important || c.requiresReply || c.sentiment === "부정")
    .map<CommHighlight>((c) => {
      let severity: Severity = "확인필요";
      if (c.sentiment === "부정") severity = "긴급";
      else if (c.requiresReply && c.important) severity = "주의";
      else if (c.requiresReply) severity = "확인필요";

      return {
        id: c.id,
        channel: c.channel,
        advertiserName: advertiserName(c.advertiserId),
        from: c.from,
        summary: c.summary,
        receivedAt: c.receivedAt,
        severity,
        requiresReply: c.requiresReply,
      };
    });

  return highlights.sort(bySeverity);
}
