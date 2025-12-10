import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string()
            .pattern(OBJECT_ID_RULE)
            .required()
            .messages({ 'string.pattern.base': OBJECT_ID_RULE_MESSAGE }),
        classId: Joi.string()
            .pattern(OBJECT_ID_RULE)
            .required()
            .messages({ 'string.pattern.base': OBJECT_ID_RULE_MESSAGE }),
        studentId: Joi.string()
            .pattern(OBJECT_ID_RULE)
            .required()
            .messages({ 'string.pattern.base': OBJECT_ID_RULE_MESSAGE }),
        assessmentDetails: Joi.array()
            .items(
                Joi.object({
                    targetId: Joi.string()
                        .pattern(OBJECT_ID_RULE)
                        .required()
                        .messages({ 'string.pattern.base': OBJECT_ID_RULE_MESSAGE }),
                    status: Joi.string().valid('Chưa đánh giá', 'Đạt', 'Chưa đạt').default('Chưa đánh giá'),
                }),
            )
            .required(),
        note: Joi.string().allow('', null),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, err.details.map((d) => d.message).join(', ')));
    }
};

const update = async (req, res, next) => {
    const schema = Joi.object({
        assessmentDetails: Joi.array().items(
            Joi.object({
                targetId: Joi.string()
                    .pattern(OBJECT_ID_RULE)
                    .required()
                    .messages({ 'string.pattern.base': OBJECT_ID_RULE_MESSAGE }),
                status: Joi.string().valid('Chưa đánh giá', 'Đạt', 'Chưa đạt').required(),
            }),
        ),
        note: Joi.string().allow('', null),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: true });
        next();
    } catch (err) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, err.details.map((d) => d.message).join(', ')));
    }
};

const configUpsert = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string()
            .pattern(OBJECT_ID_RULE)
            .required()
            .messages({ 'string.pattern.base': OBJECT_ID_RULE_MESSAGE }),
        ageGroup: Joi.string()
            .valid(
                'Nhà trẻ 12-24 tháng',
                'Nhà trẻ 24-36 tháng',
                'Khối mầm 3-4 tuổi',
                'Khối chồi 4-5 tuổi',
                'Khối lá 5-6 tuổi',
            )
            .required(),
        selectedTargetIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE)).min(5).required().messages({
            'array.min': 'Phải chọn tối thiểu 5 mục tiêu',
            'string.pattern.base': OBJECT_ID_RULE_MESSAGE,
        }),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, err.details.map((d) => d.message).join(', ')));
    }
};

export const childrenProgramCompleteValidation = { createNew, update, configUpsert };
