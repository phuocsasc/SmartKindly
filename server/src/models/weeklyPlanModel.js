// server/src/models/weeklyPlanModel.js

import mongoose from 'mongoose';

/**
 * ✅ Schema: Daily Activity Detail (Chi tiết hoạt động theo ngày)
 * - Mỗi ngày (Thứ 2 - Thứ 6) có nhiều mốc hoạt động
 */
const DailyActivityDetailSchema = new mongoose.Schema(
    {
        activityPeriodId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'ID mốc hoạt động là bắt buộc'],
        },
        startTime: {
            type: String,
            required: [true, 'Thời gian bắt đầu là bắt buộc'],
        },
        endTime: {
            type: String,
            required: [true, 'Thời gian kết thúc là bắt buộc'],
        },
        description: {
            type: String,
            required: [true, 'Mô tả mốc hoạt động là bắt buộc'],
        },
        detailedContent: {
            type: String,
            default: '',
            trim: false, // ✅ Không trim để giữ nguyên format (dấu cách, xuống dòng)
        },
    },
    { _id: true },
);

/**
 * ✅ Schema: Weekly Plan (Kế hoạch giáo dục chi tiết theo tuần)
 * - Mỗi lớp, mỗi tuần có 1 kế hoạch
 * - Mỗi ngày trong tuần (Thứ 2 - Thứ 6) có nhiều mốc hoạt động
 */
const WeeklyPlanSchema = new mongoose.Schema(
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
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: [true, 'Lớp học là bắt buộc'],
            index: true,
        },
        scheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Schedule',
            required: [true, 'Thời khóa biểu là bắt buộc'],
            index: true,
        },
        weekNumber: {
            type: Number,
            required: [true, 'Số tuần là bắt buộc'],
            min: 1,
            index: true,
        },
        weekStartDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu tuần là bắt buộc'],
        },
        weekEndDate: {
            type: Date,
            required: [true, 'Ngày kết thúc tuần là bắt buộc'],
        },
        // ✅ Chi tiết hoạt động cho từng ngày (Thứ 2 - Thứ 6)
        monday: {
            type: [DailyActivityDetailSchema],
            default: [],
        },
        tuesday: {
            type: [DailyActivityDetailSchema],
            default: [],
        },
        wednesday: {
            type: [DailyActivityDetailSchema],
            default: [],
        },
        thursday: {
            type: [DailyActivityDetailSchema],
            default: [],
        },
        friday: {
            type: [DailyActivityDetailSchema],
            default: [],
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
        collection: 'weeklyPlans',
    },
);

// ✅ Index để tìm kiếm nhanh
WeeklyPlanSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, weekNumber: 1, _destroy: 1 });

// ✅ Unique constraint: Mỗi lớp chỉ có 1 kế hoạch cho mỗi tuần
WeeklyPlanSchema.index(
    { schoolId: 1, academicYearId: 1, classId: 1, weekNumber: 1 },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
        name: 'unique_weekly_plan_per_class_week',
    },
);

export const WeeklyPlanModel = mongoose.model('WeeklyPlan', WeeklyPlanSchema);
