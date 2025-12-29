import mongoose from 'mongoose';

const SchoolMenuApplySchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: true,
            ref: 'School',
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        ageGroup: {
            type: String,
            required: true,
            enum: ['Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)'],
        },
        weekNumber: {
            type: Number,
            required: true,
            min: 1,
        },
        dayOfWeek: {
            type: String,
            required: true,
            enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
        },
        // ✅ Thông tin ngày cụ thể
        date: {
            type: Date,
            required: true,
        },
        // ✅ Tham chiếu đến thực đơn được áp dụng
        menuId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolMenu',
            required: true,
        },
        // ✅ Snapshot thông tin thực đơn (để lưu trữ lịch sử)
        menuSnapshot: {
            menuName: { type: String, required: true },
            numberOfChildren: { type: Number, required: true },
            meals: {
                'Bữa sáng': [
                    {
                        mealId: { type: mongoose.Schema.Types.ObjectId },
                        name: { type: String },
                    },
                ],
                'Bữa trưa': [
                    {
                        mealId: { type: mongoose.Schema.Types.ObjectId },
                        name: { type: String },
                    },
                ],
                'Bữa xế': [
                    {
                        mealId: { type: mongoose.Schema.Types.ObjectId },
                        name: { type: String },
                    },
                ],
                'Bữa phụ': [
                    {
                        mealId: { type: mongoose.Schema.Types.ObjectId },
                        name: { type: String },
                    },
                ],
            },
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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
    { timestamps: true },
);

// ✅ Index để tránh trùng lặp: cùng schoolId, academicYear, ageGroup, weekNumber, dayOfWeek
SchoolMenuApplySchema.index({
    schoolId: 1,
    academicYearId: 1,
    ageGroup: 1,
    weekNumber: 1,
    dayOfWeek: 1,
    _destroy: 1,
});

export const SchoolMenuApplyModel = mongoose.model('SchoolMenuApply', SchoolMenuApplySchema);
