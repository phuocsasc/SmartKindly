import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';

const create = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
        fullName: Joi.string().required().min(2).max(100).trim(),
        birthDate: Joi.date().required(),
        gender: Joi.string().valid('Nam', 'Nữ').required(),
        ageGroup: Joi.string().valid('12-24 tháng', '24-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi').required(),
        classId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).required(),
        status: Joi.string().valid('Đang học', 'Nghỉ học').default('Đang học'),
        enrollmentDate: Joi.date().required(),
        enrollmentForm: Joi.string().valid('Xét tuyển', 'Trúng tuyển', 'Chuyển đến từ trường khác', '').allow(''),
        birthPlace: Joi.string().max(200).trim().allow(''),
        hometown: Joi.string().max(200).trim().allow(''),
        permanentAddress: Joi.string().required().max(300).trim(),
        temporaryAddress: Joi.string().required().max(300).trim(),
        ethnicity: Joi.string().required().max(50).trim(),
        religion: Joi.string().max(50).trim().allow(''),
        swimmingLevel: Joi.string().valid('Chưa biết', 'Biết sơ cấp', 'Biết bơi thành thạo', '').allow(''),
        bloodType: Joi.string().valid('A', 'B', 'AB', 'O', 'Không rõ', '').allow(''),
        hasComputer: Joi.string().valid('Có', 'Không', '').allow(''),
        hasSmartphone: Joi.string().valid('Có', 'Không', '').allow(''),
        familyComponent: Joi.string().valid('Công nhân', 'Nông dân', 'Khác', '').allow(''),
        fatherName: Joi.string().max(100).trim().allow(''),
        fatherBirthYear: Joi.string().max(4).trim().allow(''),
        fatherOccupation: Joi.string().max(100).trim().allow(''),
        fatherPhone: Joi.string().max(15).trim().allow(''),
        fatherEmail: Joi.string().email().trim().allow(''),
        motherName: Joi.string().max(100).trim().allow(''),
        motherBirthYear: Joi.string().max(4).trim().allow(''),
        motherOccupation: Joi.string().max(100).trim().allow(''),
        motherPhone: Joi.string().max(15).trim().allow(''),
        motherEmail: Joi.string().email().trim().allow(''),
        guardianName: Joi.string().max(100).trim().allow(''),
        guardianBirthYear: Joi.string().max(4).trim().allow(''),
        guardianOccupation: Joi.string().max(100).trim().allow(''),
        guardianPhone: Joi.string().max(15).trim().allow(''),
        guardianEmail: Joi.string().email().trim().allow(''),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errorMessage = error.details?.map((detail) => detail.message).join(', ') || error.message;
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

const update = async (req, res, next) => {
    const schema = Joi.object({
        academicYearId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).optional(),
        fullName: Joi.string().min(2).max(100).trim(),
        birthDate: Joi.date(),
        gender: Joi.string().valid('Nam', 'Nữ'),
        ageGroup: Joi.string().valid('12-24 tháng', '24-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi'),
        classId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
        status: Joi.string().valid('Đang học', 'Nghỉ học'),
        enrollmentDate: Joi.date(),
        enrollmentForm: Joi.string().valid('Xét tuyển', 'Trúng tuyển', 'Chuyển đến từ trường khác', '').allow(''),
        birthPlace: Joi.string().max(200).trim().allow(''),
        hometown: Joi.string().max(200).trim().allow(''),
        permanentAddress: Joi.string().max(300).trim(),
        temporaryAddress: Joi.string().max(300).trim(),
        ethnicity: Joi.string().max(50).trim(),
        religion: Joi.string().max(50).trim().allow(''),
        swimmingLevel: Joi.string().valid('Chưa biết', 'Biết sơ cấp', 'Biết bơi thành thạo', '').allow(''),
        bloodType: Joi.string().valid('A', 'B', 'AB', 'O', 'Không rõ', '').allow(''),
        hasComputer: Joi.string().valid('Có', 'Không', '').allow(''),
        hasSmartphone: Joi.string().valid('Có', 'Không', '').allow(''),
        familyComponent: Joi.string().valid('Công nhân', 'Nông dân', 'Khác', '').allow(''),
        fatherName: Joi.string().max(100).trim().allow(''),
        fatherBirthYear: Joi.string().max(4).trim().allow(''),
        fatherOccupation: Joi.string().max(100).trim().allow(''),
        fatherPhone: Joi.string().max(15).trim().allow(''),
        fatherEmail: Joi.string().email().trim().allow(''),
        motherName: Joi.string().max(100).trim().allow(''),
        motherBirthYear: Joi.string().max(4).trim().allow(''),
        motherOccupation: Joi.string().max(100).trim().allow(''),
        motherPhone: Joi.string().max(15).trim().allow(''),
        motherEmail: Joi.string().email().trim().allow(''),
        guardianName: Joi.string().max(100).trim().allow(''),
        guardianBirthYear: Joi.string().max(4).trim().allow(''),
        guardianOccupation: Joi.string().max(100).trim().allow(''),
        guardianPhone: Joi.string().max(15).trim().allow(''),
        guardianEmail: Joi.string().email().trim().allow(''),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        const errorMessage = error.details?.map((detail) => detail.message).join(', ') || error.message;
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const childrenProfileValidation = { create, update };
