import mongoose from 'mongoose';

/**
 * Schema: Children Management (Danh sách trẻ toàn trường)
 * - Dữ liệu CHUNG cho tất cả các năm học
 * - Mỗi trường quản lý danh sách trẻ riêng (schoolId)
 */
const ChildrenManagementSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'Mã trường là bắt buộc'],
            ref: 'School',
            index: true,
        },

        // ===== THÔNG TIN HỌC SINH =====
        fullName: {
            type: String,
            required: [true, 'Họ và tên là bắt buộc'],
            trim: true,
            minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
            maxlength: [100, 'Họ tên không được vượt quá 100 ký tự'],
        },
        fullNameWithoutAccent: {
            type: String,
            trim: true,
            lowercase: true,
        },
        nickname: {
            type: String,
            trim: true,
            maxlength: [50, 'Biệt danh không được vượt quá 50 ký tự'],
            default: '',
        },
        birthDate: {
            type: Date,
            required: [true, 'Ngày sinh là bắt buộc'],
        },
        gender: {
            type: String,
            required: [true, 'Giới tính là bắt buộc'],
            enum: {
                values: ['Nam', 'Nữ'],
                message: 'Giới tính không hợp lệ',
            },
        },
        ethnicity: {
            type: String,
            required: [true, 'Dân tộc là bắt buộc'],
            default: 'Kinh',
            trim: true,
            maxlength: [50, 'Tên dân tộc không được vượt quá 50 ký tự'],
        },
        studentCode: {
            type: String,
            required: [true, 'Mã học sinh là bắt buộc'],
            trim: true,
            index: true,
        },

        // ===== THÔNG TIN HỌC TẬP =====
        enrollmentDate: {
            type: Date,
            required: [true, 'Ngày nhập học là bắt buộc'],
        },
        currentAgeGroup: {
            type: String,
            required: [true, 'Nhóm tuổi hiện tại là bắt buộc'],
            enum: {
                values: ['12-24 tháng', '24-36 tháng', '3-4 tuổi', '4-5 tuổi', '5-6 tuổi'],
                message: 'Nhóm tuổi hiện tại không hợp lệ',
            },
            trim: true,
        },
        currentClassName: {
            type: String,
            default: 'Chưa có',
            trim: true,
        },
        status: {
            type: String,
            required: [true, 'Trạng thái là bắt buộc'],
            enum: {
                values: ['Đang học', 'Nghỉ học'],
                message: 'Trạng thái không hợp lệ',
            },
            default: 'Đang học',
        },
        hasClass: {
            type: Boolean,
            default: false,
        },

        // ===== THÔNG TIN GIA ĐÌNH =====
        motherName: {
            type: String,
            trim: true,
            maxlength: [100, 'Họ tên mẹ không được vượt quá 100 ký tự'],
            default: '',
        },
        motherBirthYear: {
            type: Number,
            min: [1940, 'Năm sinh không hợp lệ'],
            max: [new Date().getFullYear(), 'Năm sinh không hợp lệ'],
        },
        motherPhone: {
            type: String,
            trim: true,
            match: [/^[0-9]{10}$/, 'Số điện thoại mẹ phải có đúng 10 chữ số'],
            default: '',
        },
        motherEmail: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Email mẹ không hợp lệ'],
            default: '',
        },
        fatherName: {
            type: String,
            trim: true,
            maxlength: [100, 'Họ tên bố không được vượt quá 100 ký tự'],
            default: '',
        },
        fatherBirthYear: {
            type: Number,
            min: [1940, 'Năm sinh không hợp lệ'],
            max: [new Date().getFullYear(), 'Năm sinh không hợp lệ'],
        },
        fatherPhone: {
            type: String,
            trim: true,
            match: [/^[0-9]{10}$/, 'Số điện thoại bố phải có đúng 10 chữ số'],
            default: '',
        },
        fatherEmail: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Email bố không hợp lệ'],
            default: '',
        },

        // ===== THÔNG TIN ĐỊA CHỈ =====
        permanentAddress: {
            type: String,
            required: [true, 'Địa chỉ thường trú là bắt buộc'],
            trim: true,
            maxlength: [300, 'Địa chỉ thường trú không được vượt quá 300 ký tự'],
        },
        currentAddress: {
            type: String,
            required: [true, 'Địa chỉ hiện tại là bắt buộc'],
            trim: true,
            maxlength: [300, 'Địa chỉ hiện tại không được vượt quá 300 ký tự'],
        },

        // ===== METADATA =====
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
        collection: 'childrenmanagements',
    },
);

// ===== INDEXES =====
// ✅ Mã học sinh unique trong 1 trường (chỉ khi chưa xóa)
ChildrenManagementSchema.index(
    { schoolId: 1, studentCode: 1 },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
        name: 'unique_studentCode_per_school',
    },
);

// ✅ Index cho tìm kiếm nhanh
ChildrenManagementSchema.index({ schoolId: 1, _destroy: 1 });
ChildrenManagementSchema.index({ schoolId: 1, status: 1, _destroy: 1 });
ChildrenManagementSchema.index({ schoolId: 1, hasClass: 1, _destroy: 1 });
ChildrenManagementSchema.index({ fullName: 'text', fullNameWithoutAccent: 'text', studentCode: 'text' });

// ===== MIDDLEWARE =====
// ✅ Tạo fullNameWithoutAccent trước khi save
ChildrenManagementSchema.pre('save', function (next) {
    if (this.isModified('fullName')) {
        const removeVietnameseTones = (str) => {
            return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .toLowerCase();
        };
        this.fullNameWithoutAccent = removeVietnameseTones(this.fullName);
    }
    next();
});

export const ChildrenManagementModel = mongoose.model('ChildrenManagement', ChildrenManagementSchema);
