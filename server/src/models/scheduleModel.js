// server/src/models/scheduleModel.js

import mongoose from 'mongoose';

/**
 * ✅ Schema: Activity Period (Mốc hoạt động)
 * - Mỗi mốc hoạt động có thời gian bắt đầu, kết thúc và mô tả
 */
const ActivityPeriodSchema = new mongoose.Schema(
    {
        startTime: {
            type: String,
            required: [true, 'Thời gian bắt đầu là bắt buộc'],
            trim: true,
            match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian phải là HH:mm (ví dụ: 07:30)'],
        },
        endTime: {
            type: String,
            required: [true, 'Thời gian kết thúc là bắt buộc'],
            trim: true,
            match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian phải là HH:mm (ví dụ: 08:00)'],
        },
        description: {
            type: String,
            required: [true, 'Mô tả hoạt động là bắt buộc'],
            trim: true,
        },
        order: {
            type: Number,
            required: true,
        },
    },
    { _id: true },
);

/**
 * ✅ Schema: Week Schedule (Lịch theo tuần)
 * - Mỗi tuần có ngày bắt đầu, ngày kết thúc và các mốc hoạt động
 */
const WeekScheduleSchema = new mongoose.Schema(
    {
        weekNumber: {
            type: Number,
            required: [true, 'Số tuần là bắt buộc'],
            min: 1,
        },
        startDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu tuần là bắt buộc'],
        },
        endDate: {
            type: Date,
            required: [true, 'Ngày kết thúc tuần là bắt buộc'],
        },
        activityPeriods: {
            type: [ActivityPeriodSchema],
            default: [],
        },
    },
    { _id: true },
);

/**
 * ✅ Main Schema: Schedule (Thời khóa biểu)
 * - Phạm vi: Mỗi trường, mỗi năm học
 * - Tự động tạo theo năm học đang hoạt động
 */
const ScheduleSchema = new mongoose.Schema(
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
        weeks: {
            type: [WeekScheduleSchema],
            default: [],
        },
        // ✅ NEW: Array of holiday dates
        holidays: {
            type: [Date],
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
        collection: 'schedules',
    },
);

// ✅ Index để tìm kiếm nhanh
ScheduleSchema.index({ schoolId: 1, academicYearId: 1, _destroy: 1 });

// ✅ Unique constraint: Mỗi trường chỉ có 1 thời khóa biểu cho mỗi năm học
ScheduleSchema.index(
    { schoolId: 1, academicYearId: 1 },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
        name: 'unique_school_schedule_per_year',
    },
);

// ✅ Virtual để validate thời gian liên tiếp
ActivityPeriodSchema.path('endTime').validate(function (value) {
    const startTime = this.startTime;
    const endTime = value;

    if (!startTime || !endTime) return true;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return endMinutes > startMinutes;
}, 'Thời gian kết thúc phải sau thời gian bắt đầu');

export const ScheduleModel = mongoose.model('Schedule', ScheduleSchema);
