import mongoose from 'mongoose';

/**
 * Schema: Children By Class (Danh sách trẻ theo lớp)
 * - Quản lý trẻ em trong từng lớp học của từng năm học
 * - Chỉ BGH mới được thao tác thêm/sửa
 * - Chỉ được thao tác trên năm học đang active
 */
const ChildrenByClassSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'Mã trường là bắt buộc'],
            ref: 'School',
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: [true, 'Năm học là bắt buộc'],
            index: true,
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: [true, 'Lớp học là bắt buộc'],
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChildrenManagement',
            required: [true, 'Học sinh là bắt buộc'],
            index: true,
        },
        // ✅ THÊM: Trạng thái quản lý riêng cho từng năm học
        managementStatus: {
            type: String,
            enum: {
                values: ['Đang học', 'Nghỉ học'],
                message: 'Trạng thái không hợp lệ',
            },
            required: [true, 'Trạng thái quản lý là bắt buộc'],
            default: 'Đang học',
        },

        // ===== METADATA =====
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
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
        collection: 'children_by_class',
    },
);

// ✅ Index cho performance
ChildrenByClassSchema.index({ schoolId: 1, academicYearId: 1, classId: 1 });
ChildrenByClassSchema.index({ schoolId: 1, academicYearId: 1, studentId: 1 });
ChildrenByClassSchema.index({ _destroy: 1 });

// ✅ Unique constraint: 1 học sinh chỉ có 1 lớp trong 1 năm học
ChildrenByClassSchema.index(
    { schoolId: 1, academicYearId: 1, studentId: 1 },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
    },
);

export const ChildrenByClassModel = mongoose.model('ChildrenByClass', ChildrenByClassSchema);
