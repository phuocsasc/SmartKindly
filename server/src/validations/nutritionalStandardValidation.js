// server/src/validations/nutritionalStandardValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const plgStructureSchema = Joi.object({
    _id: Joi.string().optional(), // ✅ CHO PHÉP _id (MongoDB tự generate)
    protein: Joi.number().required().min(0.001).max(100).messages({
        'number.base': 'Tỷ lệ Protein phải là số',
        'number.min': 'Tỷ lệ Protein phải lớn hơn 0',
        'number.max': 'Tỷ lệ Protein không được vượt quá 100',
        'any.required': 'Tỷ lệ Protein là bắt buộc',
    }),
    lipid: Joi.number().required().min(0.001).max(100).messages({
        'number.base': 'Tỷ lệ Lipid phải là số',
        'number.min': 'Tỷ lệ Lipid phải lớn hơn 0',
        'number.max': 'Tỷ lệ Lipid không được vượt quá 100',
        'any.required': 'Tỷ lệ Lipid là bắt buộc',
    }),
    glucid: Joi.number().required().min(0.001).max(100).messages({
        'number.base': 'Tỷ lệ Glucid phải là số',
        'number.min': 'Tỷ lệ Glucid phải lớn hơn 0',
        'number.max': 'Tỷ lệ Glucid không được vượt quá 100',
        'any.required': 'Tỷ lệ Glucid là bắt buộc',
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
        plgStructures: Joi.array().items(plgStructureSchema).min(1).required().messages({
            'array.min': 'Phải có ít nhất 1 cơ cấu PLG chuẩn',
            'any.required': 'Cơ cấu PLG chuẩn là bắt buộc',
        }),
        proteinAnimal: Joi.number().required().min(0.001).messages({
            'number.base': 'Protein Đạm động vật phải là số',
            'number.min': 'Protein Đạm động vật phải lớn hơn 0',
            'any.required': 'Protein Đạm động vật là bắt buộc',
        }),
        proteinPlant: Joi.number().required().min(0.001).messages({
            'number.base': 'Protein Đạm thực vật phải là số',
            'number.min': 'Protein Đạm thực vật phải lớn hơn 0',
            'any.required': 'Protein Đạm thực vật là bắt buộc',
        }),
        lipidAnimal: Joi.number().required().min(0.001).messages({
            'number.base': 'Lipid Béo động vật phải là số',
            'number.min': 'Lipid Béo động vật phải lớn hơn 0',
            'any.required': 'Lipid Béo động vật là bắt buộc',
        }),
        lipidPlant: Joi.number().required().min(0.001).messages({
            'number.base': 'Lipid Béo thực vật phải là số',
            'number.min': 'Lipid Béo thực vật phải lớn hơn 0',
            'any.required': 'Lipid Béo thực vật là bắt buộc',
        }),
        glucid: Joi.number().required().min(0.001).messages({
            'number.base': 'Glucid Đường phải là số',
            'number.min': 'Glucid Đường phải lớn hơn 0',
            'any.required': 'Glucid Đường là bắt buộc',
        }),
        recommendedCaloriesMin: Joi.number().required().min(0).messages({
            'number.base': 'Năng lượng khuyến nghị tối thiểu phải là số',
            'number.min': 'Năng lượng khuyến nghị tối thiểu phải lớn hơn 0',
            'any.required': 'Năng lượng khuyến nghị tối thiểu là bắt buộc',
        }),
        recommendedCaloriesMax: Joi.number().required().min(0).messages({
            'number.base': 'Năng lượng khuyến nghị tối đa phải là số',
            'number.min': 'Năng lượng khuyến nghị tối đa phải lớn hơn 0',
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
        plgStructures: Joi.array().items(plgStructureSchema).min(1).messages({
            'array.min': 'Phải có ít nhất 1 cơ cấu PLG chuẩn',
        }),
        proteinAnimal: Joi.number().min(0.001).messages({
            'number.base': 'Protein Đạm động vật phải là số',
            'number.min': 'Protein Đạm động vật phải lớn hơn 0',
        }),
        proteinPlant: Joi.number().min(0.001).messages({
            'number.base': 'Protein Đạm thực vật phải là số',
            'number.min': 'Protein Đạm thực vật phải lớn hơn 0',
        }),
        lipidAnimal: Joi.number().min(0.001).messages({
            'number.base': 'Lipid Béo động vật phải là số',
            'number.min': 'Lipid Béo động vật phải lớn hơn 0',
        }),
        lipidPlant: Joi.number().min(0.001).messages({
            'number.base': 'Lipid Béo thực vật phải là số',
            'number.min': 'Lipid Béo thực vật phải lớn hơn 0',
        }),
        glucid: Joi.number().min(0.001).messages({
            'number.base': 'Glucid Đường phải là số',
            'number.min': 'Glucid Đường phải lớn hơn 0',
        }),
        recommendedCaloriesMin: Joi.number().min(0).messages({
            'number.base': 'Năng lượng khuyến nghị tối thiểu phải là số',
            'number.min': 'Năng lượng khuyến nghị tối thiểu phải lớn hơn 0',
        }),
        recommendedCaloriesMax: Joi.number().min(0).messages({
            'number.base': 'Năng lượng khuyến nghị tối đa phải là số',
            'number.min': 'Năng lượng khuyến nghị tối đa phải lớn hơn 0',
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

export const nutritionalStandardValidation = {
    createNew,
    update,
};
