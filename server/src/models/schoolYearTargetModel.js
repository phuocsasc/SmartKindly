import mongoose from 'mongoose';

/**
 * ✅ Sub-schema: Target (Mục tiêu cụ thể)
 */
const TargetSchema = new mongoose.Schema(
    {
        code: {
            type: String, // "MT1", "MT2"...
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    { _id: true },
);

/**
 * ✅ Sub-schema: Expected Result (Kết quả mong đợi)
 */
const ExpectedResultSchema = new mongoose.Schema(
    {
        code: {
            type: String, // "1", "2", "3"...
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        targets: [TargetSchema],
    },
    { _id: true },
);

/**
 * ✅ Sub-schema: Sub Field (Lĩnh vực con - a, b, c...)
 */
const SubFieldSchema = new mongoose.Schema(
    {
        code: {
            type: String, // "a)", "b)", "c)"...
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        expectedResults: [ExpectedResultSchema],
    },
    { _id: true },
);

/**
 * ✅ Main Field Schema (Lĩnh vực chính - I, II, III, IV, V)
 */
const MainFieldSchema = new mongoose.Schema(
    {
        code: {
            type: String, // "I", "II", "III", "IV", "V"
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        subFields: [SubFieldSchema],
        expectedResults: [ExpectedResultSchema], // Cho trường hợp không có subFields
    },
    { _id: true },
);

/**
 * ✅ Main Schema: School Year Target
 */
const SchoolYearTargetSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: [true, 'Năm học là bắt buộc'],
            index: true,
        },
        ageGroup: {
            type: String,
            required: [true, 'Nhóm tuổi là bắt buộc'],
            enum: {
                values: [
                    'Nhà trẻ 12-24 tháng',
                    'Nhà trẻ 24-36 tháng',
                    'Khối mầm 3-4 tuổi',
                    'Khối chồi 4-5 tuổi',
                    'Khối lá 5-6 tuổi',
                ],
                message: 'Nhóm tuổi không hợp lệ',
            },
            index: true,
        },
        mainFields: [MainFieldSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
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
    {
        timestamps: true,
        collection: 'schoolYearTargets',
    },
);

// ✅ Index để tìm kiếm nhanh
SchoolYearTargetSchema.index({ schoolId: 1, academicYearId: 1, ageGroup: 1, _destroy: 1 });

export const SchoolYearTargetModel = mongoose.model('SchoolYearTarget', SchoolYearTargetSchema);
