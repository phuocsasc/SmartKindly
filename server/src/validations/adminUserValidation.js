import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        schoolId: Joi.string().required().messages({
            'string.empty': 'Mã trường không được để trống',
            'any.required': 'Mã trường là bắt buộc',
        }),
        fullName: Joi.string().required().min(3).max(100).trim().messages({
            'string.empty': 'Họ tên không được để trống',
            'string.min': 'Họ tên phải có ít nhất 3 ký tự',
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
            'any.required': 'Họ tên là bắt buộc',
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
        // ✅ FIX: Cho phép isRoot với mọi role, logic xử lý trong service
        isRoot: Joi.boolean().optional().default(false),
        status: Joi.boolean().default(true),
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
        fullName: Joi.string().min(3).max(100).trim().messages({
            'string.min': 'Họ tên phải có ít nhất 3 ký tự',
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
        // ✅ FIX: Cho phép isRoot khi update
        isRoot: Joi.boolean().optional(),
        status: Joi.boolean(),
        // ✅ FIX: Không cấm schoolId ở validation, sẽ xử lý trong service
    });

    try {
        // ✅ allowUnknown: true để không báo lỗi khi có field không khai báo
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: true });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const adminUserValidation = { createNew, update };
