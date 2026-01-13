// server/src/validations/parentManagementValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        studentIds: Joi.array()
            .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
            .min(1)
            .required()
            .messages({
                'array.min': 'Vui lòng chọn ít nhất 1 học sinh',
                'any.required': 'Danh sách học sinh là bắt buộc',
            }),
        email: Joi.string().email().allow('', null).messages({
            'string.email': 'Email không hợp lệ',
        }),
        phone: Joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .allow('', null)
            .messages({
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
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

const update = async (req, res, next) => {
    const schema = Joi.object({
        fullName: Joi.string().min(2).max(100).trim().messages({
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
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

export const parentManagementValidation = {
    createNew,
    update,
};
