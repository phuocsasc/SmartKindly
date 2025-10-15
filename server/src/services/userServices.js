/* eslint-disable no-unreachable */
// server/src/services/userServices.js
import { UserModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { JwtProvider } from '~/providers/JwtProvider';
import { env } from '~/config/environment';

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
                'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ ban giám hiệu để được hỗ trợ.',
            );
        }

        // ✅ Bước 5: Tạo JWT token
        const userInfo = {
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
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

export const userServices = {
    login,
    logout,
    refreshToken,
};
