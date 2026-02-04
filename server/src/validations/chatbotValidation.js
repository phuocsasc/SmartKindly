// server/src/validations/chatbotValidation.js

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

const sendMessage = async (req, res, next) => {
    const schema = Joi.object({
        conversationId: Joi.string().required().messages({
            'any.required': 'Conversation ID là bắt buộc',
            'string.empty': 'Conversation ID không được để trống',
        }),
        message: Joi.string().required().min(1).max(2000).messages({
            'any.required': 'Tin nhắn là bắt buộc',
            'string.empty': 'Tin nhắn không được để trống',
            'string.max': 'Tin nhắn không được vượt quá 2000 ký tự',
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

export const chatbotValidation = {
    sendMessage,
};
