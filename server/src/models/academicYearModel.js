import mongoose from 'mongoose';

const SemesterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên học kỳ là bắt buộc'],
            trim: true,
            enum: ['Học kì I', 'Học kì II'],
        },
        startDate: {
            type: Date,
            required: [true, 'Ngày bắt đầu là bắt buộc'],
        },
        endDate: {
            type: Date,
            required: [true, 'Ngày kết thúc là bắt buộc'],
        },
    },
    { _id: true },
);

const AcademicYearSchema = new mongoose.Schema(
    {
        // ✅ Thêm schoolId
        schoolId: {
            type: String,
            required: [true, 'schoolId là bắt buộc'],
            ref: 'School',
        },
        fromYear: {
            type: Number,
            required: [true, 'Năm bắt đầu là bắt buộc'],
            min: [2000, 'Năm bắt đầu phải lớn hơn 2000'],
            max: [2100, 'Năm bắt đầu phải nhỏ hơn 2100'],
        },
        toYear: {
            type: Number,
            required: [true, 'Năm kết thúc là bắt buộc'],
            min: [2000, 'Năm kết thúc phải lớn hơn 2000'],
            max: [2100, 'Năm kết thúc phải nhỏ hơn 2100'],
        },
        semesters: {
            type: [SemesterSchema],
            validate: {
                validator: function (v) {
                    return v.length === 2;
                },
                message: 'Năm học phải có đúng 2 học kỳ',
            },
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active', // ✅ Mặc định là "Đang hoạt động"
        },
        // ✅ Thêm field isConfig
        isConfig: {
            type: Boolean,
            default: false, // Chưa cấu hình dữ liệu
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

// Validate toYear phải lớn hơn fromYear đúng 1 năm
AcademicYearSchema.pre('save', function (next) {
    if (this.toYear !== this.fromYear + 1) {
        next(new Error('Năm kết thúc phải lớn hơn năm bắt đầu đúng 1 năm'));
    }
    next();
});

// ✅ Index để tìm kiếm nhanh hơn và đảm bảo unique trong cùng trường
// ✅ Thêm _destroy vào index để cho phép tái tạo năm học đã xóa
// AcademicYearSchema.index(
//     { schoolId: 1, fromYear: 1, toYear: 1, _destroy: 1 },
//     {
//         unique: true,
//         partialFilterExpression: { _destroy: false }, // ✅ Chỉ áp dụng unique cho bản ghi chưa xóa
//     },
// );
// AcademicYearSchema.index({ schoolId: 1, status: 1 });
// AcademicYearSchema.index({ createdBy: 1 });

// ✅ Compound indexes
AcademicYearSchema.index({ schoolId: 1, status: 1, _destroy: 1 }); // ✅ Find active year
AcademicYearSchema.index({ schoolId: 1, fromYear: -1, _destroy: 1 }); // ✅ Sort by year
AcademicYearSchema.index({ schoolId: 1, isConfig: 1, _destroy: 1 }); // ✅ Find configured years

export const AcademicYearModel = mongoose.model('AcademicYear', AcademicYearSchema);
