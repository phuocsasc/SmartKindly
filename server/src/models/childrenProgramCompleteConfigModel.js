// server/src/models/childrenProgramCompleteConfigModel.js

import mongoose from 'mongoose';

// ✅ Schema cho chi tiết đánh giá từng mục tiêu
const AssessmentDetailSchema = new mongoose.Schema({
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
        default: 0,
    },
});

// ✅ Schema chính: Đánh giá trẻ hoàn thành chương trình (1 năm/1 học sinh)
const ChildrenProgramCompleteSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: true,
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: true,
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChildrenManagement',
            required: true,
            index: true,
        },
        // Chi tiết đánh giá từng mục tiêu
        assessmentDetails: [AssessmentDetailSchema],
        // Ghi chú nhận xét tổng kết
        note: {
            type: String,
            default: '',
            maxlength: 2000,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

// ✅ Unique constraint: 1 học sinh chỉ được đánh giá 1 lần/năm học
ChildrenProgramCompleteSchema.index(
    { schoolId: 1, academicYearId: 1, studentId: 1, _destroy: 1 },
    { unique: true, sparse: true },
);

export const ChildrenProgramCompleteModel = mongoose.model('ChildrenProgramComplete', ChildrenProgramCompleteSchema);

// ✅ Schema cấu hình mục tiêu (Ban giám hiệu cấu hình)
const ChildrenProgramCompleteConfigSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: true,
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        ageGroup: {
            type: String,
            required: true,
            enum: [
                'Nhà trẻ 12-24 tháng',
                'Nhà trẻ 24-36 tháng',
                'Khối mầm 3-4 tuổi',
                'Khối chồi 4-5 tuổi',
                'Khối lá 5-6 tuổi',
            ],
        },
        // Danh sách các targetId được chọn (tối thiểu 5)
        selectedTargetIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

// ✅ Unique constraint: 1 nhóm tuổi chỉ có 1 cấu hình/năm học
ChildrenProgramCompleteConfigSchema.index(
    { schoolId: 1, academicYearId: 1, ageGroup: 1, _destroy: 1 },
    { unique: true, sparse: true },
);

export const ChildrenProgramCompleteConfigModel = mongoose.model(
    'ChildrenProgramCompleteConfig',
    ChildrenProgramCompleteConfigSchema,
);
