// server/src/models/parentRequestModel.js

import mongoose from 'mongoose';

const parentRequestSchema = new mongoose.Schema(
    {
        // ===== LIÊN KẾT =====
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
            ref: 'ChildrenManagement',
            required: [true, 'Học sinh là bắt buộc'],
            index: true,
        },

        // ===== NỘI DUNG PHIẾU =====
        requestName: {
            type: String,
            required: [true, 'Tên phiếu là bắt buộc'],
            trim: true,
            maxlength: [200, 'Tên phiếu không được vượt quá 200 ký tự'],
        },
        fromDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu là bắt buộc'],
        },
        toDate: {
            type: Date,
            required: [true, 'Ngày kết thúc là bắt buộc'],
        },
        parentNote: {
            type: String,
            required: [true, 'Dặn dò của phụ huynh là bắt buộc'],
            trim: true,
            maxlength: [2000, 'Dặn dò không được vượt quá 2000 ký tự'],
        },
        teacherReply: {
            type: String,
            default: '',
            trim: true,
            maxlength: [2000, 'Phản hồi không được vượt quá 2000 ký tự'],
        },
        status: {
            type: String,
            enum: {
                values: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'],
                message: 'Trạng thái không hợp lệ',
            },
            default: 'Chờ duyệt',
        },

        // ===== METADATA =====
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
        collection: 'parent_requests',
    },
);

// ✅ Indexes
parentRequestSchema.index({ schoolId: 1, academicYearId: 1, classId: 1 });
parentRequestSchema.index({ studentId: 1, academicYearId: 1 });
parentRequestSchema.index({ status: 1 });
parentRequestSchema.index({ fromDate: 1, toDate: 1 });

// ✅ Validation: fromDate <= toDate
parentRequestSchema.pre('save', function (next) {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
        return next(new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'));
    }
    next();
});

export const ParentRequestModel = mongoose.model('ParentRequest', parentRequestSchema);
