import mongoose from 'mongoose';

const childrenProfileSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'Mã trường là bắt buộc'],
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: [true, 'Năm học là bắt buộc'],
            index: true,
        },
        studentCode: {
            type: String,
            required: [true, 'Mã học sinh là bắt buộc'],
            // ✅ KHÔNG unique: true ở đây
        },
        fullName: {
            type: String,
            required: [true, 'Họ và tên là bắt buộc'],
            trim: true,
        },
        birthDate: {
            type: Date,
            required: [true, 'Ngày sinh là bắt buộc'],
        },
        gender: {
            type: String,
            required: [true, 'Giới tính là bắt buộc'],
            enum: ['Nam', 'Nữ'],
        },
        ageGroup: {
            type: String,
            required: [true, 'Khối nhóm tuổi là bắt buộc'],
            enum: ['12-24 tháng', '24-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi'],
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: [true, 'Lớp học là bắt buộc'],
            index: true,
        },
        status: {
            type: String,
            required: [true, 'Trạng thái là bắt buộc'],
            enum: ['Đang học', 'Nghỉ học'],
            default: 'Đang học',
        },
        enrollmentDate: {
            type: Date,
            required: [true, 'Ngày nhập học là bắt buộc'],
        },
        enrollmentForm: {
            type: String,
            enum: ['Xét tuyển', 'Trúng tuyển', 'Chuyển đến từ trường khác', ''],
            default: '',
        },
        birthPlace: {
            type: String,
            trim: true,
            default: '',
        },
        hometown: {
            type: String,
            trim: true,
            default: '',
        },
        permanentAddress: {
            type: String,
            required: [true, 'Địa chỉ thường trú là bắt buộc'],
            trim: true,
        },
        temporaryAddress: {
            type: String,
            required: [true, 'Địa chỉ tạm trú là bắt buộc'],
            trim: true,
        },
        ethnicity: {
            type: String,
            required: [true, 'Dân tộc là bắt buộc'],
            trim: true,
        },
        religion: {
            type: String,
            trim: true,
            default: '',
        },
        swimmingLevel: {
            type: String,
            enum: ['Chưa biết', 'Biết sơ cấp', 'Biết bơi thành thạo', ''],
            default: '',
        },
        bloodType: {
            type: String,
            enum: ['A', 'B', 'AB', 'O', 'Không rõ', ''],
            default: '',
        },
        hasComputer: {
            type: String,
            enum: ['Có', 'Không', ''],
            default: '',
        },
        hasSmartphone: {
            type: String,
            enum: ['Có', 'Không', ''],
            default: '',
        },
        familyComponent: {
            type: String,
            enum: ['Công nhân', 'Nông dân', 'Khác', ''],
            default: '',
        },
        fatherName: {
            type: String,
            trim: true,
            default: '',
        },
        fatherBirthYear: {
            type: String,
            trim: true,
            default: '',
        },
        fatherOccupation: {
            type: String,
            trim: true,
            default: '',
        },
        fatherPhone: {
            type: String,
            trim: true,
            default: '',
        },
        fatherEmail: {
            type: String,
            trim: true,
            default: '',
        },
        motherName: {
            type: String,
            trim: true,
            default: '',
        },
        motherBirthYear: {
            type: String,
            trim: true,
            default: '',
        },
        motherOccupation: {
            type: String,
            trim: true,
            default: '',
        },
        motherPhone: {
            type: String,
            trim: true,
            default: '',
        },
        motherEmail: {
            type: String,
            trim: true,
            default: '',
        },
        guardianName: {
            type: String,
            trim: true,
            default: '',
        },
        guardianBirthYear: {
            type: String,
            trim: true,
            default: '',
        },
        guardianOccupation: {
            type: String,
            trim: true,
            default: '',
        },
        guardianPhone: {
            type: String,
            trim: true,
            default: '',
        },
        guardianEmail: {
            type: String,
            trim: true,
            default: '',
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
childrenProfileSchema.index({ schoolId: 1, academicYearId: 1, _destroy: 1 }); // Main query
// ✅ Mỗi mã học sinh chỉ unique trong phạm vi: 1 trường + 1 năm học + còn hiệu lực (_destroy: false)
childrenProfileSchema.index(
    { schoolId: 1, academicYearId: 1, studentCode: 1 },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
        name: 'unique_studentCode_per_school_year',
    },
);
childrenProfileSchema.index({ classId: 1, _destroy: 1 }); // Filter by class
childrenProfileSchema.index({ fullName: 'text', studentCode: 'text' }); // Text search

export const ChildrenProfileModel = mongoose.model('ChildrenProfile', childrenProfileSchema);
