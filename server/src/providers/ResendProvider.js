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

const sendAssignTeacherEmail = async ({ to, toName, className, academicYearName, schoolName, assignedByName }) => {
    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thông báo phân công giáo viên chủ nhiệm - SmartKindly</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #0071BC 0%, #45B0E5 100%); padding: 30px; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">SmartKindly</h1>
                                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Hệ thống quản lý trường mầm non</p>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Thông báo phân công chủ nhiệm</h2>
                                        
                                        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
                                            Xin chào <strong>${toName}</strong>,
                                        </p>
                                        
                                        <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 15px;">
                                            Bạn vừa được phân công làm <strong>Giáo viên chủ nhiệm</strong> tại trường <strong>${schoolName}</strong>. 
                                            Chi tiết phân công như sau:
                                        </p>
                                        
                                        <!-- Info Box -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #0071BC 0%, #45B0E5 100%); padding: 25px; border-radius: 10px;">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>Trường:</strong> ${schoolName}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>Lớp học chủ nhiệm:</strong> ${className}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>Năm học:</strong> ${academicYearName}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>Phân công bởi:</strong> ${assignedByName}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        

                                        <!-- Contact Info -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                                                    <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
                                                        <strong>Cần hỗ trợ?</strong><br>
                                                        Liên hệ quản trị viên hoặc Ban giám hiệu nhà trường để được hỗ trợ.<br>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="color: #999; font-size: 12px; margin: 0;">
                                            Email này được gửi tự động từ hệ thống SmartKindly. Vui lòng không trả lời email này.
                                        </p>
                                        <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
                                            © ${new Date().getFullYear()} SmartKindly. All rights reserved.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const textContent = `
Xin chào ${toName},

Bạn vừa được phân công làm Giáo viên chủ nhiệm tại trường ${schoolName}.

Chi tiết phân công:
- Trường: ${schoolName}
- Lớp chủ nhiệm: ${className}
- Năm học: ${academicYearName}
- Phân công bởi: ${assignedByName}

Vui lòng đăng nhập vào hệ thống SmartKindly để xem chi tiết lớp học.

---
Trân trọng,
SmartKindly - Hệ thống quản lý trường mầm non
        `.trim();

        const data = await resendInstance.emails.send({
            from: RESEND_ADMIN_SENDER_EMAIL,
            to: [to],
            subject: `[SmartKindly] Phân công chủ nhiệm lớp ${className} - Năm học ${academicYearName}`,
            html: htmlContent,
            text: textContent,
        });

        console.log('✅ [ResendProvider] Assign teacher email sent:', { id: data.id, to });
        return data;
    } catch (error) {
        console.error('❌ [ResendProvider] sendAssignTeacherEmail error:', error);
        throw error;
    }
};

const sendAssignDepartmentEmail = async ({
    to,
    toName,
    departmentName,
    academicYearName,
    schoolName,
    assignedByName,
    isRemoved = false,
}) => {
    try {
        const subject = isRemoved
            ? `[SmartKindly] Gỡ bỏ quản lý tổ bộ môn ${departmentName} - Năm học ${academicYearName}`
            : `[SmartKindly] Phân công quản lý tổ bộ môn ${departmentName} - Năm học ${academicYearName}`;

        const titleText = isRemoved ? 'Thông báo gỡ bỏ quản lý tổ bộ môn' : 'Thông báo phân công quản lý tổ bộ môn';
        const bodyText = isRemoved
            ? `Bạn vừa được <strong>gỡ bỏ</strong> khỏi vai trò quản lý tổ bộ môn tại trường <strong>${schoolName}</strong>.`
            : `Bạn vừa được <strong>phân công</strong> làm <strong>Cán bộ quản lý tổ bộ môn</strong> tại trường <strong>${schoolName}</strong>.`;

        const actionLabel = isRemoved ? 'Gỡ bỏ bởi:' : 'Phân công bởi:';
        const noteText = isRemoved
            ? 'Bạn đã được gỡ bỏ khỏi tổ bộ môn này. Vui lòng đăng nhập hệ thống để kiểm tra thông tin.'
            : 'Vui lòng đăng nhập vào hệ thống SmartKindly để xem chi tiết tổ bộ môn và bắt đầu quản lý.';
        const headerColor = isRemoved ? '#E53935' : '#0071BC';
        const headerGradient = isRemoved
            ? 'linear-gradient(135deg, #E53935 0%, #EF9A9A 100%)'
            : 'linear-gradient(135deg, #0071BC 0%, #45B0E5 100%)';

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${titleText} - SmartKindly</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

                                <!-- Header -->
                                <tr>
                                    <td style="background: ${headerGradient}; padding: 30px; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">SmartKindly</h1>
                                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Hệ thống quản lý trường mầm non</p>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">${titleText}</h2>

                                        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
                                            Xin chào <strong>${toName}</strong>,
                                        </p>

                                        <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 15px;">
                                            ${bodyText} Chi tiết như sau:
                                        </p>

                                        <!-- Info Box -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                                            <tr>
                                                <td style="background: ${headerGradient}; padding: 25px; border-radius: 10px;">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>Trường:</strong> ${schoolName}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>Tổ bộ môn:</strong> ${departmentName}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>Năm học:</strong> ${academicYearName}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="color: white; font-size: 14px; padding: 6px 0;">
                                                                <strong>${actionLabel}</strong> ${assignedByName}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Note Box -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                                            <tr>
                                                <td style="background-color: ${isRemoved ? '#ffeaea' : '#e8f4fd'}; border-left: 4px solid ${headerColor}; padding: 15px; border-radius: 5px;">
                                                    <p style="color: ${headerColor}; margin: 0; font-size: 14px; line-height: 1.5;">
                                                        <strong>${isRemoved ? '⚠️ Lưu ý:' : 'ℹ️ Lưu ý:'}</strong> ${noteText}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Contact Info -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                                                    <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
                                                        <strong>Cần hỗ trợ?</strong><br>
                                                        Liên hệ quản trị viên hoặc Ban giám hiệu nhà trường để được hỗ trợ.<br>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="color: #999; font-size: 12px; margin: 0;">
                                            Email này được gửi tự động từ hệ thống SmartKindly. Vui lòng không trả lời email này.
                                        </p>
                                        <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
                                            © ${new Date().getFullYear()} SmartKindly. All rights reserved.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const textContent = `
Xin chào ${toName},

${isRemoved ? `Bạn vừa được gỡ bỏ khỏi vai trò quản lý tổ bộ môn tại trường ${schoolName}.` : `Bạn vừa được phân công làm Cán bộ quản lý tổ bộ môn tại trường ${schoolName}.`}

Chi tiết:
- Trường: ${schoolName}
- Tổ bộ môn: ${departmentName}
- Năm học: ${academicYearName}
- ${isRemoved ? 'Gỡ bỏ bởi' : 'Phân công bởi'}: ${assignedByName}

Vui lòng đăng nhập vào hệ thống SmartKindly để kiểm tra thông tin.

---
Trân trọng,
SmartKindly - Hệ thống quản lý trường mầm non
        `.trim();

        const data = await resendInstance.emails.send({
            from: RESEND_ADMIN_SENDER_EMAIL,
            to: [to],
            subject,
            html: htmlContent,
            text: textContent,
        });

        console.log('✅ [ResendProvider] Assign department email sent:', { id: data.id, to, isRemoved });
        return data;
    } catch (error) {
        console.error('❌ [ResendProvider] sendAssignDepartmentEmail error:', error);
        throw error;
    }
};

export const ResendProvider = {
    sendEmail,
    sendAssignTeacherEmail,
    sendAssignDepartmentEmail, // ✅ Export thêm
};
