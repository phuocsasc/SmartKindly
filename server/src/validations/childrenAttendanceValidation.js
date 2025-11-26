import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const bulkAttendance = async (req, res, next) => {
    const schema = Joi.object({
        classId: Joi.string().required().messages({
            'any.required': 'Lớp học là bắt buộc',
            'string.empty': 'Lớp học không được để trống',
        }),
        date: Joi.date().required().messages({
            'any.required': 'Ngày điểm danh là bắt buộc',
            'date.base': 'Ngày điểm danh không hợp lệ',
        }),
        attendances: Joi.array()
            .items(
                Joi.object({
                    studentId: Joi.string().required(),
                    status: Joi.string()
                        .valid('Có mặt', 'Vắng có phép', 'Vắng không phép', 'Đi trễ', 'Chưa điểm danh')
                        .required(),
                    note: Joi.string().allow('').optional(),
                }),
            )
            .min(1)
            .required()
            .messages({
                'array.min': 'Phải có ít nhất 1 học sinh để điểm danh',
                'any.required': 'Danh sách điểm danh là bắt buộc',
            }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errors = error.details.map((detail) => detail.message);
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errors.join(', ')));
    }
};

const updateAttendance = async (req, res, next) => {
    const schema = Joi.object({
        status: Joi.string().valid('Có mặt', 'Vắng có phép', 'Vắng không phép', 'Đi trễ', 'Chưa điểm danh').optional(),
        note: Joi.string().allow('').optional(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errors = error.details.map((detail) => detail.message);
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errors.join(', ')));
    }
};

export const childrenAttendanceValidation = {
    bulkAttendance,
    updateAttendance,
};
