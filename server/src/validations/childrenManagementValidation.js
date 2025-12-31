import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const create = async (req, res, next) => {
    const currentYear = new Date().getFullYear();

    const schema = Joi.object({
        // Thông tin học sinh
        fullName: Joi.string().required().min(2).max(100).trim().messages({
            'string.empty': 'Họ và tên không được để trống',
            'string.min': 'Họ tên phải có ít nhất 2 ký tự',
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
            'any.required': 'Họ và tên là bắt buộc',
        }),
        nickname: Joi.string().max(50).trim().allow('').messages({
            'string.max': 'Biệt danh không được vượt quá 50 ký tự',
        }),
        birthDate: Joi.date().required().messages({
            'any.required': 'Ngày sinh là bắt buộc',
            'date.base': 'Ngày sinh không hợp lệ',
        }),
        gender: Joi.string().valid('Nam', 'Nữ').required().messages({
            'any.only': 'Giới tính phải là Nam hoặc Nữ',
            'any.required': 'Giới tính là bắt buộc',
        }),
        ethnicity: Joi.string().required().max(50).trim().messages({
            'string.empty': 'Dân tộc không được để trống',
            'string.max': 'Tên dân tộc không được vượt quá 50 ký tự',
            'any.required': 'Dân tộc là bắt buộc',
        }),

        // Thông tin học tập
        enrollmentDate: Joi.date().required().messages({
            'any.required': 'Ngày nhập học là bắt buộc',
            'date.base': 'Ngày nhập học không hợp lệ',
        }),
        status: Joi.string().valid('Đang học', 'Nghỉ học').default('Đang học'),

        // Thông tin gia đình
        motherName: Joi.string().max(100).trim().allow(''),
        motherBirthYear: Joi.number().integer().min(1940).max(currentYear).allow(null),
        motherPhone: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .allow('')
            .messages({
                'string.pattern.base': 'Số điện thoại mẹ phải có đúng 10 chữ số',
            }),
        motherEmail: Joi.string().email().allow('').messages({
            'string.email': 'Email mẹ không hợp lệ',
        }),
        fatherName: Joi.string().max(100).trim().allow(''),
        fatherBirthYear: Joi.number().integer().min(1940).max(currentYear).allow(null),
        fatherPhone: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .allow('')
            .messages({
                'string.pattern.base': 'Số điện thoại bố phải có đúng 10 chữ số',
            }),
        fatherEmail: Joi.string().email().allow('').messages({
            'string.email': 'Email bố không hợp lệ',
        }),

        // Thông tin địa chỉ
        permanentAddress: Joi.string().required().max(300).trim().messages({
            'string.empty': 'Địa chỉ thường trú không được để trống',
            'string.max': 'Địa chỉ thường trú không được vượt quá 300 ký tự',
            'any.required': 'Địa chỉ thường trú là bắt buộc',
        }),
        currentAddress: Joi.string().required().max(300).trim().messages({
            'string.empty': 'Địa chỉ hiện tại không được để trống',
            'string.max': 'Địa chỉ hiện tại không được vượt quá 300 ký tự',
            'any.required': 'Địa chỉ hiện tại là bắt buộc',
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

const update = async (req, res, next) => {
    const currentYear = new Date().getFullYear();

    const schema = Joi.object({
        fullName: Joi.string().min(2).max(100).trim(),
        nickname: Joi.string().max(50).trim().allow(''),
        birthDate: Joi.date(),
        gender: Joi.string().valid('Nam', 'Nữ'),
        ethnicity: Joi.string().max(50).trim(),
        enrollmentDate: Joi.date(),
        status: Joi.string().valid('Đang học', 'Nghỉ học'),
        motherName: Joi.string().max(100).trim().allow(''),
        motherBirthYear: Joi.number().integer().min(1940).max(currentYear).allow(null),
        motherPhone: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .allow('')
            .messages({
                'string.pattern.base': 'Số điện thoại mẹ phải có đúng 10 chữ số',
            }),
        motherEmail: Joi.string().email().allow(''),
        fatherName: Joi.string().max(100).trim().allow(''),
        fatherBirthYear: Joi.number().integer().min(1940).max(currentYear).allow(null),
        fatherPhone: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .allow('')
            .messages({
                'string.pattern.base': 'Số điện thoại bố phải có đúng 10 chữ số',
            }),
        fatherEmail: Joi.string().email().allow(''),
        permanentAddress: Joi.string().max(300).trim(),
        currentAddress: Joi.string().max(300).trim(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: false });
        next();
    } catch (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

const deleteMany = async (req, res, next) => {
    const schema = Joi.object({
        ids: Joi.array().items(Joi.string().required()).min(1).required().messages({
            'array.min': 'Phải chọn ít nhất 1 học sinh',
            'any.required': 'Danh sách ID là bắt buộc',
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

export const childrenManagementValidation = {
    create,
    update,
    deleteMany,
};
