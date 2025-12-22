// server/src/validations/schoolFoodValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const update = async (req, res, next) => {
    const schema = Joi.object({
        unit: Joi.string()
            .valid(
                'Kg',
                'Hộp',
                'Miếng',
                'Cốc',
                'Quả',
                'Trứng',
                'Chén',
                'Gói',
                'Chai',
                'Hũ',
                'Cái',
                'Ổ',
                'Bát',
                'Tô',
                'Lon',
                'Túi',
                'Bịch',
                'Bao',
                'Trái',
                'Củ',
                'Cây',
                'Bắp',
                'Tép',
                'Lát',
                'Khoanh',
                'Khúc',
                'Bó',
                'Mớ',
                'Chùm',
                'Nải',
                'Lá',
                'Con',
                'Viên',
                'Hạt',
            )
            .messages({
                'any.only': 'Đơn vị tính không hợp lệ',
            }),
        gramConversion: Joi.number().min(1).max(1000).messages({
            'number.base': 'Quy đổi sang gam phải là số',
            'number.min': 'Quy đổi sang gam phải từ 1 đến 1000',
            'number.max': 'Quy đổi sang gam phải từ 1 đến 1000',
        }),
        wastePercentage: Joi.number().min(0).max(99).messages({
            'number.base': 'Hệ số thái bỏ phải là số',
            'number.min': 'Hệ số thái bỏ phải từ 0 đến 99',
            'number.max': 'Hệ số thái bỏ phải từ 0 đến 99',
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

export const schoolFoodValidation = {
    update,
};
