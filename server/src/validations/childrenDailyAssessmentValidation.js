// server/src/validations/childrenDailyAssessmentValidation.js

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
        classId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
            'any.required': 'Lớp học là bắt buộc',
            'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
        }),
        studentId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
            'any.required': 'Học sinh là bắt buộc',
            'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
        }),
        date: Joi.date().required().messages({
            'any.required': 'Ngày đánh giá là bắt buộc',
            'date.base': 'Ngày đánh giá không hợp lệ',
        }),
        healthStatus: Joi.string().required().messages({
            'any.required': 'Tình trạng sức khỏe là bắt buộc',
            'string.empty': 'Tình trạng sức khỏe không được để trống',
        }),
        emotionalBehavior: Joi.string().required().messages({
            'any.required': 'Trạng thái cảm xúc, thái độ hành vi là bắt buộc',
            'string.empty': 'Trạng thái cảm xúc, thái độ hành vi không được để trống',
        }),
        skillsKnowledge: Joi.string().required().messages({
            'any.required': 'Kiến thức kỹ năng là bắt buộc',
            'string.empty': 'Kiến thức kỹ năng không được để trống',
        }),
        notes: Joi.string().allow('', null).optional(),
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
        healthStatus: Joi.string().optional().messages({
            'string.empty': 'Tình trạng sức khỏe không được để trống',
        }),
        emotionalBehavior: Joi.string().optional().messages({
            'string.empty': 'Trạng thái cảm xúc, thái độ hành vi không được để trống',
        }),
        skillsKnowledge: Joi.string().optional().messages({
            'string.empty': 'Kiến thức kỹ năng không được để trống',
        }),
        notes: Joi.string().allow('', null).optional(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: true });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const childrenDailyAssessmentValidation = {
    createNew,
    update,
};
