/* eslint-disable no-unreachable */
// server/src/services/userServices.js
import { UserModel } from '~/models/userModel';
import { SchoolModel } from '~/models/schoolModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { JwtProvider } from '~/providers/JwtProvider';
import { env } from '~/config/environment';
import { OtpModel } from '~/models/notpModel';
import { ResendProvider } from '~/providers/ResendProvider';

const login = async (data) => {
    try {
        const { username, password } = data;

        // ✅ Bước 1: Tìm user theo username (không kiểm tra status ở đây)
        const user = await UserModel.findOne({
            username,
            _destroy: false, // Chỉ kiểm tra user chưa bị xóa
        });

        // ✅ Bước 2: Kiểm tra user có tồn tại không
        if (!user) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tên tài khoản hoặc mật khẩu không chính xác');
        }

        // ✅ Bước 3: Kiểm tra password TRƯỚC KHI kiểm tra status
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tên tài khoản hoặc mật khẩu không chính xác');
        }

        // ✅ Bước 4: SAU KHI xác thực password thành công, mới kiểm tra account có bị vô hiệu hóa không
        if (!user.status) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Bộ phận kỹ thuật để được hỗ trợ.',
            );
        }
        // ✅ Lấy thông tin trường học nếu user có schoolId
        let schoolName = null;
        if (user.schoolId) {
            const school = await SchoolModel.findOne({
                schoolId: user.schoolId,
                _destroy: false,
            }).select('name');

            schoolName = school?.name || null;
        }
        // ✅ Bước 5: Tạo JWT token
        const userInfo = {
            id: user._id,
            // userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            isRoot: user.isRoot || false, // ✅ Thêm isRoot vào đây
            schoolId: user.schoolId,
            schoolName, // ✅ Thêm schoolName
            status: user.status,
        };

        const accessToken = await JwtProvider.generateToken(
            userInfo,
            env.ACCESS_TOKEN_SECRET_SIGNATURE,
            '1h', // Access token expire trong 1 giờ
        );

        const refreshToken = await JwtProvider.generateToken(
            userInfo,
            env.REFRESH_TOKEN_SECRET_SIGNATURE,
            '14d', // Refresh token expire trong 14 ngày
        );

        return {
            ...userInfo,
            accessToken,
            refreshToken,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đăng nhập');
    }
};

const logout = async () => {
    try {
        // Với trường hợp sử dụng localStorage, phía client sẽ tự xóa token
        // Nếu sử dụng HTTP-only cookies, cần clear cookies ở đây
        return { message: 'Đăng xuất thành công' };
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đăng xuất');
    }
};

const refreshToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = await JwtProvider.verifyToken(refreshToken, env.REFRESH_TOKEN_SECRET_SIGNATURE);

        // Tạo user info để tạo access token mới
        const userInfo = {
            id: decoded.id,
            username: decoded.username,
            fullName: decoded.fullName,
            role: decoded.role,
            isRoot: decoded.isRoot || false,
            schoolId: decoded.schoolId,
            schoolName: decoded.schoolName,
            status: decoded.status,
        };

        // Tạo access token mới
        const newAccessToken = await JwtProvider.generateToken(userInfo, env.ACCESS_TOKEN_SECRET_SIGNATURE, '1h');

        return {
            accessToken: newAccessToken,
        };
    } catch (error) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token không hợp lệ hoặc đã hết hạn');
    }
};
// Tạo mã OTP 6 số ngẫu nhiên
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpToEmail = async (email) => {
    try {
        console.log('🔍 Step 1: Finding user with email:', email);

        const user = await UserModel.findOne({ email, _destroy: false });

        if (!user) {
            console.log('❌ User not found');
            throw new ApiError(StatusCodes.NOT_FOUND, 'Email không tồn tại trong hệ thống');
        }

        console.log('✅ Step 2: User found:', user.username);

        const existingOtp = await OtpModel.findOne({
            email,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        });

        if (existingOtp) {
            console.log('⚠️ Existing OTP found');
            const remainingTime = Math.ceil((existingOtp.expiresAt - new Date()) / 1000);
            throw new ApiError(
                StatusCodes.TOO_MANY_REQUESTS,
                `Mã OTP đã được gửi. Vui lòng thử lại sau ${remainingTime} giây`,
            );
        }

        console.log('✅ Step 3: Generating new OTP');

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 1.5 * 60 * 1000);

        console.log('📝 OTP generated:', otp, 'expires at:', expiresAt);

        const otpRecord = await OtpModel.create({
            email,
            otp,
            expiresAt,
            isUsed: false,
        });

        console.log('✅ Step 4: OTP saved to database:', otpRecord._id);

        // ✅ Thêm plain text version (Quan trọng để tránh spam)
        const textContent = `
            Xin chào ${user.fullName || user.username},

            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản SmartKindly của mình.

            MÃ OTP CỦA BẠN: ${otp}

            Mã này có hiệu lực trong 60 giây.

            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với quản trị viên.

            ---
            Trân trọng,
            SmartKindly - Hệ thống quản lý trường mầm non
            Website: https://smartkindly.vn
            Email: support@phuoctrandev.me
            Hotline: 1900 xxxx

            © ${new Date().getFullYear()} SmartKindly. All rights reserved.
                    `.trim();

        // ✅ HTML version với cải tiến chống spam
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mã OTP đặt lại mật khẩu - SmartKindly</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 30px; text-align: center; border-bottom: 2px solid #667eea;">
                                        <h1 style="color: #667eea; margin: 0; font-size: 28px;">SmartKindly</h1>
                                        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Hệ thống quản lý trường mầm non công lập</p>
                                    </td>
                                </tr>
                                
                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Xác thực đặt lại mật khẩu</h2>
                                        
                                        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 15px;">
                                            Xin chào <strong>${user.fullName || user.username}</strong>,
                                        </p>
                                        
                                        <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 15px;">
                                            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. 
                                            Vui lòng sử dụng mã OTP bên dưới để xác thực:
                                        </p>
                                        
                                        <!-- OTP Box -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                                            <tr>
                                                <td align="center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
                                                    <p style="color: white; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Mã xác thực OTP</p>
                                                    <h1 style="color: white; margin: 0; font-size: 42px; letter-spacing: 12px; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h1>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Warning Box -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                                            <tr>
                                                <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px;">
                                                    <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
                                                        <strong>⚠️ Lưu ý quan trọng:</strong> Mã OTP có hiệu lực trong <strong>60 giây</strong><br>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Contact Info -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0 0 0;">
                                            <tr>
                                                <td style="padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                                                    <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
                                                        <strong>Cần hỗ trợ?</strong><br>
                                                        📞 Hotline: <a href="tel:0327546610" style="color: #667eea; text-decoration: none;">0327546610</a><br>
                                                        🌐 Website: <a href="https://smartkindly.vn" style="color: #667eea; text-decoration: none;">smartkindly.vn</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0; text-align: center;">
                                        <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">
                                            © ${new Date().getFullYear()} SmartKindly - Hệ thống quản lý trường mầm non
                                        </p>
                                        <p style="color: #999; font-size: 11px; margin: 0;">
                                            Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.
                                        </p>
                                        <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
                                            <a href="https://smartkindly.vn/privacy" style="color: #667eea; text-decoration: none;">Chính sách bảo mật</a> | 
                                            <a href="https://smartkindly.vn/terms" style="color: #667eea; text-decoration: none;">Điều khoản sử dụng</a>
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

        console.log('📧 Step 5: Sending email via Resend to:', email);

        // ✅ Gửi với cả text và html version
        await ResendProvider.sendEmail({
            to: [email],
            subject: 'Mã OTP đặt lại mật khẩu - SmartKindly',
            html: htmlContent,
            text: textContent, // ✅ Thêm text version
        });

        console.log('✅ Step 6: Email sent successfully via Resend');

        return {
            message: 'Mã OTP đã được gửi đến email của bạn',
            expiresIn: 60,
            ...(env.BUILD_MODE === 'dev' && {
                devInfo: {
                    otp: otp,
                    email: email,
                },
            }),
        };
    } catch (error) {
        console.error('❌ Error in sendOtpToEmail:', {
            message: error.message,
            stack: error.stack,
        });

        if (error instanceof ApiError) throw error;

        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi khi gửi mã OTP: ${error.message}`);
    }
};

const verifyOtp = async (email, otp) => {
    try {
        console.log('🔍 Verifying OTP for:', email);

        // Tìm OTP hợp lệ (chưa sử dụng và chưa hết hạn)
        const otpRecord = await OtpModel.findOne({
            email,
            otp,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        });

        if (!otpRecord) {
            console.log('❌ Invalid or expired OTP');
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã OTP không hợp lệ hoặc đã hết hạn');
        }

        console.log('✅ OTP verified, marking as used');

        // ✅ Đánh dấu OTP đã được verify và GIA HẠN thêm 5 phút để reset password
        otpRecord.isUsed = true;
        otpRecord.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Gia hạn thêm 5 phút
        await otpRecord.save();

        return {
            message: 'Xác thực OTP thành công. Bạn có 5 phút để đặt lại mật khẩu.',
            email: otpRecord.email,
        };
    } catch (error) {
        console.error('❌ Error in verifyOtp:', error.message);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi khi xác thực OTP: ${error.message}`);
    }
};

const resetPasswordWithOtp = async (email, otp, newPassword) => {
    try {
        console.log('🔍 Resetting password for:', email);

        // Kiểm tra OTP có hợp lệ và đã được verify không
        const otpRecord = await OtpModel.findOne({
            email,
            otp,
            isUsed: true, // Phải là OTP đã được verify
            expiresAt: { $gt: new Date() },
        });

        if (!otpRecord) {
            console.log('❌ Invalid OTP for reset password');
            console.log('Debug info:', {
                email,
                otp,
                currentTime: new Date(),
            });

            // Kiểm tra xem có OTP nào không
            const anyOtp = await OtpModel.findOne({ email, otp });
            if (anyOtp) {
                console.log('OTP found but:', {
                    isUsed: anyOtp.isUsed,
                    expiresAt: anyOtp.expiresAt,
                    expired: anyOtp.expiresAt < new Date(),
                });

                if (anyOtp.expiresAt < new Date()) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã OTP đã hết hiệu lực. Vui lòng yêu cầu mã OTP mới.');
                }
            }

            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã OTP không hợp lệ hoặc chưa được xác thực');
        }

        // Tìm user theo email
        const user = await UserModel.findOne({ email, _destroy: false });

        if (!user) {
            console.log('❌ User not found');
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        console.log('✅ Updating password for user:', user.username);

        // Cập nhật mật khẩu mới
        user.password = newPassword;
        await user.save();

        console.log('✅ Password updated successfully');

        // Xóa tất cả OTP của email này
        await OtpModel.deleteMany({ email });

        console.log('✅ OTP records cleaned up');

        return {
            message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
        };
    } catch (error) {
        console.error('❌ Error in resetPasswordWithOtp:', error.message);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Lỗi khi đặt lại mật khẩu: ${error.message}`);
    }
};
// ✅ Tối ưu getInfoUserDetails
const getInfoUserDetails = async (userId) => {
    try {
        // ✅ Parallel query user + school
        const [user, school] = await Promise.all([
            UserModel.findOne({ _id: userId, _destroy: false })
                .select('-password') // ✅ Loại password
                .lean(),

            // ✅ Fetch school nếu có schoolId
            userId
                ? (async () => {
                      const u = await UserModel.findById(userId).select('schoolId').lean();
                      if (u?.schoolId) {
                          return SchoolModel.findOne({
                              schoolId: u.schoolId,
                              _destroy: false,
                          })
                              .select('name abbreviation')
                              .lean();
                      }
                      return null;
                  })()
                : null,
        ]);

        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng');
        }

        return {
            ...user,
            school,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin người dùng');
    }
};

export const userServices = {
    getInfoUserDetails, // ✅ Export
    login,
    logout,
    refreshToken,
    sendOtpToEmail,
    verifyOtp,
    resetPasswordWithOtp,
};
