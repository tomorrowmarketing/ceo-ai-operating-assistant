# 11. 일일 보고서 자동 발송 (메일 + 텔레그램)

매일 아침 일일 보고서를 **Gmail**과 **텔레그램**으로 자동 발송한다.
- 발송 내용: `buildDailyReport` → `reportToText` (업무·담당자·광고주 기준)
- 자동 실행: **Vercel Cron** (매일 08:00 KST = `0 23 * * *` UTC)
- 엔드포인트: `GET /api/send-report` (CRON_SECRET 으로 보호)
- 수동 테스트: `npm run report:send`

---

## A. 메일 (Gmail 앱 비밀번호)

1. Gmail 계정 **2단계 인증** 켜기 (myaccount.google.com → 보안)
2. **앱 비밀번호** 발급 (myaccount.google.com → 보안 → 앱 비밀번호) → 16자리
3. `.env.local` 에 입력:
   ```
   GMAIL_USER=내지메일@gmail.com
   GMAIL_APP_PASSWORD=발급받은16자리
   MAIL_TO=받을주소@example.com   # 비우면 본인에게
   ```

## B. 텔레그램 봇

1. 텔레그램에서 **@BotFather** 검색 → `/newbot` → 이름 정하면 **봇 토큰** 발급
2. `.env.local` 에 `TELEGRAM_BOT_TOKEN=토큰` 입력
3. 방금 만든 봇을 텔레그램에서 찾아 **아무 메시지나 한 번 전송** ("안녕")
4. 터미널: `npm run telegram:chatid` → 출력된 `TELEGRAM_CHAT_ID=...` 를 `.env.local` 에 입력

## C. 로컬에서 발송 테스트

```
npm run report:send
```
- 메일·텔레그램 각각 "성공 ✓ / 실패·건너뜀" 결과가 표시된다.
- 둘 중 설정 안 된 채널은 자동으로 건너뛴다.

---

## D. Vercel 배포 + 매일 자동 발송

1. **vercel.com** 가입 → GitHub 저장소(`ceo-ai-operating-assistant`) Import → 배포
2. Vercel 프로젝트 **Settings → Environment Variables** 에 아래를 모두 등록:
   - `DATA_SOURCE=notion`
   - `NOTION_TOKEN`, `NOTION_DB_TASKS` (그리고 사용하는 다른 NOTION_DB_*)
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_TO`
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - `CRON_SECRET` = 아무 긴 임의 문자열 (예: 무작위 32자)
3. 재배포(Redeploy). `vercel.json` 의 크론이 매일 **08:00 KST** 에 `/api/send-report` 를 호출 → 메일+텔레그램 발송.
   - 발송 시각을 바꾸려면 `vercel.json` 의 `schedule`(UTC 기준) 수정.
   - 예: 07:00 KST = `0 22 * * *`, 09:00 KST = `0 0 * * *`.

> 보안: `.env.local` 은 git에 올라가지 않는다. 토큰/비밀번호는 로컬 `.env.local` 과
> Vercel 환경변수에만 둔다. 노출 시 즉시 재발급한다.

## 트러블슈팅
- 메일 실패: 2단계 인증/앱 비밀번호 재확인 (일반 비밀번호 아님).
- 텔레그램 실패: 봇에게 먼저 말을 걸었는지, CHAT_ID 가 맞는지 확인.
- 크론 미동작: Vercel 환경변수 등록 후 **재배포** 했는지, CRON_SECRET 일치 여부 확인.
