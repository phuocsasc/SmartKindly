import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required().messages({
            'any.required': 'Năm học là bắt buộc',
            'string.pattern.base': 'ID năm học không hợp lệ',
        }),
        name: Joi.string()
            .valid('Cán bộ quản lý', 'Tổ cấp dưỡng', 'Tổ Văn Phòng', 'Khối Nhà Trẻ', 'Khối Mầm', 'Khối Chồi', 'Khối Lá')
            .required()
            .messages({
                'any.required': 'Tên tổ bộ môn là bắt buộc',
                'any.only': 'Tên tổ bộ môn không hợp lệ',
            }),
        managers: Joi.array()
            .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
            .min(1)
            .required()
            .messages({
                'array.min': 'Phải có ít nhất 1 cán bộ quản lý',
                'any.required': 'Danh sách cán bộ quản lý là bắt buộc',
            }),
        note: Joi.string().min(3).max(200).trim().allow('', null).messages({
            'string.min': 'Ghi chú phải có ít nhất 3 ký tự',
            'string.max': 'Ghi chú không được vượt quá 200 ký tự',
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
        name: Joi.string()
            .valid('Cán bộ quản lý', 'Tổ cấp dưỡng', 'Tổ Văn Phòng', 'Khối Nhà Trẻ', 'Khối Mầm', 'Khối Chồi', 'Khối Lá')
            .messages({
                'any.only': 'Tên tổ bộ môn không hợp lệ',
            }),
        managers: Joi.array()
            .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
            .min(1)
            .messages({
                'array.min': 'Phải có ít nhất 1 cán bộ quản lý',
            }),
        note: Joi.string().min(3).max(200).trim().allow('', null).messages({
            'string.min': 'Ghi chú phải có ít nhất 3 ký tự',
            'string.max': 'Ghi chú không được vượt quá 200 ký tự',
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

export const departmentValidation = { createNew, update };
