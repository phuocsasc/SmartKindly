import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

const createNew = async (req, res, next) => {
    const mealSessionSchema = Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE));

    const schema = Joi.object({
        menuName: Joi.string().required().min(2).max(200).trim().messages({
            'any.required': 'Tên thực đơn là bắt buộc',
            'string.empty': 'Tên thực đơn không được để trống',
            'string.min': 'Tên thực đơn phải có ít nhất 2 ký tự',
            'string.max': 'Tên thực đơn không được vượt quá 200 ký tự',
        }),
        numberOfChildren: Joi.number().required().integer().min(1).messages({
            'any.required': 'Số trẻ là bắt buộc',
            'number.base': 'Số trẻ phải là một số',
            'number.min': 'Số trẻ phải lớn hơn 0',
        }),
        nutritionalStandardId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
        meals: Joi.object(
            MEAL_SESSIONS.reduce((acc, session) => {
                acc[session] = mealSessionSchema;
                return acc;
            }, {}),
        ).required(),
        aggregatedFoodTable: Joi.array()
            .items(
                Joi.object({
                    foodId: Joi.string().pattern(OBJECT_ID_RULE).required(),
                    foodName: Joi.string().required(),
                    unit: Joi.string().required(),
                    gramConversion: Joi.number().required(),
                    wastePercentage: Joi.number().required(),
                    isMainFood: Joi.boolean(),
                    purchaseQuantityByUnit: Joi.number().required().min(0),
                }),
            )
            .optional(),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, err.details.map((d) => d.message).join(', ')));
    }
};

const update = async (req, res, next) => {
    // Validation cho update tương tự createNew
    const mealSessionSchema = Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE));
    const schema = Joi.object({
        menuName: Joi.string().min(2).max(200).trim(),
        numberOfChildren: Joi.number().integer().min(1),
        nutritionalStandardId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
        meals: Joi.object(
            MEAL_SESSIONS.reduce((acc, session) => {
                acc[session] = mealSessionSchema;
                return acc;
            }, {}),
        ),
        aggregatedFoodTable: Joi.array().items(
            Joi.object({
                foodId: Joi.string().pattern(OBJECT_ID_RULE).required(),
                foodName: Joi.string().required(),
                unit: Joi.string().required(),
                gramConversion: Joi.number().required(),
                wastePercentage: Joi.number().required(),
                isMainFood: Joi.boolean(),
                purchaseQuantityByUnit: Joi.number().required().min(0),
            }),
        ),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: true });
        next();
    } catch (err) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, err.details.map((d) => d.message).join(', ')));
    }
};

export const schoolMenuValidation = {
    createNew,
    update,
};
