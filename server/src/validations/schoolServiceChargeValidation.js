// server/src/validations/schoolServiceChargeValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        serviceName: Joi.string().required().min(2).max(200).trim().messages({
            'string.base': 'Tên dịch vụ phải là chuỗi',
            'string.empty': 'Tên dịch vụ không được để trống',
            'string.min': 'Tên dịch vụ phải có ít nhất 2 ký tự',
            'string.max': 'Tên dịch vụ không được vượt quá 200 ký tự',
            'any.required': 'Tên dịch vụ là bắt buộc',
        }),
        amount: Joi.number().required().min(0).messages({
            'number.base': 'Tiền dịch vụ phải là số',
            'number.min': 'Tiền dịch vụ phải lớn hơn hoặc bằng 0',
            'any.required': 'Tiền dịch vụ là bắt buộc',
        }),
        description: Joi.string().allow('').max(1000).trim().messages({
            'string.base': 'Mô tả phải là chuỗi',
            'string.max': 'Mô tả không được vượt quá 1000 ký tự',
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
        serviceName: Joi.string().min(2).max(200).trim().messages({
            'string.base': 'Tên dịch vụ phải là chuỗi',
            'string.min': 'Tên dịch vụ phải có ít nhất 2 ký tự',
            'string.max': 'Tên dịch vụ không được vượt quá 200 ký tự',
        }),
        amount: Joi.number().min(0).messages({
            'number.base': 'Tiền dịch vụ phải là số',
            'number.min': 'Tiền dịch vụ phải lớn hơn hoặc bằng 0',
        }),
        description: Joi.string().allow('').max(1000).trim().messages({
            'string.base': 'Mô tả phải là chuỗi',
            'string.max': 'Mô tả không được vượt quá 1000 ký tự',
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

export const schoolServiceChargeValidation = {
    createNew,
    update,
};
