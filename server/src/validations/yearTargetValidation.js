// server/src/validations/yearTargetValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const targetSchema = Joi.object({
    _id: Joi.string().optional(), // ✅ Cho phép _id
    code: Joi.string().required().messages({
        'string.empty': 'Mã mục tiêu không được để trống',
    }),
    content: Joi.string().required().messages({
        'string.empty': 'Nội dung mục tiêu không được để trống',
    }),
});

const expectedResultSchema = Joi.object({
    _id: Joi.string().optional(), // ✅ Cho phép _id
    code: Joi.string().required().messages({
        'string.empty': 'Mã kết quả mong đợi không được để trống',
    }),
    description: Joi.string().required().messages({
        'string.empty': 'Mô tả kết quả mong đợi không được để trống',
    }),
    targets: Joi.array().items(targetSchema).default([]),
});

const subFieldSchema = Joi.object({
    _id: Joi.string().optional(), // ✅ Cho phép _id
    code: Joi.string().required().messages({
        'string.empty': 'Mã lĩnh vực con không được để trống',
    }),
    name: Joi.string().required().messages({
        'string.empty': 'Tên lĩnh vực con không được để trống',
    }),
    expectedResults: Joi.array().items(expectedResultSchema).default([]),
});

const mainFieldSchema = Joi.object({
    _id: Joi.string().optional(), // ✅ Cho phép _id
    code: Joi.string().required().messages({
        'string.empty': 'Mã lĩnh vực chính không được để trống',
    }),
    name: Joi.string().required().messages({
        'string.empty': 'Tên lĩnh vực chính không được để trống',
    }),
    subFields: Joi.array().items(subFieldSchema).default([]),
    expectedResults: Joi.array().items(expectedResultSchema).default([]),
});

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        ageGroup: Joi.string()
            .required()
            .valid(
                'Nhà trẻ 3-12 tháng',
                'Nhà trẻ 12-24 tháng',
                'Nhà trẻ 24-36 tháng',
                'Khối mầm 3-4 tuổi',
                'Khối chồi 4-5 tuổi',
                'Khối lá 5-6 tuổi',
            )
            .messages({
                'any.required': 'Nhóm tuổi là bắt buộc',
                'any.only': 'Nhóm tuổi không hợp lệ',
            }),
        mainFields: Joi.array().items(mainFieldSchema).min(1).required().messages({
            'array.min': 'Phải có ít nhất 1 lĩnh vực phát triển chính',
            'any.required': 'Lĩnh vực phát triển chính là bắt buộc',
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
        ageGroup: Joi.string().valid(
            'Nhà trẻ 3-12 tháng',
            'Nhà trẻ 12-24 tháng',
            'Nhà trẻ 24-36 tháng',
            'Khối mầm 3-4 tuổi',
            'Khối chồi 4-5 tuổi',
            'Khối lá 5-6 tuổi',
        ),
        mainFields: Joi.array().items(mainFieldSchema).min(1),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const yearTargetValidation = { createNew, update };