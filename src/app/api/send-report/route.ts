import { NextResponse } from "next/server";
import { sendDailyReport } from "@/lib/notify/sendReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 일일 보고서 발송 엔드포인트.
 * Vercel Cron 이 매일 호출한다. (vercel.json 참고)
 *
 * 보안: CRON_SECRET 가 설정돼 있으면 `Authorization: Bearer <CRON_SECRET>`
 * 헤더가 일치할 때만 실행한다. (Vercel Cron 은 이 헤더를 자동으로 붙임)
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await sendDailyReport();
  return NextResponse.json(result);
}
