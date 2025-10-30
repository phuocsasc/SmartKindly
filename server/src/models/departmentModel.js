import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
    {
        departmentId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: [true, 'Năm học là bắt buộc'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Tên tổ bộ môn là bắt buộc'],
            enum: {
                values: [
                    'Cán bộ quản lý',
                    'Tổ cấp dưỡng',
                    'Tổ Văn Phòng',
                    'Khối Nhà Trẻ',
                    'Khối Mầm',
                    'Khối Chồi',
                    'Khối Lá',
                ],
                message: 'Tên tổ bộ môn không hợp lệ',
            },
        },
        managers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        note: {
            type: String,
            minlength: [3, 'Ghi chú phải có ít nhất 3 ký tự'],
            maxlength: [200, 'Ghi chú không được vượt quá 200 ký tự'],
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
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
                return ret;
            },
        },
    },
);

// Index compound để tránh trùng lặp tổ bộ môn trong cùng năm học
// DepartmentSchema.index({ schoolId: 1, academicYearId: 1, name: 1, _destroy: 1 }, { unique: true });

// ✅ Compound indexes
DepartmentSchema.index({ schoolId: 1, academicYearId: 1, _destroy: 1 }); // ✅ Main query
DepartmentSchema.index({ schoolId: 1, academicYearId: 1, name: 1, _destroy: 1 }); // ✅ Unique + filter
DepartmentSchema.index({ managers: 1 }); // ✅ Find by manager
DepartmentSchema.index({ createdAt: -1 }); // ✅ Sort

// ✅ Text search
DepartmentSchema.index({ name: 'text' });

// Static method: Tạo departmentId tự động
DepartmentSchema.statics.generateDepartmentId = async function () {
    let departmentId;
    let isUnique = false;

    while (!isUnique) {
        departmentId = `DEPT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const existing = await this.findOne({ departmentId });
        if (!existing) {
            isUnique = true;
        }
    }

    return departmentId;
};

// Helper method: Lấy role được phép theo tên tổ bộ môn
DepartmentSchema.statics.getAllowedRolesByDepartmentName = function (departmentName) {
    const roleMapping = {
        'Cán bộ quản lý': ['ban_giam_hieu'],
        'Tổ cấp dưỡng': ['giao_vien'],
        'Tổ Văn Phòng': ['ke_toan'],
        'Khối Nhà Trẻ': ['to_truong'],
        'Khối Mầm': ['to_truong'],
        'Khối Chồi': ['to_truong'],
        'Khối Lá': ['to_truong'],
    };

    return roleMapping[departmentName] || [];
};

export const DepartmentModel = mongoose.model('Department', DepartmentSchema);
