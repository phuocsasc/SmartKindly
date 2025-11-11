// server/src/models/schoolEducationalActivityModel.js

import mongoose from 'mongoose';

/**
 * ✅ Schema: School Educational Activity (Hoạt động giáo dục của trường)
 * - Phạm vi: Mỗi trường, mỗi năm học
 * - Mỗi mục tiêu chỉ có 1 hoạt động giáo dục
 */
const SchoolEducationalActivitySchema = new mongoose.Schema(
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
                    'Nhà trẻ 3-12 tháng',
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
        schoolYearTargetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolYearTarget',
            required: [true, 'Mục tiêu năm học là bắt buộc'],
            index: true,
        },
        mainFieldCode: {
            type: String,
            required: true,
        },
        subFieldCode: {
            type: String,
            default: null,
        },
        expectedResultCode: {
            type: String,
            required: true,
        },
        targetCode: {
            type: String,
            required: true,
            index: true,
        },
        activityContent: {
            type: String,
            required: [true, 'Nội dung hoạt động giáo dục là bắt buộc'],
            trim: true,
        },
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
        collection: 'schoolEducationalActivities',
    },
);

// ✅ Index để tìm kiếm nhanh
SchoolEducationalActivitySchema.index({ schoolId: 1, academicYearId: 1, ageGroup: 1, _destroy: 1 });
SchoolEducationalActivitySchema.index({ ageGroup: 1, targetCode: 1, _destroy: 1 });
SchoolEducationalActivitySchema.index({ schoolYearTargetId: 1, _destroy: 1 });

// ✅ FIX: Unique constraint - CHỈ áp dụng cho bản ghi chưa xóa (_destroy: false)
SchoolEducationalActivitySchema.index(
    {
        schoolId: 1,
        academicYearId: 1,
        ageGroup: 1,
        mainFieldCode: 1,
        subFieldCode: 1,
        expectedResultCode: 1,
        targetCode: 1,
    },
    {
        unique: true,
        partialFilterExpression: { _destroy: false }, // ✅ Chỉ áp dụng unique cho bản ghi chưa xóa
        name: 'unique_school_activity_not_deleted', // ✅ Đặt tên index rõ ràng
    },
);

export const SchoolEducationalActivityModel = mongoose.model(
    'SchoolEducationalActivity',
    SchoolEducationalActivitySchema,
);
