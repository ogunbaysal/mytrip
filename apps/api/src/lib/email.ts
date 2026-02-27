import nodemailer from "nodemailer";

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT
  ? Number(process.env.SMTP_PORT)
  : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

const hasSmtpConfig =
  !!smtpHost &&
  !!smtpPort &&
  Number.isFinite(smtpPort) &&
  !!smtpUser &&
  !!smtpPass &&
  !!smtpFrom;

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export const sendPasswordResetEmail = async ({
  to,
  resetUrl,
}: PasswordResetEmailInput) => {
  if (!transporter) {
    throw new Error("SMTP is not configured for password reset emails.");
  }

  return await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "Reset your TatilDesen password",
    text: `Reset your password using this link: ${resetUrl}`,
  });
};
