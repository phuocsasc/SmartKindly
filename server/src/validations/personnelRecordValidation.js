import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    const schema = Joi.object({
        fullName: Joi.string().required().min(3).max(100).trim().messages({
            'string.empty': 'Họ và tên không được để trống',
            'string.min': 'Họ tên phải có ít nhất 3 ký tự',
            'string.max': 'Họ tên không được vượt quá 100 ký tự',
            'any.required': 'Họ và tên là bắt buộc',
        }),
        department: Joi.string()
            .required()
            .valid(
                'CBQL',
                'Tổ cấp dưỡng',
                'Khối Nhà Trẻ',
                'Khối Mầm',
                'Khối Chồi',
                'Khối Lá',
                'Tổ Văn Phòng',
                'Tổ Bảo Mẫu',
            )
            .messages({
                'any.required': 'Tổ bộ môn là bắt buộc',
                'any.only': 'Tổ bộ môn không hợp lệ',
            }),
        identificationNumber: Joi.string().max(12).trim().allow('', null),
        gender: Joi.string().required().valid('Nam', 'Nữ').messages({
            'any.required': 'Giới tính là bắt buộc',
            'any.only': 'Giới tính không hợp lệ',
        }),
        dateOfBirth: Joi.date().required().messages({
            'any.required': 'Ngày sinh là bắt buộc',
            'date.base': 'Ngày sinh không hợp lệ',
        }),
        workStatus: Joi.string()
            .required()
            .valid('Chuyển công tác', 'Nghỉ hưu', 'Nghỉ việc', 'Tạm nghỉ', 'Đang làm việc')
            .messages({
                'any.required': 'Trạng thái là bắt buộc',
                'any.only': 'Trạng thái không hợp lệ',
            }),
        placeOfBirth: Joi.string().max(200).trim().allow('', null),
        dateJoinedSchool: Joi.date().required().messages({
            'any.required': 'Ngày vào trường là bắt buộc',
            'date.base': 'Ngày vào trường không hợp lệ',
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
        }),
        workPosition: Joi.string().required().valid('Cán bộ quản lý', 'Nhân Viên', 'Giáo viên').messages({
            'any.required': 'Vị trí làm việc là bắt buộc',
            'any.only': 'Vị trí làm việc không hợp lệ',
        }),
        positionGroup: Joi.string()
            .required()
            .valid(
                'Hiệu trưởng',
                'Hiệu phó',
                'Tổ trưởng',
                'Tổ phó',
                'Giáo viên',
                'Bảo mẫu',
                'Nấu ăn',
                'Kế toán',
                'Giáo vụ',
            )
            .messages({
                'any.required': 'Nhóm chức vụ là bắt buộc',
                'any.only': 'Nhóm chức vụ không hợp lệ',
            }),
        ethnicity: Joi.string().required().trim().messages({
            'any.required': 'Dân tộc là bắt buộc',
        }),
        religion: Joi.string().trim().allow('', null),
        mainTeachingLevel: Joi.string().valid('Nhà trẻ', 'Mẫu giáo', 'Khác').messages({
            'any.required': 'Cấp dạy chính là bắt buộc',
            'any.only': 'Cấp dạy chính không hợp lệ',
        }),
        contractType: Joi.string()
            .required()
            .valid(
                'Hợp đồng theo nghị định 68',
                'Hợp đồng lao động trên 1 năm',
                'Hợp đồng lao động dưới 1 năm',
                'Viên chức HĐLV không xác định thời hạn',
                'Viên chức HĐLV xác định thời hạn',
            )
            .messages({
                'any.required': 'Hình thức hợp đồng là bắt buộc',
                'any.only': 'Hình thức hợp đồng không hợp lệ',
            }),
        teachingSubject: Joi.string().valid('Nhà trẻ', 'Mẫu giáo').allow('', null),
        rankLevel: Joi.string().trim().allow('', null),
        salaryCoefficient: Joi.number().min(0).allow(null),
        salaryGrade: Joi.string().trim().allow('', null),
        salaryEffectiveDate: Joi.date().allow(null),
        professionalAllowance: Joi.number().min(0).allow(null),
        leadershipAllowance: Joi.number().min(0).allow(null),
        idCardNumber: Joi.string()
            .required()
            .pattern(/^[0-9]{9,12}$/)
            .messages({
                'string.pattern.base': 'Số CMND phải có 9-12 chữ số',
                'any.required': 'Số CMND là bắt buộc',
            }),
        idCardIssueDate: Joi.date().allow(null),
        idCardIssuePlace: Joi.string().trim().allow('', null),
        phone: Joi.string()
            .required()
            .pattern(/^[0-9]{10,11}$/)
            .messages({
                'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
                'any.required': 'Số điện thoại là bắt buộc',
            }),
        socialInsuranceNumber: Joi.string().trim().allow('', null),
        detailedAddress: Joi.string().max(300).trim().allow('', null),
        healthStatus: Joi.string().trim().allow('', null),
        isYouthUnionMember: Joi.string().valid('Có', 'Không').allow('', null),
        isPartyMember: Joi.string().valid('Có', 'Không').allow('', null),
        isTradeUnionMember: Joi.string().valid('Có', 'Không').allow('', null),
        familyBackground: Joi.string().valid('Công nhân', 'Nông dân', 'Thành phần khác').allow('', null),
        // Thông tin gia đình
        fatherName: Joi.string().trim().allow('', null),
        fatherBirthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
        fatherOccupation: Joi.string().trim().allow('', null),
        fatherWorkplace: Joi.string().trim().allow('', null),
        motherName: Joi.string().trim().allow('', null),
        motherBirthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
        motherOccupation: Joi.string().trim().allow('', null),
        motherWorkplace: Joi.string().trim().allow('', null),
        spouseName: Joi.string().trim().allow('', null),
        spouseBirthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
        spouseOccupation: Joi.string().trim().allow('', null),
        spouseWorkplace: Joi.string().trim().allow('', null),
        // Trình độ
        highestProfessionalDegree: Joi.string()
            .valid(
                'Thạc sĩ',
                'Tiến sĩ',
                'Trình độ khác',
                'Trung cấp',
                'Trung cấp sư phạm',
                'Trung cấp và có chứng chỉ BDNVSP',
                'Đại học',
                'Đại học sư phạm',
                'Đại học và có chứng chỉ BDNVSP',
            )
            .allow('', null),
        mainMajor: Joi.string().trim().allow('', null),
        majorDegreeLevel: Joi.string()
            .required()
            .valid('Trung cấp', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ')
            .allow('', null),
        mainForeignLanguage: Joi.string().trim().allow('', null),
        foreignLanguageLevel: Joi.string().trim().allow('', null),
        languageCertificateGroup: Joi.string().valid('Chứng chỉ trong nước', 'Chứng chỉ quốc tế').allow('', null),
        itLevel: Joi.string().trim().allow('', null),
        politicalTheoryLevel: Joi.string().valid('Cử nhân', 'Sơ cấp', 'Trung cấp', 'Cao cấp').allow('', null),
        recruitmentDate: Joi.date().allow(null),
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
        fullName: Joi.string().min(3).max(100).trim(),
        department: Joi.string().valid(
            'CBQL',
            'Tổ cấp dưỡng',
            'Khối Nhà Trẻ',
            'Khối Mầm',
            'Khối Chồi',
            'Khối Lá',
            'Tổ Văn Phòng',
            'Tổ Bảo Mẫu',
        ),
        identificationNumber: Joi.string().max(12).trim().allow('', null),
        gender: Joi.string().valid('Nam', 'Nữ'),
        dateOfBirth: Joi.date(),
        workStatus: Joi.string().valid('Chuyển công tác', 'Nghỉ hưu', 'Nghỉ việc', 'Tạm nghỉ', 'Đang làm việc'),
        placeOfBirth: Joi.string().max(200).trim().allow('', null),
        dateJoinedSchool: Joi.date(),
        email: Joi.string().email(),
        workPosition: Joi.string().valid('Cán bộ quản lý', 'Nhân Viên', 'Giáo viên'),
        positionGroup: Joi.string().valid(
            'Hiệu trưởng',
            'Hiệu phó',
            'Tổ trưởng',
            'Tổ phó',
            'Giáo viên',
            'Bảo mẫu',
            'Nấu ăn',
            'Kế toán',
            'Giáo vụ',
        ),
        ethnicity: Joi.string().trim(),
        religion: Joi.string().trim().allow('', null),
        mainTeachingLevel: Joi.string().valid('Nhà trẻ', 'Mẫu giáo', 'Khác'),
        contractType: Joi.string().valid(
            'Hợp đồng theo nghị định 68',
            'Hợp đồng lao động trên 1 năm',
            'Hợp đồng lao động dưới 1 năm',
            'Viên chức HĐLV không xác định thời hạn',
            'Viên chức HĐLV xác định thời hạn',
        ),
        teachingSubject: Joi.string().valid('Nhà trẻ', 'Mẫu giáo').allow('', null),
        rankLevel: Joi.string().trim().allow('', null),
        salaryCoefficient: Joi.number().min(0).allow(null),
        salaryGrade: Joi.string().trim().allow('', null),
        salaryEffectiveDate: Joi.date().allow(null),
        professionalAllowance: Joi.number().min(0).allow(null),
        leadershipAllowance: Joi.number().min(0).allow(null),
        idCardNumber: Joi.string().pattern(/^[0-9]{9,12}$/),
        idCardIssueDate: Joi.date().allow(null),
        idCardIssuePlace: Joi.string().trim().allow('', null),
        phone: Joi.string().pattern(/^[0-9]{10,11}$/),
        socialInsuranceNumber: Joi.string().trim().allow('', null),
        detailedAddress: Joi.string().max(300).trim().allow('', null),
        healthStatus: Joi.string().trim().allow('', null),
        isYouthUnionMember: Joi.string().valid('Có', 'Không').allow('', null),
        isPartyMember: Joi.string().valid('Có', 'Không').allow('', null),
        isTradeUnionMember: Joi.string().valid('Có', 'Không').allow('', null),
        familyBackground: Joi.string().valid('Công nhân', 'Nông dân', 'Thành phần khác').allow('', null),
        // Family info
        fatherName: Joi.string().trim().allow('', null),
        fatherBirthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
        fatherOccupation: Joi.string().trim().allow('', null),
        fatherWorkplace: Joi.string().trim().allow('', null),
        motherName: Joi.string().trim().allow('', null),
        motherBirthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
        motherOccupation: Joi.string().trim().allow('', null),
        motherWorkplace: Joi.string().trim().allow('', null),
        spouseName: Joi.string().trim().allow('', null),
        spouseBirthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
        spouseOccupation: Joi.string().trim().allow('', null),
        spouseWorkplace: Joi.string().trim().allow('', null),
        // Education
        highestProfessionalDegree: Joi.string()
            .valid(
                'Thạc sĩ',
                'Tiến sĩ',
                'Trình độ khác',
                'Trung cấp',
                'Trung cấp sư phạm',
                'Trung cấp và có chứng chỉ BDNVSP',
                'Đại học',
                'Đại học sư phạm',
                'Đại học và có chứng chỉ BDNVSP',
            )
            .allow('', null),
        mainMajor: Joi.string().trim().allow('', null),
        majorDegreeLevel: Joi.string().valid('Trung cấp', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ').allow('', null),
        mainForeignLanguage: Joi.string().trim().allow('', null),
        foreignLanguageLevel: Joi.string().trim().allow('', null),
        languageCertificateGroup: Joi.string().valid('Chứng chỉ trong nước', 'Chứng chỉ quốc tế').allow('', null),
        itLevel: Joi.string().trim().allow('', null),
        politicalTheoryLevel: Joi.string().valid('Cử nhân', 'Sơ cấp', 'Trung cấp', 'Cao cấp').allow('', null),
        recruitmentDate: Joi.date().allow(null),
    });

    try {
        await schema.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (err) {
        const errorMessage = err.details.map((detail) => detail.message).join(', ');
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage));
    }
};

export const personnelRecordValidation = { createNew, update };
