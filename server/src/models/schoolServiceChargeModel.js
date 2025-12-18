// server/src/models/schoolServiceChargeModel.js

import mongoose from 'mongoose';

/**
 * ✅ Schema: Tiền dịch vụ của trường
 */
const SchoolServiceChargeSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        serviceName: {
            type: String,
            required: [true, 'Tên dịch vụ là bắt buộc'],
            trim: true,
            minlength: [2, 'Tên dịch vụ phải có ít nhất 2 ký tự'],
            maxlength: [200, 'Tên dịch vụ không được vượt quá 200 ký tự'],
        },
        serviceNameWithoutAccent: {
            type: String,
            trim: true,
            lowercase: true,
        },
        amount: {
            type: Number,
            required: [true, 'Tiền dịch vụ là bắt buộc'],
            min: [0, 'Tiền dịch vụ phải lớn hơn hoặc bằng 0'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự'],
            default: '',
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
    {
        timestamps: true,
    },
);

// ✅ Indexes
SchoolServiceChargeSchema.index({ schoolId: 1, _destroy: 1 });
SchoolServiceChargeSchema.index({ serviceNameWithoutAccent: 1 });

// ✅ Pre-save hook: Generate serviceNameWithoutAccent
SchoolServiceChargeSchema.pre('save', function (next) {
    if (this.isModified('serviceName')) {
        // Remove Vietnamese accents for search
        this.serviceNameWithoutAccent = this.serviceName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');
    }
    next();
});

export const SchoolServiceChargeModel = mongoose.model('SchoolServiceCharge', SchoolServiceChargeSchema);
