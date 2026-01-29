// server/src/validations/parentRequestValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().required().messages({
            'any.required': 'Năm học là bắt buộc',
            'string.empty': 'Năm học không được để trống',
        }),
        requestName: Joi.string().required().max(200).messages({
            'any.required': 'Tên phiếu là bắt buộc',
            'string.empty': 'Tên phiếu không được để trống',
            'string.max': 'Tên phiếu không được vượt quá 200 ký tự',
        }),
        fromDate: Joi.date().required().messages({
            'any.required': 'Ngày bắt đầu là bắt buộc',
            'date.base': 'Ngày bắt đầu không hợp lệ',
        }),
        toDate: Joi.date().required().messages({
            'any.required': 'Ngày kết thúc là bắt buộc',
            'date.base': 'Ngày kết thúc không hợp lệ',
        }),
        parentNote: Joi.string().required().max(2000).messages({
            'any.required': 'Dặn dò của phụ huynh là bắt buộc',
            'string.empty': 'Dặn dò không được để trống',
            'string.max': 'Dặn dò không được vượt quá 2000 ký tự',
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
    const schema = Joi.object({
        // ✅ FIX: Cho phép các field này nhưng sẽ bị ignore trong service
        academicYearId: Joi.string().optional(),
        classId: Joi.string().optional(),

        requestName: Joi.string().max(200).messages({
            'string.max': 'Tên phiếu không được vượt quá 200 ký tự',
        }),
        fromDate: Joi.date().messages({
            'date.base': 'Ngày bắt đầu không hợp lệ',
        }),
        toDate: Joi.date().messages({
            'date.base': 'Ngày kết thúc không hợp lệ',
        }),
        parentNote: Joi.string().max(2000).messages({
            'string.max': 'Dặn dò không được vượt quá 2000 ký tự',
        }),
        teacherReply: Joi.string().max(2000).allow('').messages({
            'string.max': 'Phản hồi không được vượt quá 2000 ký tự',
        }),
        status: Joi.string().valid('Chờ duyệt', 'Đã duyệt', 'Từ chối').messages({
            'any.only': 'Trạng thái không hợp lệ',
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

export const parentRequestValidation = {
    createNew,
    update,
};
