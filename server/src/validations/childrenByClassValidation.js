import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

/**
 * ✅ Validation: Thêm trẻ vào lớp
 */
const addStudentsToClass = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Năm học là bắt buộc',
        }),
        classId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Lớp học là bắt buộc',
        }),
        studentIds: Joi.array()
            .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
            .min(1)
            .required()
            .messages({
                'array.min': 'Phải chọn ít nhất 1 học sinh',
                'any.required': 'Danh sách học sinh là bắt buộc',
            }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

/**
 * ✅ Validation: Chuyển lớp cho trẻ
 */
const transferStudents = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Năm học là bắt buộc',
        }),
        fromClassId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Lớp cũ là bắt buộc',
        }),
        toClassId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Lớp mới là bắt buộc',
        }),
        studentIds: Joi.array()
            .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
            .min(1)
            .required()
            .messages({
                'array.min': 'Phải chọn ít nhất 1 học sinh',
                'any.required': 'Danh sách học sinh là bắt buộc',
            }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};
/**
 * ✅ Validation: Xóa nhiều học sinh ra khỏi lớp
 */
const removeStudentsFromClass = async (req, res, next) => {
    const schema = Joi.object({
        ids: Joi.array()
            .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
            .min(1)
            .required()
            .messages({
                'array.min': 'Phải chọn ít nhất 1 học sinh',
                'any.required': 'Danh sách học sinh là bắt buộc',
            }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const childrenByClassValidation = {
    addStudentsToClass,
    transferStudents,
    removeStudentsFromClass,
};
