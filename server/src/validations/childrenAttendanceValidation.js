import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

const ALLOWED_STATUSES = ['Có mặt', 'Vắng có phép', 'Vắng không phép', 'Chưa điểm danh'];

const bulkAttendance = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
        classId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
        date: Joi.date().iso().required().messages({ 'date.base': 'Ngày điểm danh không hợp lệ' }),
        items: Joi.array()
            .items(
                Joi.object({
                    studentId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
                    status: Joi.string()
                        .valid(...ALLOWED_STATUSES)
                        .required(),
                    note: Joi.string().allow('').optional(),
                }),
            )
            .min(1)
            .required(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const message = error.details.map((d) => d.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message));
    }
};

const updateAttendance = async (req, res, next) => {
    const schema = Joi.object({
        status: Joi.string()
            .valid(...ALLOWED_STATUSES)
            .optional(),
        note: Joi.string().allow('').optional(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const message = error.details.map((d) => d.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message));
    }
};

export const childrenAttendanceValidation = {
    bulkAttendance,
    updateAttendance,
};
