import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
const AGE_GROUPS = ['Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)'];

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        ageGroup: Joi.string()
            .valid(...AGE_GROUPS)
            .required()
            .messages({
                'any.required': 'Nhóm trẻ áp dụng thực đơn là bắt buộc',
                'any.only': 'Nhóm trẻ không hợp lệ',
            }),
        weekNumber: Joi.number().integer().min(1).required().messages({
            'any.required': 'Tuần trong năm học là bắt buộc',
            'number.base': 'Tuần phải là số',
            'number.min': 'Tuần phải lớn hơn 0',
        }),
        dayOfWeek: Joi.string()
            .valid(...DAYS_OF_WEEK)
            .required()
            .messages({
                'any.required': 'Ngày trong tuần là bắt buộc',
                'any.only': 'Ngày trong tuần không hợp lệ (chỉ được chọn từ Thứ 2 đến Thứ 6)',
            }),
        menuId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Thực đơn áp dụng là bắt buộc',
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
        ageGroup: Joi.string()
            .valid(...AGE_GROUPS)
            .messages({
                'any.only': 'Nhóm trẻ không hợp lệ',
            }),
        weekNumber: Joi.number().integer().min(1).messages({
            'number.base': 'Tuần phải là số',
            'number.min': 'Tuần phải lớn hơn 0',
        }),
        dayOfWeek: Joi.string()
            .valid(...DAYS_OF_WEEK)
            .messages({
                'any.only': 'Ngày trong tuần không hợp lệ (chỉ được chọn từ Thứ 2 đến Thứ 6)',
            }),
        menuId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    })
        .min(1)
        .messages({
            'object.min': 'Phải có ít nhất 1 trường để cập nhật',
        });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const schoolMenuApplyValidation = {
    createNew,
    update,
};
