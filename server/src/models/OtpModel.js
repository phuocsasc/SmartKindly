import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Tự động xóa document khi hết hạn
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

// Index để tìm kiếm nhanh
OtpSchema.index({ email: 1, isUsed: 1 });

export const OtpModel = mongoose.model('Otp', OtpSchema);
