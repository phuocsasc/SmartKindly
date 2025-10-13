import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required().min(3).max(256).trim().messages({
            'string.empty': 'Tên trường học không được để trống',
            'string.min': 'Tên trường học phải có ít nhất 3 ký tự',
            'string.max': 'Tên trường học không được vượt quá 256 ký tự',
            'any.required': 'Tên trường học là bắt buộc',
        }),
        address: Joi.string().required().min(10).max(500).trim().messages({
            'string.empty': 'Địa chỉ không được để trống',
            'string.min': 'Địa chỉ phải có ít nhất 10 ký tự',
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
            'any.required': 'Địa chỉ là bắt buộc',
        }),
        manager: Joi.string().required().min(3).max(100).trim().messages({
            'string.empty': 'Tên hiệu trưởng không được để trống',
            'string.min': 'Tên hiệu trưởng phải có ít nhất 3 ký tự',
            'string.max': 'Tên hiệu trưởng không được vượt quá 100 ký tự',
            'any.required': 'Tên hiệu trưởng là bắt buộc',
        }),
        phone: Joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .allow('', null)
            .messages({
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
            }),
        username: Joi.string().username().allow('', null).messages({
            'string.username': 'username không hợp lệ',
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

export const schoolValidation = { createNew };
