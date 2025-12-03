import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
    {
        // ✅ Người nhận thông báo
        recipientUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient user ID là bắt buộc'],
            index: true,
        },

        // ✅ Trường học
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },

        // ✅ Tiêu đề
        title: {
            type: String,
            required: [true, 'Tiêu đề là bắt buộc'],
            trim: true,
        },

        // ✅ Nội dung
        message: {
            type: String,
            required: [true, 'Nội dung là bắt buộc'],
            trim: true,
        },

        // ✅ Metadata (thông tin chi tiết)
        meta: {
            classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
            className: { type: String },
            academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
            academicYearName: { type: String },
            departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
            departmentName: { type: String },
            actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            actionByName: { type: String },
        },

        // ✅ Trạng thái đọc
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        // ✅ Thời gian đọc
        readAt: {
            type: Date,
            default: null,
        },

        // ✅ Soft delete
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: 'notifications',
    },
);

// ✅ Index compound để tối ưu query
NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ schoolId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model('Notification', NotificationSchema);
