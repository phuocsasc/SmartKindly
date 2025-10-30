import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
    {
        classId: {
            type: String,
            required: [true, 'Mã lớp là bắt buộc'],
            unique: true,
            trim: true,
        },
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: [true, 'Năm học là bắt buộc'],
            index: true,
        },
        grade: {
            type: String,
            required: [true, 'Khối là bắt buộc'],
            enum: {
                values: ['Nhà trẻ', 'Mầm', 'Chồi', 'Lá'],
                message: 'Khối không hợp lệ',
            },
        },
        ageGroup: {
            type: String,
            required: [true, 'Nhóm lớp là bắt buộc'],
            enum: {
                values: [
                    // Nhà trẻ
                    '3-12 tháng',
                    '13-24 tháng',
                    '25-36 tháng',
                    // Mầm
                    '3-4 tuổi',
                    // Chồi
                    '4-5 tuổi',
                    // Lá
                    '5-6 tuổi',
                ],
                message: 'Nhóm lớp không hợp lệ',
            },
        },
        name: {
            type: String,
            required: [true, 'Tên lớp là bắt buộc'],
            trim: true,
            minlength: [2, 'Tên lớp phải có ít nhất 2 ký tự'],
            maxlength: [100, 'Tên lớp không được vượt quá 100 ký tự'],
        },
        homeRoomTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Giáo viên chủ nhiệm là bắt buộc'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Mô tả không được vượt quá 500 ký tự'],
        },
        sessions: {
            morning: {
                type: Boolean,
                default: false,
            },
            afternoon: {
                type: Boolean,
                default: false,
            },
            evening: {
                type: Boolean,
                default: false,
            },
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

// Validate ít nhất một buổi học được chọn
ClassSchema.pre('save', function (next) {
    if (!this.sessions.morning && !this.sessions.afternoon && !this.sessions.evening) {
        next(new Error('Phải chọn ít nhất một buổi học'));
    }
    next();
});

// Validate ageGroup phù hợp với grade
ClassSchema.pre('save', function (next) {
    const ageGroupsByGrade = {
        'Nhà trẻ': ['3-12 tháng', '13-24 tháng', '25-36 tháng'],
        Mầm: ['3-4 tuổi'],
        Chồi: ['4-5 tuổi'],
        Lá: ['5-6 tuổi'],
    };

    const validAgeGroups = ageGroupsByGrade[this.grade];
    if (!validAgeGroups || !validAgeGroups.includes(this.ageGroup)) {
        next(new Error(`Nhóm lớp "${this.ageGroup}" không phù hợp với khối "${this.grade}"`));
    }
    next();
});

// Index compound để tránh trùng lặp tên lớp trong cùng năm học
// ClassSchema.index(
//     { schoolId: 1, academicYearId: 1, name: 1, _destroy: 1 },
//     {
//         unique: true,
//         partialFilterExpression: { _destroy: false },
//     },
// );

// ✅ Compound indexes
ClassSchema.index({ schoolId: 1, academicYearId: 1, _destroy: 1 }); // ✅ Main query
ClassSchema.index({ schoolId: 1, academicYearId: 1, grade: 1, _destroy: 1 }); // ✅ Filter by grade
ClassSchema.index({ homeRoomTeacher: 1, _destroy: 1 }); // ✅ Find by teacher
ClassSchema.index({ createdAt: -1 }); // ✅ Sort

// ✅ Text search
ClassSchema.index({ name: 'text' });

// Static method: Tạo classId tự động
ClassSchema.statics.generateClassId = async function () {
    let classId;
    let isUnique = false;

    while (!isUnique) {
        classId = `CLASS${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const existing = await this.findOne({ classId });
        if (!existing) {
            isUnique = true;
        }
    }

    return classId;
};

// Helper method: Lấy danh sách nhóm lớp theo khối
ClassSchema.statics.getAgeGroupsByGrade = function (grade) {
    const ageGroupMapping = {
        'Nhà trẻ': ['3-12 tháng', '13-24 tháng', '25-36 tháng'],
        Mầm: ['3-4 tuổi'],
        Chồi: ['4-5 tuổi'],
        Lá: ['5-6 tuổi'],
    };

    return ageGroupMapping[grade] || [];
};

export const ClassModel = mongoose.model('Class', ClassSchema);
