import mongoose from 'mongoose';

const childrenAttendanceSchema = new mongoose.Schema(
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
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: [true, 'Lớp học là bắt buộc'],
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChildrenProfile',
            required: [true, 'Học sinh là bắt buộc'],
            index: true,
        },
        date: {
            type: Date,
            required: [true, 'Ngày điểm danh là bắt buộc'],
            index: true,
        },
        weekNumber: {
            type: Number,
            required: [true, 'Tuần là bắt buộc'],
            min: 1,
            max: 52,
        },
        dayOfWeek: {
            type: String,
            required: [true, 'Thứ trong tuần là bắt buộc'],
            enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
        },
        status: {
            type: String,
            required: [true, 'Trạng thái điểm danh là bắt buộc'],
            enum: ['Có mặt', 'Vắng có phép', 'Vắng không phép', 'Đi trễ', 'Chưa điểm danh'],
            default: 'Có mặt',
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Người tạo là bắt buộc'],
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
        collection: 'childrenattendances',
    },
);

// ✅ Compound unique index: 1 học sinh chỉ được điểm danh 1 lần/ngày
childrenAttendanceSchema.index(
    { schoolId: 1, studentId: 1, date: 1, _destroy: 1 },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
    },
);

// ✅ Index để query nhanh
childrenAttendanceSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, date: 1 });
childrenAttendanceSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, weekNumber: 1 });

export const ChildrenAttendanceModel = mongoose.model('ChildrenAttendance', childrenAttendanceSchema);
