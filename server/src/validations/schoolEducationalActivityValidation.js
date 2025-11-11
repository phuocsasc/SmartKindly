// server/src/validations/schoolEducationalActivityValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
            'any.required': 'Năm học là bắt buộc',
            'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
        }),
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
        schoolYearTargetId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
            'any.required': 'School Year Target ID là bắt buộc',
            'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
        }),
        mainFieldCode: Joi.string().required().messages({
            'any.required': 'Mã lĩnh vực chính là bắt buộc',
        }),
        subFieldCode: Joi.string().allow(null, '').optional(),
        expectedResultCode: Joi.string().required().messages({
            'any.required': 'Mã kết quả mong đợi là bắt buộc',
        }),
        targetCode: Joi.string().required().messages({
            'any.required': 'Mã mục tiêu là bắt buộc',
        }),
        activityContent: Joi.string().required().messages({
            'any.required': 'Nội dung hoạt động giáo dục là bắt buộc',
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

const update = async (req, res, next) => {
    const schema = Joi.object({
        activityContent: Joi.string().required().messages({
            'any.required': 'Nội dung hoạt động giáo dục là bắt buộc',
            'string.empty': 'Nội dung hoạt động giáo dục không được để trống',
        }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: true });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const schoolEducationalActivityValidation = {
    createNew,
    update,
};
