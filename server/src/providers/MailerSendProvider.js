import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const MAILER_SEND_API_KEY = process.env.MAILER_SEND_API_KEY;
const ADMIN_SENDER_EMAIL = process.env.ADMIN_SENDER_EMAIL;
const ADMIN_SENDER_NAME = process.env.ADMIN_SENDER_NAME;

// Tạo Instance của MailerSend để sử dụng trong toàn bộ ứng dụng
const mailerSendInstance = new MailerSend({
    apiKey: MAILER_SEND_API_KEY,
});

// Tạo biến sentFrom: người gửi email
const sendFrom = new Sender(ADMIN_SENDER_EMAIL, ADMIN_SENDER_NAME);

// Function gửi email
const sendEmail = async (to, toName, subject, html) => {
    try {
        // Setup email và tên của người nhận, (Hoặc nhiều người nhận, dữ liệu trong mảng)
        const recipients = [new Recipient(to, toName)];

        // Setup email parameters theo chuẩn của MailerSend
        const emailParams = new EmailParams()
            .setFrom(sendFrom)
            .setTo(recipients)
            .setReplyTo(sendFrom)
            .setSubject(subject)
            .setHtml(html);

        // Gửi email sử dụng MailerSend instance
        const data = await mailerSendInstance.email.send(emailParams);
        return data;
    } catch (error) {
        console.error('MailerSend Error:', error);
        throw error;
    }
};

export const MailerSendProvider = {
    sendEmail,
};
