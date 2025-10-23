import { StatusCodes } from 'http-status-codes';
import { userServices } from '~/services/userServices';

const login = async (req, res, next) => {
    try {
        const result = await userServices.login(req.body);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

// ✅ Thêm controller getInfoUserDetails
const getInfoUserDetails = async (req, res, next) => {
    try {
        // ✅ Lấy userId từ JWT token (đã được verify bởi authMiddleware)
        const userId = req.jwtDecoded.id;
        const result = await userServices.getInfoUserDetails(userId);

        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin người dùng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const result = await userServices.logout();
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const result = await userServices.refreshToken(req.body.refreshToken);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const sendOtpToEmail = async (req, res, next) => {
    try {
        const result = await userServices.sendOtpToEmail(req.body.email);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const result = await userServices.verifyOtp(email, otp);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const resetPasswordWithOtp = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const result = await userServices.resetPasswordWithOtp(email, otp, newPassword);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const userController = {
    login,
    getInfoUserDetails, // ✅ Export
    logout,
    refreshToken,
    sendOtpToEmail,
    verifyOtp,
    resetPasswordWithOtp,
};
