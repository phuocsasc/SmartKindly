import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required().min(3).max(256).trim().messages({
            'string.empty': 'Tên trường học không được để trống',
            'string.min': 'Tên trường học phải có ít nhất 3 ký tự',
            'string.max': 'Tên trường học không được vượt quá 256 ký tự',
            'any.required': 'Tên trường học là bắt buộc',
        }),
        abbreviation: Joi.string().required().min(2).max(10).trim().uppercase().messages({
            'string.empty': 'Tên viết tắt không được để trống',
            'string.min': 'Tên viết tắt phải có ít nhất 2 ký tự',
            'string.max': 'Tên viết tắt không được vượt quá 10 ký tự',
            'any.required': 'Tên viết tắt là bắt buộc',
        }),
        address: Joi.string().required().min(10).max(500).trim().messages({
            'string.empty': 'Địa chỉ không được để trống',
            'string.min': 'Địa chỉ phải có ít nhất 10 ký tự',
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
            'any.required': 'Địa chỉ là bắt buộc',
        }),
        // ✅ Cho phép taxCode là null hoặc không gửi
        taxCode: Joi.string()
            .pattern(/^[0-9]{10,13}$/)
            .allow('', null)
            .optional()
            .messages({
                'string.pattern.base': 'Mã số thuế phải có 10-13 chữ số',
            }),
        manager: Joi.string().required().min(3).max(100).trim().messages({
            'string.empty': 'Tên hiệu trưởng không được để trống',
            'string.min': 'Tên hiệu trưởng phải có ít nhất 3 ký tự',
            'string.max': 'Tên hiệu trưởng không được vượt quá 100 ký tự',
            'any.required': 'Tên hiệu trưởng là bắt buộc',
        }),
        phone: Joi.string()
            .required()
            .pattern(/^[0-9]{10,11}$/)
            .messages({
                'string.empty': 'Số điện thoại không được để trống',
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
                'any.required': 'Số điện thoại là bắt buộc',
            }),
        // ✅ Cho phép email là null hoặc không gửi
        email: Joi.string().email().allow('', null).optional().messages({
            'string.email': 'Email không hợp lệ',
        }),
        // ✅ Cho phép website là null hoặc không gửi
        website: Joi.string()
            .pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)
            .allow('', null)
            .optional()
            .messages({
                'string.pattern.base': 'Website không hợp lệ',
            }),
        establishmentDate: Joi.date().required().messages({
            'date.base': 'Ngày thành lập không hợp lệ',
            'any.required': 'Ngày thành lập là bắt buộc',
        }),
        status: Joi.boolean().default(true),
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
        name: Joi.string().min(3).max(256).trim().messages({
            'string.min': 'Tên trường học phải có ít nhất 3 ký tự',
            'string.max': 'Tên trường học không được vượt quá 256 ký tự',
        }),
        abbreviation: Joi.string().min(2).max(10).trim().uppercase().messages({
            'string.min': 'Tên viết tắt phải có ít nhất 2 ký tự',
            'string.max': 'Tên viết tắt không được vượt quá 10 ký tự',
        }),
        address: Joi.string().min(10).max(500).trim().messages({
            'string.min': 'Địa chỉ phải có ít nhất 10 ký tự',
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
        }),
        taxCode: Joi.string()
            .pattern(/^[0-9]{10,13}$/)
            .allow('', null)
            .optional()
            .messages({
                'string.pattern.base': 'Mã số thuế phải có 10-13 chữ số',
            }),
        manager: Joi.string().min(3).max(100).trim().messages({
            'string.min': 'Tên hiệu trưởng phải có ít nhất 3 ký tự',
            'string.max': 'Tên hiệu trưởng không được vượt quá 100 ký tự',
        }),
        phone: Joi.string()
            .pattern(/^[0-9]{10,11}$/)
            .messages({
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
            }),
        email: Joi.string().email().allow('', null).optional().messages({
            'string.email': 'Email không hợp lệ',
        }),
        website: Joi.string()
            .pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)
            .allow('', null)
            .optional()
            .messages({
                'string.pattern.base': 'Website không hợp lệ',
            }),
        establishmentDate: Joi.date().messages({
            'date.base': 'Ngày thành lập không hợp lệ',
        }),
        status: Joi.boolean(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const schoolValidation = { createNew, update };
