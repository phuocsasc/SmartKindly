// server/src/validations/foodValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required().min(2).max(200).trim().messages({
            'string.empty': 'Tên thực phẩm không được để trống',
            'string.min': 'Tên thực phẩm phải có ít nhất 2 ký tự',
            'string.max': 'Tên thực phẩm không được vượt quá 200 ký tự',
            'any.required': 'Tên thực phẩm là bắt buộc',
        }),
        unit: Joi.string()
            .valid('Kg', 'Hộp', 'Miếng', 'Lit', 'Quả', 'Trứng', 'Gram', 'Gói', 'Chai', 'Hũ', 'Cái', 'Ổ')
            .required()
            .messages({
                'any.required': 'Đơn vị tính là bắt buộc',
                'any.only': 'Đơn vị tính không hợp lệ',
            }),
        gramConversion: Joi.number().required().min(1).max(1000).messages({
            'number.base': 'Quy đổi sang gam phải là số',
            'number.min': 'Quy đổi sang gam phải từ 1 đến 1000',
            'number.max': 'Quy đổi sang gam phải từ 1 đến 1000',
            'any.required': 'Quy đổi sang gam là bắt buộc',
        }),
        categories: Joi.array()
            .items(Joi.string().valid('Động vật', 'Thực vật', 'Thực phẩm Khô', 'Thực phẩm tươi', 'Thực phẩm ăn liền'))
            .min(1)
            .required()
            .messages({
                'array.min': 'Phải chọn ít nhất 1 loại thực phẩm',
                'any.required': 'Loại thực phẩm là bắt buộc',
                'any.only': 'Loại thực phẩm không hợp lệ',
            }),
        wastePercentage: Joi.number().required().min(0).max(99).messages({
            'number.base': 'Hệ số thái bỏ phải là số',
            'number.min': 'Hệ số thái bỏ phải từ 0 đến 99',
            'number.max': 'Hệ số thái bỏ phải từ 0 đến 99',
            'any.required': 'Hệ số thái bỏ là bắt buộc',
        }),
        protein: Joi.number().required().min(0).messages({
            'number.base': 'Protein phải là số',
            'number.min': 'Protein phải lớn hơn hoặc bằng 0',
            'any.required': 'Protein là bắt buộc',
        }),
        lipid: Joi.number().required().min(0).messages({
            'number.base': 'Lipid phải là số',
            'number.min': 'Lipid phải lớn hơn hoặc bằng 0',
            'any.required': 'Lipid là bắt buộc',
        }),
        glucid: Joi.number().required().min(0).messages({
            'number.base': 'Glucid phải là số',
            'number.min': 'Glucid phải lớn hơn hoặc bằng 0',
            'any.required': 'Glucid là bắt buộc',
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
            'string.min': 'Tên thực phẩm phải có ít nhất 2 ký tự',
            'string.max': 'Tên thực phẩm không được vượt quá 200 ký tự',
        }),
        unit: Joi.string()
            .valid('Kg', 'Hộp', 'Miếng', 'Lit', 'Quả', 'Trứng', 'Gram', 'Gói', 'Chai', 'Hũ', 'Cái', 'Ổ')
            .messages({
                'any.only': 'Đơn vị tính không hợp lệ',
            }),
        gramConversion: Joi.number().min(1).max(1000).messages({
            'number.base': 'Quy đổi sang gam phải là số',
            'number.min': 'Quy đổi sang gam phải từ 1 đến 1000',
            'number.max': 'Quy đổi sang gam phải từ 1 đến 1000',
        }),
        categories: Joi.array()
            .items(Joi.string().valid('Động vật', 'Thực vật', 'Thực phẩm Khô', 'Thực phẩm tươi', 'Thực phẩm ăn liền'))
            .min(1)
            .messages({
                'array.min': 'Phải chọn ít nhất 1 loại thực phẩm',
                'any.only': 'Loại thực phẩm không hợp lệ',
            }),
        wastePercentage: Joi.number().min(0).max(99).messages({
            'number.base': 'Hệ số thái bỏ phải là số',
            'number.min': 'Hệ số thái bỏ phải từ 0 đến 99',
            'number.max': 'Hệ số thái bỏ phải từ 0 đến 99',
        }),
        protein: Joi.number().min(0).messages({
            'number.base': 'Protein phải là số',
            'number.min': 'Protein phải lớn hơn hoặc bằng 0',
        }),
        lipid: Joi.number().min(0).messages({
            'number.base': 'Lipid phải là số',
            'number.min': 'Lipid phải lớn hơn hoặc bằng 0',
        }),
        glucid: Joi.number().min(0).messages({
            'number.base': 'Glucid phải là số',
            'number.min': 'Glucid phải lớn hơn hoặc bằng 0',
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

export const foodValidation = {
    createNew,
    update,
};
