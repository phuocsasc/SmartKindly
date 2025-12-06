// server/src/validations/scheduleValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const activityPeriodSchema = Joi.object({
    _id: Joi.string().optional(),
    startTime: Joi.string()
        .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Thời gian bắt đầu phải có định dạng HH:mm (ví dụ: 07:30)',
            'any.required': 'Thời gian bắt đầu là bắt buộc',
        }),
    endTime: Joi.string()
        .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
        .required()
        .messages({
            'string.pattern.base': 'Thời gian kết thúc phải có định dạng HH:mm (ví dụ: 08:00)',
            'any.required': 'Thời gian kết thúc là bắt buộc',
        }),
    description: Joi.string().trim().required().messages({
        'any.required': 'Mô tả hoạt động là bắt buộc',
        'string.empty': 'Mô tả hoạt động không được để trống',
    }),
    order: Joi.number().integer().min(1).required(),
});

const updateActivityPeriods = async (req, res, next) => {
    const correctCondition = Joi.object({
        // ✅ Bỏ weekNumber vì áp dụng cho tất cả tuần
        activityPeriods: Joi.array().items(activityPeriodSchema).min(1).required().messages({
            'array.min': 'Phải có ít nhất 1 mốc hoạt động',
            'any.required': 'Danh sách mốc hoạt động là bắt buộc',
        }),
    });

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false });

        // ✅ Validate thời gian liên tiếp
        const { activityPeriods } = req.body;
        for (let i = 0; i < activityPeriods.length - 1; i++) {
            const current = activityPeriods[i];
            const next = activityPeriods[i + 1];

            if (current.endTime !== next.startTime) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Thời gian kết thúc của mốc ${i + 1} (${current.endTime}) phải bằng thời gian bắt đầu của mốc ${i + 2} (${next.startTime})`,
                );
            }
        }

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
        } else {
            const errorMessage = error.details?.map((detail) => detail.message).join(', ') || error.message;
            next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
        }
    }
};

const initializeSchedule = async (req, res, next) => {
    const correctCondition = Joi.object({
        academicYearId: Joi.string().required().messages({
            'any.required': 'Năm học là bắt buộc',
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

export const scheduleValidation = {
    updateActivityPeriods,
    initializeSchedule,
};
