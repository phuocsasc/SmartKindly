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
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

// ✅ TTL index đúng chuẩn (hết hạn đúng thời gian)
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ✅ Index tối ưu kiểm tra OTP
OtpSchema.index({ email: 1, otp: 1, isUsed: 1 });

export const OtpModel = mongoose.model('Otp', OtpSchema);
