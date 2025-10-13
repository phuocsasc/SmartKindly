import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên trường học là bắt buộc'],
            trim: true,
            maxlength: [256, 'Tên trường học không được vượt quá 256 ký tự'],
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        address: {
            type: String,
            required: [true, 'Địa chỉ là bắt buộc'],
            trim: true,
            maxlength: [500, 'Địa chỉ không được vượt quá 500 ký tự'],
        },
        manager: {
            type: String,
            required: [true, 'Tên hiệu trưởng là bắt buộc'],
            trim: true,
            maxlength: [100, 'Tên hiệu trưởng không được vượt quá 100 ký tự'],
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
        },
        username: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'username không hợp lệ'],
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        // Tự động loại bỏ __v khi trả về JSON
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    },
);

// Index để tìm kiếm nhanh hơn
SchoolSchema.index({ name: 'text', address: 'text' });
SchoolSchema.index({ slug: 1 });

export const SchoolModel = mongoose.model('School', SchoolSchema);
