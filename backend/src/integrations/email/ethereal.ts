import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

let transporter: Transporter | null = null;

export const getEmailTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  if (config.ethereal.user && config.ethereal.password) {
    transporter = nodemailer.createTransport({
      host: config.ethereal.host,
      port: config.ethereal.port,
      secure: false,
      auth: {
        user: config.ethereal.user,
        pass: config.ethereal.password,
      },
    });
  } else {
    // Generate test account automatically if credentials not provided
    logger.info('No Ethereal credentials found in env. Auto-creating test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info({ user: testAccount.user }, 'Ethereal test account created successfully');
  }

  return transporter;
};

export interface SendEmailPayload {
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
}

export const sendEmailViaEthereal = async (
  payload: SendEmailPayload
): Promise<SendEmailResult> => {
  const mailTransporter = await getEmailTransporter();

  const info = await mailTransporter.sendMail({
    from: `"${payload.fromName}" <${payload.fromEmail}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.body,
    html: payload.body.replace(/\n/g, '<br/>'),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  logger.info(
    { messageId: info.messageId, recipient: payload.to, previewUrl },
    'Email sent via Ethereal SMTP'
  );

  return {
    messageId: info.messageId,
    previewUrl,
  };
};
