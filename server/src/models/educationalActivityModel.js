// server/src/models/educationalActivityModel.js

import mongoose from 'mongoose';

/**
 * ✅ Schema: Educational Activity Plan (Kế hoạch giáo dục)
 * - Mỗi mục tiêu (MT1, MT2...) chỉ có 1 hoạt động giáo dục
 */
const EducationalActivitySchema = new mongoose.Schema(
    {
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
        yearTargetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'YearTarget',
            required: [true, 'Mục tiêu năm học là bắt buộc'],
            index: true,
        },

        // ✅ NEW: Primary key - targetId thay vì targetCode
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        // ✅ Định danh chính xác vị trí trong cấu trúc Year Target
        mainFieldCode: {
            type: String, // "I", "II", "III", "IV", "V"
            required: true,
        },
        subFieldCode: {
            type: String, // "a)", "b)", "c)" hoặc null
            default: null,
        },
        expectedResultCode: {
            type: String, // "1", "2", "3"...
            required: true,
        },

        // ✅ Keep targetCode as snapshot (for display/debugging)
        targetCode: {
            type: String, // "MT1", "MT2", "MT3"...
            required: true,
            index: true,
        },
        // ✅ Nội dung hoạt động giáo dục (giữ nguyên format: xuống dòng, dấu cách...)
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
        collection: 'educationalActivities',
    },
);

// ✅ Index để tìm kiếm nhanh
EducationalActivitySchema.index({ ageGroup: 1, targetCode: 1, _destroy: 1 });
EducationalActivitySchema.index({ yearTargetId: 1, _destroy: 1 });
EducationalActivitySchema.index({ targetId: 1, _destroy: 1 }); // ✅ NEW

// ✅ NEW: Unique constraint by targetId
EducationalActivitySchema.index(
    {
        ageGroup: 1,
        targetId: 1,
    },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
        name: 'unique_admin_activity_by_targetId',
    },
);

export const EducationalActivityModel = mongoose.model('EducationalActivity', EducationalActivitySchema);
