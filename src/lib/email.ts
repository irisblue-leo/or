import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationCode(): string {
  // 生成 6 位数字验证码
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: '邮箱验证码 - OpenClaw Relay',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">欢迎注册 OpenClaw Relay</h2>
        <p style="color: #666; font-size: 14px;">您的验证码是：</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">验证码有效期为 10 分钟，请尽快完成注册。</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">如果您没有注册账号，请忽略此邮件。</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: '验证您的邮箱 - OpenClaw Relay',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>欢迎注册 OpenClaw Relay</h2>
        <p>请点击下面的链接验证您的邮箱地址：</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">验证邮箱</a>
        <p>或者复制以下链接到浏览器：</p>
        <p>${verificationUrl}</p>
        <p>此链接将在24小时后过期。</p>
        <p>如果您没有注册账号，请忽略此邮件。</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
