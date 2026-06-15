/** 텔레그램 봇 설정 여부 */
export function telegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** 텔레그램 메시지 길이 제한(4096자) 이내로 줄 단위 분할 */
function chunkByLines(text: string, max = 3800): string[] {
  const chunks: string[] = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if (cur.length + line.length + 1 > max) {
      if (cur) chunks.push(cur);
      cur = line;
    } else {
      cur = cur ? `${cur}\n${line}` : line;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length ? chunks : [""];
}

/**
 * 텔레그램 봇으로 메시지 발송. (의존성 없는 fetch)
 * 4096자 제한을 넘으면 여러 메시지로 나눠 보낸다.
 * TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 사용.
 */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 가 설정되지 않았습니다.");
  }

  for (const part of chunkByLines(text)) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: part,
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`텔레그램 발송 실패 (${res.status}): ${detail.slice(0, 200)}`);
    }
  }
}
