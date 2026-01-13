// server/src/models/userModel.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: function () {
                return this.role !== 'admin'; // Chỉ bắt buộc khi không phải admin
            },
            ref: 'School',
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            default: null,
        },
        // ✅ NEW: Liên kết phụ huynh với học sinh
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChildrenManagement',
            required: function () {
                return this.role === 'phu_huynh'; // Chỉ bắt buộc khi role là phụ huynh
            },
            index: true,
        },
        username: {
            type: String,
            required: [true, 'Tên tài khoản là bắt buộc'],
            unique: true,
            trim: true,
            minlength: [3, 'Tên tài khoản phải có ít nhất 3 ký tự'],
            maxlength: [50, 'Tên tài khoản không được vượt quá 50 ký tự'],
        },
        password: {
            type: String,
            required: [true, 'Mật khẩu là bắt buộc'],
            minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        },
        fullName: {
            type: String,
            required: [true, 'Họ tên là bắt buộc'],
            trim: true,
            minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
            maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
        },
        fullNameWithoutAccent: {
            type: String,
        },
        gender: {
            type: String,
            enum: ['Nam', 'Nữ', ''],
            default: '',
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ'],
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
        },
        role: {
            type: String,
            required: [true, 'Vai trò là bắt buộc'],
            enum: ['admin', 'ban_giam_hieu', 'to_truong', 'giao_vien', 'phu_huynh'],
            default: 'giao_vien',
        },
        isRoot: {
            type: Boolean,
            default: false,
        },
        status: {
            type: Boolean,
            default: true,
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
                delete ret.password;
                return ret;
            },
        },
    },
);

// ===== INDEXES =====
UserSchema.index({ schoolId: 1, role: 1, status: 1, _destroy: 1 });
UserSchema.index({ schoolId: 1, _destroy: 1 });
UserSchema.index({ email: 1, _destroy: 1 });
UserSchema.index({ username: 1, _destroy: 1 });
UserSchema.index({ classId: 1 });
UserSchema.index({ studentId: 1 }); // ✅ NEW: Index cho phụ huynh
UserSchema.index({ createdAt: -1 });

// Text search index
UserSchema.index(
    {
        fullName: 'text',
        username: 'text',
        email: 'text',
        phone: 'text',
    },
    {
        weights: {
            fullName: 10,
            username: 5,
            email: 3,
            phone: 2,
        },
        name: 'user_text_search',
    },
);

// ===== METHODS =====
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method: Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Static method: Tạo userId tự động (8 chữ số random)
UserSchema.statics.generateUserId = async function () {
    const lastUser = await this.findOne().sort({ userId: -1 }).select('userId').lean();
    return lastUser ? lastUser.userId + 1 : 10000001;
};

// ===== PRE-SAVE MIDDLEWARE =====
UserSchema.pre('save', function (next) {
    if (this.fullName) {
        this.fullNameWithoutAccent = this.fullName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    }
    next();
});

export const UserModel = mongoose.model('User', UserSchema);
