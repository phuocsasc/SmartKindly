// server/src/validations/educationalActivityValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        ageGroup: Joi.string()
            .required()
            .valid(
                'Nhà trẻ 3-12 tháng',
                'Nhà trẻ 12-24 tháng',
                'Nhà trẻ 24-36 tháng',
                'Khối mầm 3-4 tuổi',
                'Khối chồi 4-5 tuổi',
                'Khối lá 5-6 tuổi',
            )
            .messages({
                'any.required': 'Nhóm tuổi là bắt buộc',
                'any.only': 'Nhóm tuổi không hợp lệ',
            }),
        yearTargetId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Mục tiêu năm học là bắt buộc',
        }),
        mainFieldCode: Joi.string().required().messages({
            'string.empty': 'Mã lĩnh vực chính không được để trống',
            'any.required': 'Mã lĩnh vực chính là bắt buộc',
        }),
        subFieldCode: Joi.string().allow(null, ''),
        expectedResultCode: Joi.string().required().messages({
            'string.empty': 'Mã kết quả mong đợi không được để trống',
            'any.required': 'Mã kết quả mong đợi là bắt buộc',
        }),
        // ✅ NEW: Required targetId
        targetId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
            'any.required': 'Target ID là bắt buộc',
            'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
        }),
        // ✅ Optional targetCode (auto-filled by backend)
        targetCode: Joi.string().optional().messages({
            'string.empty': 'Mã mục tiêu không được để trống',
        }),
        activityContent: Joi.string().required().trim().messages({
            'string.empty': 'Nội dung hoạt động giáo dục không được để trống',
            'any.required': 'Nội dung hoạt động giáo dục là bắt buộc',
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
        activityContent: Joi.string().trim().messages({
            'string.empty': 'Nội dung hoạt động giáo dục không được để trống',
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

export const educationalActivityValidation = { createNew, update };
