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
            maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
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
            enum: ['admin', 'ban_giam_hieu', 'to_truong', 'giao_vien', 'ke_toan', 'phu_huynh'],
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

// Index
UserSchema.index({ username: 1 });
UserSchema.index({ userId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ fullName: 'text' });
UserSchema.index({ schoolId: 1 });

// Middleware: Hash password
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method: Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Static method: Tạo userId tự động (8 chữ số random)
UserSchema.statics.generateUserId = async function () {
    let userId;
    let isUnique = false;

    while (!isUnique) {
        userId = Math.floor(10000000 + Math.random() * 90000000);
        const existing = await this.findOne({ userId, _destroy: false });
        if (!existing) {
            isUnique = true;
        }
    }

    return userId;
};

export const UserModel = mongoose.model('User', UserSchema);
