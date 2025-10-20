import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_ADMIN_SENDER_EMAIL = process.env.RESEND_ADMIN_SENDER_EMAIL;

const resendInstance = new Resend(RESEND_API_KEY);

const sendEmail = async ({ to, subject, html, text = '' }) => {
    // ✅ Thêm text param
    try {
        const emailData = {
            from: RESEND_ADMIN_SENDER_EMAIL,
            to,
            subject,
            html,
        };

        // ✅ Chỉ thêm text nếu có
        if (text) {
            emailData.text = text;
        }

        const data = await resendInstance.emails.send(emailData);

        console.log('✅ Resend email sent successfully:', {
            id: data.id,
            to: to,
        });

        return data;
    } catch (error) {
        console.error('❌ ResendProvider.sendEmail error:', error);
        throw error;
    }
};

export const ResendProvider = {
    sendEmail,
};
