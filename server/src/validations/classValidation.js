import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        grade: Joi.string().valid('Nhà trẻ', 'Mầm', 'Chồi', 'Lá').required().messages({
            'any.required': 'Khối là bắt buộc',
            'any.only': 'Khối không hợp lệ',
        }),
        ageGroup: Joi.string()
            .valid('3-12 tháng', '13-24 tháng', '25-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi')
            .required()
            .messages({
                'any.required': 'Nhóm lớp là bắt buộc',
                'any.only': 'Nhóm lớp không hợp lệ',
            }),
        name: Joi.string().required().min(2).max(100).trim().messages({
            'string.empty': 'Tên lớp không được để trống',
            'string.min': 'Tên lớp phải có ít nhất 2 ký tự',
            'string.max': 'Tên lớp không được vượt quá 100 ký tự',
            'any.required': 'Tên lớp là bắt buộc',
        }),
        homeRoomTeacher: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Giáo viên chủ nhiệm là bắt buộc',
            'string.pattern.base': 'ID giáo viên không hợp lệ',
        }),
        description: Joi.string().max(500).trim().allow('', null).messages({
            'string.max': 'Mô tả không được vượt quá 500 ký tự',
        }),
        sessions: Joi.object({
            morning: Joi.boolean().required(),
            afternoon: Joi.boolean().required(),
            evening: Joi.boolean().required(),
        })
            .required()
            .messages({
                'any.required': 'Thông tin buổi học là bắt buộc',
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
        grade: Joi.string().valid('Nhà trẻ', 'Mầm', 'Chồi', 'Lá').messages({
            'any.only': 'Khối không hợp lệ',
        }),
        ageGroup: Joi.string()
            .valid('3-12 tháng', '13-24 tháng', '25-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi')
            .messages({
                'any.only': 'Nhóm lớp không hợp lệ',
            }),
        name: Joi.string().min(2).max(100).trim().messages({
            'string.min': 'Tên lớp phải có ít nhất 2 ký tự',
            'string.max': 'Tên lớp không được vượt quá 100 ký tự',
        }),
        homeRoomTeacher: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).messages({
            'string.pattern.base': 'ID giáo viên không hợp lệ',
        }),
        description: Joi.string().max(500).trim().allow('', null).messages({
            'string.max': 'Mô tả không được vượt quá 500 ký tự',
        }),
        sessions: Joi.object({
            morning: Joi.boolean(),
            afternoon: Joi.boolean(),
            evening: Joi.boolean(),
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

export const classValidation = { createNew, update };
