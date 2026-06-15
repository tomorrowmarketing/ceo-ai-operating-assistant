import nodemailer from "nodemailer";

/** Gmail SMTP(앱 비밀번호) 설정 여부 */
export function emailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

/**
 * Gmail SMTP로 메일 발송.
 * GMAIL_USER / GMAIL_APP_PASSWORD(앱 비밀번호) / MAIL_TO(없으면 본인에게) 사용.
 */
export async function sendEmail(subject: string, text: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.MAIL_TO || user;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD 가 설정되지 않았습니다.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `대표님 운영 비서 <${user}>`,
    to,
    subject,
    text,
  });
}
