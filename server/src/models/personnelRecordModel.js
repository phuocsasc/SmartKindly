import mongoose from 'mongoose';

const PersonnelRecordSchema = new mongoose.Schema(
    {
        personnelCode: {
            type: String,
            required: [true, 'Mã cán bộ là bắt buộc'],
            unique: true,
            trim: true,
        },
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        fullName: {
            type: String,
            required: [true, 'Họ và tên là bắt buộc'],
            trim: true,
            minlength: [3, 'Họ tên phải có ít nhất 3 ký tự'],
            maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
        },
        department: {
            type: String,
            required: [true, 'Tổ bộ môn là bắt buộc'],
            enum: {
                values: [
                    'CBQL',
                    'Tổ cấp dưỡng',
                    'Khối Nhà Trẻ',
                    'Khối Mầm',
                    'Khối Chồi',
                    'Khối Lá',
                    'Tổ Văn Phòng',
                    'Tổ Bảo Mẫu',
                ],
                message: 'Tổ bộ môn không hợp lệ',
            },
        },
        identificationNumber: {
            type: String,
            trim: true,
            maxlength: [12, 'Mã định danh không được vượt quá 12 ký tự'],
        },
        gender: {
            type: String,
            required: [true, 'Giới tính là bắt buộc'],
            enum: ['Nam', 'Nữ'],
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Ngày sinh là bắt buộc'],
        },
        workStatus: {
            type: String,
            required: [true, 'Trạng thái là bắt buộc'],
            enum: ['Chuyển công tác', 'Nghỉ hưu', 'Nghỉ việc', 'Tạm nghỉ', 'Đang làm việc'],
            default: 'Đang làm việc',
        },
        placeOfBirth: {
            type: String,
            trim: true,
            maxlength: [200, 'Nơi sinh không được vượt quá 200 ký tự'],
        },
        dateJoinedSchool: {
            type: Date,
            required: [true, 'Ngày vào trường là bắt buộc'],
        },
        email: {
            type: String,
            required: [true, 'Email là bắt buộc'],
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ'],
        },
        workPosition: {
            type: String,
            required: [true, 'Vị trí làm việc là bắt buộc'],
            enum: ['Cán bộ quản lý', 'Nhân Viên', 'Giáo viên'],
        },
        positionGroup: {
            type: String,
            required: [true, 'Nhóm chức vụ là bắt buộc'],
            enum: [
                'Hiệu trưởng',
                'Hiệu phó',
                'Tổ trưởng',
                'Tổ phó',
                'Giáo viên',
                'Bảo mẫu',
                'Nấu ăn',
                'Kế toán',
                'Giáo vụ',
            ],
        },
        ethnicity: {
            type: String,
            required: [true, 'Dân tộc là bắt buộc'],
            default: 'Kinh',
        },
        religion: {
            type: String,
            trim: true,
        },
        mainTeachingLevel: {
            type: String,
            required: [true, 'Cấp dạy chính là bắt buộc'],
            enum: ['Nhà trẻ', 'Mẫu giáo', 'Khác'],
        },
        contractType: {
            type: String,
            required: [true, 'Hình thức hợp đồng là bắt buộc'],
            enum: [
                'Hợp đồng theo nghị định 68',
                'Hợp đồng lao động trên 1 năm',
                'Hợp đồng lao động dưới 1 năm',
                'Viên chức HĐLV không xác định thời hạn',
                'Viên chức HĐLV xác định thời hạn',
            ],
        },
        teachingSubject: {
            type: String,
            enum: ['Nhà trẻ', 'Mẫu giáo'],
        },
        rankLevel: {
            type: String,
            trim: true,
        },
        salaryCoefficient: {
            type: Number,
            min: [0, 'Hệ số lương không được âm'],
        },
        salaryGrade: {
            type: String,
            trim: true,
        },
        salaryEffectiveDate: {
            type: Date,
        },
        professionalAllowance: {
            type: Number,
            min: [0, 'Phụ cấp không được âm'],
        },
        leadershipAllowance: {
            type: Number,
            min: [0, 'Phụ cấp không được âm'],
        },
        idCardNumber: {
            type: String,
            required: [true, 'Số CMND là bắt buộc'],
            trim: true,
            match: [/^[0-9]{9,12}$/, 'Số CMND phải có 9-12 chữ số'],
        },
        idCardIssueDate: {
            type: Date,
        },
        idCardIssuePlace: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Số điện thoại là bắt buộc'],
            trim: true,
            validate: {
                validator: function (v) {
                    // ✅ Cho phép empty string hoặc valid phone
                    return v === '' || /^[0-9]{10,11}$/.test(v);
                },
                message: 'Số điện thoại phải có 10-11 chữ số',
            },
        },
        socialInsuranceNumber: {
            type: String,
            trim: true,
        },
        detailedAddress: {
            type: String,
            trim: true,
            maxlength: [300, 'Địa chỉ không được vượt quá 300 ký tự'],
        },
        healthStatus: {
            type: String,
            trim: true,
        },
        isYouthUnionMember: {
            type: String,
            enum: {
                values: ['Có', 'Không', ''], // ✅ Thêm '' vào enum
                message: 'Giá trị không hợp lệ',
            },
            default: '', // ✅ Default là empty string
        },
        isPartyMember: {
            type: String,
            enum: {
                values: ['Có', 'Không', ''],
                message: 'Giá trị không hợp lệ',
            },
            default: '',
        },
        isTradeUnionMember: {
            type: String,
            enum: {
                values: ['Có', 'Không', ''],
                message: 'Giá trị không hợp lệ',
            },
            default: '',
        },
        familyBackground: {
            type: String,
            enum: {
                values: ['Công nhân', 'Nông dân', 'Thành phần khác', ''],
                message: 'Giá trị không hợp lệ',
            },
            default: '',
        },
        // Thông tin gia đình - Bố
        fatherName: {
            type: String,
            trim: true,
        },
        fatherBirthYear: {
            type: Number,
        },
        fatherOccupation: {
            type: String,
            trim: true,
        },
        fatherWorkplace: {
            type: String,
            trim: true,
        },
        // Thông tin gia đình - Mẹ
        motherName: {
            type: String,
            trim: true,
        },
        motherBirthYear: {
            type: Number,
        },
        motherOccupation: {
            type: String,
            trim: true,
        },
        motherWorkplace: {
            type: String,
            trim: true,
        },
        // Thông tin gia đình - Vợ/Chồng
        spouseName: {
            type: String,
            trim: true,
        },
        spouseBirthYear: {
            type: Number,
        },
        spouseOccupation: {
            type: String,
            trim: true,
        },
        spouseWorkplace: {
            type: String,
            trim: true,
        },
        // Trình độ học vấn
        highestProfessionalDegree: {
            type: String,
            enum: {
                values: [
                    'Thạc sĩ',
                    'Tiến sĩ',
                    'Trình độ khác',
                    'Trung cấp',
                    'Trung cấp sư phạm',
                    'Trung cấp và có chứng chỉ BDNVSP',
                    'Đại học',
                    'Đại học sư phạm',
                    'Đại học và có chứng chỉ BDNVSP',
                    '',
                ],
                message: 'Giá trị không hợp lệ',
            },
            default: '',
        },
        mainMajor: {
            type: String,
            trim: true,
        },
        majorDegreeLevel: {
            type: String,
            required: [true, 'Trình độ chuyên ngành chính là bắt buộc'],
            enum: {
                values: ['Trung cấp', 'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ'],
                message: 'Giá trị không hợp lệ',
            },
            default: undefined,
        },
        mainForeignLanguage: {
            type: String,
            trim: true,
        },
        foreignLanguageLevel: {
            type: String,
            trim: true,
        },
        languageCertificateGroup: {
            type: String,
            enum: {
                values: ['Chứng chỉ trong nước', 'Chứng chỉ quốc tế', ''],
                message: 'Giá trị không hợp lệ',
            },
            default: '',
        },
        itLevel: {
            type: String,
            trim: true,
        },
        politicalTheoryLevel: {
            type: String,
            enum: {
                values: ['Cử nhân', 'Sơ cấp', 'Trung cấp', 'Cao cấp', ''],
                message: 'Giá trị không hợp lệ',
            },
            default: '',
        },
        recruitmentDate: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    },
);

// ✅ Compound indexes
PersonnelRecordSchema.index({ schoolId: 1, _destroy: 1 }); // Main query
PersonnelRecordSchema.index({ schoolId: 1, department: 1, _destroy: 1 }); // Filter by department
PersonnelRecordSchema.index({ schoolId: 1, workStatus: 1, _destroy: 1 }); // Filter by status
PersonnelRecordSchema.index({ personnelCode: 1, _destroy: 1 }); // Unique lookup
PersonnelRecordSchema.index({ email: 1, _destroy: 1 }); // Email lookup
PersonnelRecordSchema.index({ idCardNumber: 1, _destroy: 1 }); // ID card lookup
PersonnelRecordSchema.index({ createdAt: -1 }); // Sort

// ✅ Text search index
PersonnelRecordSchema.index(
    {
        fullName: 'text',
        email: 'text',
        phone: 'text',
    },
    {
        weights: {
            fullName: 10,
            email: 5,
            phone: 3,
        },
    },
);

// Static method: Tạo personnelCode tự động
PersonnelRecordSchema.statics.generatePersonnelCode = async function (schoolId) {
    // Lấy số thứ tự tiếp theo
    const count = await this.countDocuments({ schoolId, _destroy: false });
    const nextNumber = count + 1;
    const paddedNumber = String(nextNumber).padStart(3, '0'); // CB001, CB002, ...

    return `${schoolId}-CB${paddedNumber}`;
};

export const PersonnelRecordModel = mongoose.model('PersonnelRecord', PersonnelRecordSchema);
