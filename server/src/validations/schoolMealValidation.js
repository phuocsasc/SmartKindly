// server/src/validations/schoolMealValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required().min(2).max(200).trim().messages({
            'string.empty': 'Tên món ăn không được để trống',
            'string.min': 'Tên món ăn phải có ít nhất 2 ký tự',
            'string.max': 'Tên món ăn không được vượt quá 200 ký tự',
            'any.required': 'Tên món ăn là bắt buộc',
        }),
        mealType: Joi.string()
            .required()
            .valid(
                'Món kho',
                'Món luộc',
                'Món canh',
                'Món mặn',
                'Món xào',
                'Món xế',
                'Soup',
                'Lẩu',
                'Món bánh',
                'Tráng miệng',
            )
            .messages({
                'any.required': 'Loại món ăn là bắt buộc',
                'any.only': 'Loại món ăn không hợp lệ',
            }),
        ingredients: Joi.array()
            .items(
                Joi.object({
                    foodId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
                        'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
                        'any.required': 'Food ID là bắt buộc',
                    }),
                    quantityPerChildGram: Joi.number().required().min(0.001).messages({
                        'number.base': 'Lượng ăn phải là số',
                        'number.min': 'Lượng ăn phải lớn hơn 0',
                        'any.required': 'Lượng ăn của 1 trẻ (g) là bắt buộc',
                    }),
                    isMainFood: Joi.boolean().default(false),
                }),
            )
            .min(1)
            .required()
            .messages({
                'array.min': 'Phải có ít nhất 1 nguyên liệu',
                'any.required': 'Danh sách nguyên liệu là bắt buộc',
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
        name: Joi.string().min(2).max(200).trim().messages({
            'string.min': 'Tên món ăn phải có ít nhất 2 ký tự',
            'string.max': 'Tên món ăn không được vượt quá 200 ký tự',
        }),
        mealType: Joi.string()
            .valid(
                'Món kho',
                'Món luộc',
                'Món canh',
                'Món mặn',
                'Món xào',
                'Món xế',
                'Soup',
                'Lẩu',
                'Món bánh',
                'Tráng miệng',
            )
            .messages({
                'any.only': 'Loại món ăn không hợp lệ',
            }),
        ingredients: Joi.array()
            .items(
                Joi.object({
                    foodId: Joi.string().pattern(OBJECT_ID_RULE).required().messages({
                        'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
                        'any.required': 'Food ID là bắt buộc',
                    }),
                    quantityPerChildGram: Joi.number().required().min(0.001).messages({
                        'number.base': 'Lượng ăn phải là số',
                        'number.min': 'Lượng ăn phải lớn hơn 0',
                        'any.required': 'Lượng ăn của 1 trẻ (g) là bắt buộc',
                    }),
                    isMainFood: Joi.boolean().default(false),
                }),
            )
            .min(1)
            .messages({
                'array.min': 'Phải có ít nhất 1 nguyên liệu',
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

export const schoolMealValidation = {
    createNew,
    update,
};
