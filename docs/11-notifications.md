# 11. Notifications

Daily Gmail and Telegram report delivery is disabled.

The previous 08:00 KST Vercel Cron has been removed from `vercel.json`, and
`GET /api/send-report` now returns `410` unless `ENABLE_DAILY_REPORT_DELIVERY`
is explicitly set to `true`.

Do not configure these environment variables unless the delivery feature is
intentionally restored:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `MAIL_TO`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `CRON_SECRET`

To fully retire existing credentials, revoke the Gmail app password in the
Google account and revoke or delete the Telegram bot token in BotFather.
