// server/src/validations/nutritionalStandardValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const plgStructureSchema = Joi.object({
    proteinMin: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Protein tối thiểu phải là số',
        'number.min': 'Tỷ lệ Protein tối thiểu phải lớn hơn 0',
        'number.max': 'Tỷ lệ Protein tối thiểu không được vượt quá 100',
        'number.integer': 'Tỷ lệ Protein tối thiểu phải là số nguyên',
        'any.required': 'Tỷ lệ Protein tối thiểu là bắt buộc',
    }),
    proteinMax: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Protein tối đa phải là số',
        'number.min': 'Tỷ lệ Protein tối đa phải lớn hơn 0',
        'number.max': 'Tỷ lệ Protein tối đa không được vượt quá 100',
        'number.integer': 'Tỷ lệ Protein tối đa phải là số nguyên',
        'any.required': 'Tỷ lệ Protein tối đa là bắt buộc',
    }),
    lipidMin: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Lipid tối thiểu phải là số',
        'number.min': 'Tỷ lệ Lipid tối thiểu phải lớn hơn 0',
        'number.max': 'Tỷ lệ Lipid tối thiểu không được vượt quá 100',
        'number.integer': 'Tỷ lệ Lipid tối thiểu phải là số nguyên',
        'any.required': 'Tỷ lệ Lipid tối thiểu là bắt buộc',
    }),
    lipidMax: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Lipid tối đa phải là số',
        'number.min': 'Tỷ lệ Lipid tối đa phải lớn hơn 0',
        'number.max': 'Tỷ lệ Lipid tối đa không được vượt quá 100',
        'number.integer': 'Tỷ lệ Lipid tối đa phải là số nguyên',
        'any.required': 'Tỷ lệ Lipid tối đa là bắt buộc',
    }),
    glucidMin: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Glucid tối thiểu phải là số',
        'number.min': 'Tỷ lệ Glucid tối thiểu phải lớn hơn 0',
        'number.max': 'Tỷ lệ Glucid tối thiểu không được vượt quá 100',
        'number.integer': 'Tỷ lệ Glucid tối thiểu phải là số nguyên',
        'any.required': 'Tỷ lệ Glucid tối thiểu là bắt buộc',
    }),
    glucidMax: Joi.number().required().min(1).max(100).integer().messages({
        'number.base': 'Tỷ lệ Glucid tối đa phải là số',
        'number.min': 'Tỷ lệ Glucid tối đa phải lớn hơn 0',
        'number.max': 'Tỷ lệ Glucid tối đa không được vượt quá 100',
        'number.integer': 'Tỷ lệ Glucid tối đa phải là số nguyên',
        'any.required': 'Tỷ lệ Glucid tối đa là bắt buộc',
    }),
});

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        ageGroup: Joi.string()
            .required()
            .valid('Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)')
            .messages({
                'any.required': 'Tên nhóm trẻ là bắt buộc',
                'any.only': 'Nhóm trẻ không hợp lệ',
            }),
        plgStructure: plgStructureSchema.required().messages({
            'any.required': 'Cơ cấu PLG chuẩn là bắt buộc',
        }),
        protein: Joi.number().required().min(0.001).messages({
            'number.base': 'Protein Đạm phải là số',
            'number.min': 'Protein Đạm phải lớn hơn 0',
            'any.required': 'Protein Đạm là bắt buộc',
        }),
        lipid: Joi.number().required().min(0.001).messages({
            'number.base': 'Lipid Béo phải là số',
            'number.min': 'Lipid Béo phải lớn hơn 0',
            'any.required': 'Lipid Béo là bắt buộc',
        }),
        glucid: Joi.number().required().min(0.001).messages({
            'number.base': 'Glucid Đường phải là số',
            'number.min': 'Glucid Đường phải lớn hơn 0',
            'any.required': 'Glucid Đường là bắt buộc',
        }),
        recommendedCaloriesMin: Joi.number().required().min(0).integer().messages({
            'number.base': 'Năng lượng khuyến nghị tối thiểu phải là số',
            'number.min': 'Năng lượng khuyến nghị tối thiểu phải lớn hơn 0',
            'number.integer': 'Năng lượng khuyến nghị tối thiểu phải là số nguyên',
            'any.required': 'Năng lượng khuyến nghị tối thiểu là bắt buộc',
        }),
        recommendedCaloriesMax: Joi.number().required().min(0).integer().messages({
            'number.base': 'Năng lượng khuyến nghị tối đa phải là số',
            'number.min': 'Năng lượng khuyến nghị tối đa phải lớn hơn 0',
            'number.integer': 'Năng lượng khuyến nghị tối đa phải là số nguyên',
            'any.required': 'Năng lượng khuyến nghị tối đa là bắt buộc',
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
        ageGroup: Joi.string().valid('Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)').messages({
            'any.only': 'Nhóm trẻ không hợp lệ',
        }),
        plgStructure: plgStructureSchema,
        protein: Joi.number().min(0.001).messages({
            'number.base': 'Protein Đạm phải là số',
            'number.min': 'Protein Đạm phải lớn hơn 0',
        }),
        lipid: Joi.number().min(0.001).messages({
            'number.base': 'Lipid Béo phải là số',
            'number.min': 'Lipid Béo phải lớn hơn 0',
        }),
        glucid: Joi.number().min(0.001).messages({
            'number.base': 'Glucid Đường phải là số',
            'number.min': 'Glucid Đường phải lớn hơn 0',
        }),
        recommendedCaloriesMin: Joi.number().min(0).integer().messages({
            'number.base': 'Năng lượng khuyến nghị tối thiểu phải là số',
            'number.min': 'Năng lượng khuyến nghị tối thiểu phải lớn hơn 0',
            'number.integer': 'Năng lượng khuyến nghị tối thiểu phải là số nguyên',
        }),
        recommendedCaloriesMax: Joi.number().min(0).integer().messages({
            'number.base': 'Năng lượng khuyến nghị tối đa phải là số',
            'number.min': 'Năng lượng khuyến nghị tối đa phải lớn hơn 0',
            'number.integer': 'Năng lượng khuyến nghị tối đa phải là số nguyên',
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

export const nutritionalStandardValidation = {
    createNew,
    update,
};
