/**
 * 텔레그램 chat_id 확인 도구.
 *
 * 사용:
 *   1) BotFather 로 봇 생성 → 토큰을 .env.local 의 TELEGRAM_BOT_TOKEN 에 입력
 *   2) 텔레그램에서 그 봇을 찾아 아무 메시지나 한 번 보냄 (예: "안녕")
 *   3) npm run telegram:chatid  → 출력된 chat_id 를 TELEGRAM_CHAT_ID 에 입력
 */
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN 이 .env.local 에 없습니다.");
    process.exit(1);
  }

  // 진단: 토큰이 어떤 봇인지 + 웹훅 여부
  try {
    const me = await (await fetch(`https://api.telegram.org/bot${token}/getMe`)).json();
    if (me.ok) {
      console.log(`이 토큰의 봇: @${me.result.username} (${me.result.first_name})`);
      console.log("→ 텔레그램에서 메시지를 보낸 봇이 위 @사용자명과 같은지 확인하세요.\n");
    }
    const wh = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
    if (wh.ok && wh.result?.url) {
      console.log(`⚠️ 웹훅이 설정돼 있어 getUpdates가 비어있습니다: ${wh.result.url}\n`);
    }
  } catch {
    /* 진단 실패는 무시 */
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const json = (await res.json()) as {
    ok: boolean;
    result?: Array<Record<string, { chat?: { id: number; title?: string; first_name?: string; type: string } }>>;
  };

  if (!json.ok) {
    console.error("토큰이 올바르지 않은 것 같습니다.", JSON.stringify(json));
    process.exit(1);
  }

  const updates = json.result ?? [];
  if (updates.length === 0) {
    console.log(
      "받은 메시지가 없습니다. 텔레그램에서 봇에게 아무 메시지나 먼저 보낸 뒤 다시 실행하세요."
    );
    return;
  }

  const seen = new Set<number>();
  for (const u of updates) {
    const chat = u.message?.chat ?? u.channel_post?.chat;
    if (chat && !seen.has(chat.id)) {
      seen.add(chat.id);
      const name = chat.title ?? chat.first_name ?? chat.type;
      console.log(`TELEGRAM_CHAT_ID=${chat.id}   (${name})`);
    }
  }
}

main();
