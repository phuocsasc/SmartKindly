// server/src/validations/parentChildrenValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const updateChildrenInfo = async (req, res, next) => {
    const currentYear = new Date().getFullYear();

    const schema = Joi.object({
        // ✅ Thông tin gia đình - Mẹ (OPTIONAL)
        motherName: Joi.string().max(100).trim().allow('').messages({
            'string.max': 'Họ tên mẹ không được vượt quá 100 ký tự',
        }),
        motherBirthYear: Joi.number()
            .integer()
            .min(1940)
            .max(currentYear)
            .allow(null, '')
            .messages({
                'number.base': 'Năm sinh mẹ phải là số',
                'number.integer': 'Năm sinh mẹ phải là số nguyên',
                'number.min': 'Năm sinh mẹ phải từ năm 1940',
                'number.max': `Năm sinh mẹ không được vượt quá ${currentYear}`,
            }),
        motherPhone: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .allow('')
            .messages({
                'string.pattern.base': 'Số điện thoại mẹ phải có đúng 10 chữ số',
            }),
        motherEmail: Joi.string().email().allow('').messages({
            'string.email': 'Email mẹ không hợp lệ',
        }),

        // ✅ Thông tin gia đình - Bố (OPTIONAL)
        fatherName: Joi.string().max(100).trim().allow('').messages({
            'string.max': 'Họ tên bố không được vượt quá 100 ký tự',
        }),
        fatherBirthYear: Joi.number()
            .integer()
            .min(1940)
            .max(currentYear)
            .allow(null, '')
            .messages({
                'number.base': 'Năm sinh bố phải là số',
                'number.integer': 'Năm sinh bố phải là số nguyên',
                'number.min': 'Năm sinh bố phải từ năm 1940',
                'number.max': `Năm sinh bố không được vượt quá ${currentYear}`,
            }),
        fatherPhone: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .allow('')
            .messages({
                'string.pattern.base': 'Số điện thoại bố phải có đúng 10 chữ số',
            }),
        fatherEmail: Joi.string().email().allow('').messages({
            'string.email': 'Email bố không hợp lệ',
        }),

        // ✅ Thông tin địa chỉ (REQUIRED)
        permanentAddress: Joi.string().required().trim().max(300).messages({
            'string.empty': 'Địa chỉ thường trú không được để trống',
            'string.max': 'Địa chỉ thường trú không được vượt quá 300 ký tự',
            'any.required': 'Địa chỉ thường trú là bắt buộc',
        }),
        currentAddress: Joi.string().required().trim().max(300).messages({
            'string.empty': 'Địa chỉ hiện tại không được để trống',
            'string.max': 'Địa chỉ hiện tại không được vượt quá 300 ký tự',
            'any.required': 'Địa chỉ hiện tại là bắt buộc',
        }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: false });
        next();
    } catch (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const parentChildrenValidation = {
    updateChildrenInfo,
};
