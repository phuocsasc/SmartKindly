import mongoose from 'mongoose';
import { AUDIT_LOG_ACTIONS } from '~/config/auditLogConfig.js';

const auditLogSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userRole: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            enum: Object.values(AUDIT_LOG_ACTIONS),
            required: true,
        },
        resource: {
            type: String,
            required: true, // Ví dụ: 'Năm học', 'Lớp học', 'Hồ sơ trẻ', 'Tổ bộ môn'
        },
        resourceId: {
            type: String, // ID của đối tượng bị tác động
        },
        description: {
            type: String,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // Dữ liệu bổ sung (old/new values)
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: 'audit_logs',
    },
);

// ✅ Indexes
auditLogSchema.index({ schoolId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);
