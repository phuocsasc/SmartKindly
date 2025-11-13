// server/src/validations/weeklyPlanValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const dailyActivityDetailSchema = Joi.object({
    _id: Joi.string().optional(),
    activityPeriodId: Joi.string().required().messages({
        'any.required': 'ID mốc hoạt động là bắt buộc',
    }),
    startTime: Joi.string().required().messages({
        'any.required': 'Thời gian bắt đầu là bắt buộc',
    }),
    endTime: Joi.string().required().messages({
        'any.required': 'Thời gian kết thúc là bắt buộc',
    }),
    description: Joi.string().required().messages({
        'any.required': 'Mô tả mốc hoạt động là bắt buộc',
    }),
    detailedContent: Joi.string().allow('').optional(),
});

const updateWeeklyPlan = async (req, res, next) => {
    const correctCondition = Joi.object({
        classId: Joi.string().required().messages({
            'any.required': 'Lớp học là bắt buộc',
        }),
        weekNumber: Joi.number().integer().min(1).required().messages({
            'any.required': 'Số tuần là bắt buộc',
            'number.min': 'Số tuần phải lớn hơn 0',
        }),
        dayOfWeek: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday').required().messages({
            'any.required': 'Ngày trong tuần là bắt buộc',
            'any.only': 'Ngày trong tuần không hợp lệ',
        }),
        activities: Joi.array().items(dailyActivityDetailSchema).min(1).required().messages({
            'array.min': 'Phải có ít nhất 1 hoạt động',
            'any.required': 'Danh sách hoạt động là bắt buộc',
        }),
    });

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errorMessage = error.details?.map((detail) => detail.message).join(', ') || error.message;
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const weeklyPlanValidation = {
    updateWeeklyPlan,
};
