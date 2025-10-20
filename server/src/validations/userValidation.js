import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().required().min(3).max(50).trim().messages({
            'string.empty': 'Tên tài khoản không được để trống',
            'string.min': 'Tên tài khoản phải có ít nhất 3 ký tự',
            'string.max': 'Tên tài khoản không được vượt quá 50 ký tự',
            'any.required': 'Tên tài khoản là bắt buộc',
        }),
        password: Joi.string().min(6).max(100).messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'string.max': 'Mật khẩu không được vượt quá 100 ký tự',
        }),
        fullName: Joi.string().max(100).trim().allow('', null).messages({
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
        }),
        gender: Joi.string().valid('Nam', 'Nữ', '').allow('', null),
        email: Joi.string().email().allow('', null).messages({
            'string.email': 'Email không hợp lệ',
        }),
        phone: Joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .allow('', null)
            .messages({
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
            }),
        role: Joi.string()
            .valid('ban_giam_hieu', 'to_truong', 'giao_vien', 'ke_toan', 'phu_huynh')
            .required()
            .messages({
                'any.required': 'Vai trò là bắt buộc',
                'any.only': 'Vai trò không hợp lệ',
            }),
        status: Joi.boolean(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

const update = async (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(50).trim().messages({
            'string.min': 'Tên tài khoản phải có ít nhất 3 ký tự',
            'string.max': 'Tên tài khoản không được vượt quá 50 ký tự',
        }),
        password: Joi.string().min(6).max(100).messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'string.max': 'Mật khẩu không được vượt quá 100 ký tự',
        }),
        fullName: Joi.string().max(100).trim().allow('', null).messages({
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
        }),
        gender: Joi.string().valid('Nam', 'Nữ', '').allow('', null),
        email: Joi.string().email().allow('', null).messages({
            'string.email': 'Email không hợp lệ',
        }),
        phone: Joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .allow('', null)
            .messages({
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
            }),
        role: Joi.string().valid('ban_giam_hieu', 'to_truong', 'giao_vien', 'ke_toan', 'phu_huynh').messages({
            'any.only': 'Vai trò không hợp lệ',
        }),
        status: Joi.boolean(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

const changePassword = async (req, res, next) => {
    const schema = Joi.object({
        currentPassword: Joi.string().required().messages({
            'any.required': 'Mật khẩu hiện tại là bắt buộc',
        }),
        newPassword: Joi.string().min(6).max(100).required().messages({
            'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
            'string.max': 'Mật khẩu mới không được vượt quá 100 ký tự',
            'any.required': 'Mật khẩu mới là bắt buộc',
        }),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'Mật khẩu xác nhận không khớp',
            'any.required': 'Xác nhận mật khẩu là bắt buộc',
        }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

const forgotPassword = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
        }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

const verifyOtp = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
        }),
        otp: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
                'string.empty': 'Mã OTP không được để trống',
                'string.length': 'Mã OTP phải có 6 chữ số',
                'string.pattern.base': 'Mã OTP chỉ được chứa số',
                'any.required': 'Mã OTP là bắt buộc',
            }),
    });

    try {
        // allowUnknown: true để không lỗi khi client gửi thêm trường khác
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: true });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

const resetPasswordWithOtp = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.empty': 'Email không được để trống',
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
        }),
        otp: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
                'string.empty': 'Mã OTP không được để trống',
                'string.length': 'Mã OTP phải có 6 chữ số',
                'string.pattern.base': 'Mã OTP chỉ được chứa số',
                'any.required': 'Mã OTP là bắt buộc',
            }),
        newPassword: Joi.string().min(6).max(100).required().messages({
            'string.empty': 'Mật khẩu mới không được để trống',
            'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
            'string.max': 'Mật khẩu mới không được vượt quá 100 ký tự',
            'any.required': 'Mật khẩu mới là bắt buộc',
        }),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'Mật khẩu xác nhận không khớp',
            'any.required': 'Xác nhận mật khẩu là bắt buộc',
        }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const userValidation = { createNew, update, changePassword, forgotPassword, verifyOtp, resetPasswordWithOtp };
