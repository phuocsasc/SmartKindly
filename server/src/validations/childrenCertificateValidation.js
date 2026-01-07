// server/src/validations/childrenCertificateValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

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
        weekNumber: Joi.number().integer().min(1).required().messages({
            'any.required': 'Số tuần là bắt buộc',
            'number.base': 'Số tuần phải là số',
            'number.integer': 'Số tuần phải là số nguyên',
            'number.min': 'Số tuần phải lớn hơn 0',
        }),
        isGoodChild: Joi.boolean().optional(),
        comment: Joi.string().required().messages({
            'any.required': 'Nhận xét là bắt buộc',
            'string.empty': 'Nhận xét không được để trống',
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

const update = async (req, res, next) => {
    const schema = Joi.object({
        isGoodChild: Joi.boolean().optional(),
        comment: Joi.string().optional().messages({
            'string.empty': 'Nhận xét không được để trống',
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

export const childrenCertificateValidation = {
    createNew,
    update,
};
