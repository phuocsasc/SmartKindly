import mongoose from 'mongoose';

const AssessmentDetailSchema = new mongoose.Schema({
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
        type: String,
        enum: ['Chưa đánh giá', 'Đạt', 'Chưa đạt'],
        default: 'Chưa đánh giá',
    },
});

const ChildrenProgramCompleteSchema = new mongoose.Schema(
    {
        // ✅ FIX: schoolId là String, không phải ObjectId
        schoolId: {
            type: String,
            required: true,
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChildrenManagement',
            required: true,
        },
        assessmentDetails: [AssessmentDetailSchema],
        note: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        _destroy: { type: Boolean, default: false },
    },
    { timestamps: true },
);

// Unique constraint: one assessment per student per academic year
ChildrenProgramCompleteSchema.index(
    { schoolId: 1, academicYearId: 1, studentId: 1, _destroy: 1 },
    { unique: true, sparse: true },
);

export const ChildrenProgramCompleteModel = mongoose.model('ChildrenProgramComplete', ChildrenProgramCompleteSchema);

// Configuration model
const ChildrenProgramCompleteConfigSchema = new mongoose.Schema(
    {
        // ✅ FIX: schoolId là String, không phải ObjectId
        schoolId: {
            type: String,
            required: true,
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
            enum: [
                'Nhà trẻ 12-24 tháng',
                'Nhà trẻ 24-36 tháng',
                'Khối mầm 3-4 tuổi',
                'Khối chồi 4-5 tuổi',
                'Khối lá 5-6 tuổi',
            ],
        },
        selectedTargetIds: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        _destroy: { type: Boolean, default: false },
    },
    { timestamps: true },
);

ChildrenProgramCompleteConfigSchema.index(
    { schoolId: 1, academicYearId: 1, ageGroup: 1, _destroy: 1 },
    { unique: true, sparse: true },
);

export const ChildrenProgramCompleteConfigModel = mongoose.model(
    'ChildrenProgramCompleteConfig',
    ChildrenProgramCompleteConfigSchema,
);
