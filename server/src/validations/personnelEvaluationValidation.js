// server/src/validations/personnelEvaluationValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const update = async (req, res, next) => {
    const schema = Joi.object({
        officialEvaluation: Joi.string()
            .valid('Hoàn thành (hạn chế về NL)', 'Hoàn thành tốt', 'Không hoàn thành nhiệm vụ', 'Xuất sắc', '')
            .allow('', null),
        regularTraining: Joi.string().valid('Chưa hoàn thành', 'Khá', 'Tốt', 'Đạt', '').allow('', null),
        excellentTeacher: Joi.string().valid('Cấp Huyện', 'Cấp Tỉnh', 'Cấp trường', '').allow('', null),
        emulationTitle: Joi.string()
            .valid(
                'Chiến sĩ thi đua cấp tỉnh',
                'Chiến sĩ thi đua cơ sở',
                'Chiến sĩ thi đua toàn quốc',
                'Lao động tiên tiến',
                '',
            )
            .allow('', null),
        notes: Joi.string().max(500).trim().allow('', null),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const personnelEvaluationValidation = { update };
