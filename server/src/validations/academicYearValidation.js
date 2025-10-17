import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        fromYear: Joi.number().integer().min(2000).max(2100).required().messages({
            'number.base': 'Năm bắt đầu phải là số',
            'number.min': 'Năm bắt đầu phải lớn hơn 2000',
            'number.max': 'Năm bắt đầu phải nhỏ hơn 2100',
            'any.required': 'Năm bắt đầu là bắt buộc',
        }),
        toYear: Joi.number()
            .integer()
            .min(2000)
            .max(2100)
            .required()
            .custom((value, helpers) => {
                const fromYear = helpers.state.ancestors[0].fromYear;
                if (value !== fromYear + 1) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
            .messages({
                'number.base': 'Năm kết thúc phải là số',
                'number.min': 'Năm kết thúc phải lớn hơn 2000',
                'number.max': 'Năm kết thúc phải nhỏ hơn 2100',
                'any.required': 'Năm kết thúc là bắt buộc',
                'any.invalid': 'Năm kết thúc phải lớn hơn năm bắt đầu đúng 1 năm',
            }),
        semesters: Joi.array()
            .length(2)
            .items(
                Joi.object({
                    name: Joi.string().valid('Học kì I', 'Học kì II').required().messages({
                        'any.only': 'Tên học kỳ phải là "Học kì I" hoặc "Học kì II"',
                        'any.required': 'Tên học kỳ là bắt buộc',
                    }),
                    startDate: Joi.date().required().messages({
                        'date.base': 'Ngày bắt đầu không hợp lệ',
                        'any.required': 'Ngày bắt đầu là bắt buộc',
                    }),
                    endDate: Joi.date().greater(Joi.ref('startDate')).required().messages({
                        'date.base': 'Ngày kết thúc không hợp lệ',
                        'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu',
                        'any.required': 'Ngày kết thúc là bắt buộc',
                    }),
                }),
            )
            .required()
            .messages({
                'array.length': 'Năm học phải có đúng 2 học kỳ',
                'any.required': 'Danh sách học kỳ là bắt buộc',
            }),
        status: Joi.string().valid('active', 'inactive'),
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
        fromYear: Joi.number().integer().min(2000).max(2100).messages({
            'number.base': 'Năm bắt đầu phải là số',
            'number.min': 'Năm bắt đầu phải lớn hơn 2000',
            'number.max': 'Năm bắt đầu phải nhỏ hơn 2100',
        }),
        toYear: Joi.number()
            .integer()
            .min(2000)
            .max(2100)
            .custom((value, helpers) => {
                const fromYear = helpers.state.ancestors[0].fromYear;
                if (fromYear && value !== fromYear + 1) {
                    return helpers.error('any.invalid');
                }
                return value;
            })
            .messages({
                'number.base': 'Năm kết thúc phải là số',
                'number.min': 'Năm kết thúc phải lớn hơn 2000',
                'number.max': 'Năm kết thúc phải nhỏ hơn 2100',
                'any.invalid': 'Năm kết thúc phải lớn hơn năm bắt đầu đúng 1 năm',
            }),
        semesters: Joi.array()
            .length(2)
            .items(
                Joi.object({
                    _id: Joi.string().optional(),
                    name: Joi.string().valid('Học kì I', 'Học kì II').messages({
                        'any.only': 'Tên học kỳ phải là "Học kì I" hoặc "Học kì II"',
                    }),
                    startDate: Joi.date().messages({
                        'date.base': 'Ngày bắt đầu không hợp lệ',
                    }),
                    endDate: Joi.date().greater(Joi.ref('startDate')).messages({
                        'date.base': 'Ngày kết thúc không hợp lệ',
                        'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu',
                    }),
                }),
            )
            .messages({
                'array.length': 'Năm học phải có đúng 2 học kỳ',
            }),
        status: Joi.string().valid('active', 'inactive'),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const academicYearValidation = { createNew, update };
