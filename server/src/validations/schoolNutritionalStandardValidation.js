// server/src/validations/schoolNutritionalStandardValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const plgStructureSchema = Joi.object({
    _id: Joi.string().optional(),
    protein: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Protein phải là số',
        'number.min': 'Tỷ lệ Protein phải lớn hơn 0',
        'number.max': 'Tỷ lệ Protein không được vượt quá 100',
        'number.integer': 'Tỷ lệ Protein phải là số nguyên',
        'any.required': 'Tỷ lệ Protein là bắt buộc',
    }),
    lipid: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Lipid phải là số',
        'number.min': 'Tỷ lệ Lipid phải lớn hơn 0',
        'number.max': 'Tỷ lệ Lipid không được vượt quá 100',
        'number.integer': 'Tỷ lệ Lipid phải là số nguyên',
        'any.required': 'Tỷ lệ Lipid là bắt buộc',
    }),
    glucid: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Glucid phải là số',
        'number.min': 'Tỷ lệ Glucid phải lớn hơn 0',
        'number.max': 'Tỷ lệ Glucid không được vượt quá 100',
        'number.integer': 'Tỷ lệ Glucid phải là số nguyên',
        'any.required': 'Tỷ lệ Glucid là bắt buộc',
    }),
    isSelected: Joi.boolean().default(false),
});

const update = async (req, res, next) => {
    const schema = Joi.object({
        plgStructures: Joi.array().items(plgStructureSchema).min(1).messages({
            'array.min': 'Phải có ít nhất 1 cơ cấu PLG chuẩn',
        }),
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

export const schoolNutritionalStandardValidation = {
    update,
};
