// server/src/models/childrenDailyAssessmentModel.js

import mongoose from 'mongoose';

/**
 * Schema: Đánh giá trẻ hằng ngày
 * - Chỉ đánh giá trẻ đã điểm danh "Có mặt" trong ngày
 * - 1 trẻ chỉ có 1 đánh giá/ngày
 * - Chỉ thao tác trong năm học "đang hoạt động"
 */
const ChildrenDailyAssessmentSchema = new mongoose.Schema(
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
        // ✅ Tham chiếu đến ChildrenManagement (không phải ChildrenProfile)
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChildrenManagement',
            required: [true, 'Học sinh là bắt buộc'],
            index: true,
        },
        date: {
            type: Date,
            required: [true, 'Ngày đánh giá là bắt buộc'],
            index: true,
        },
        weekNumber: {
            type: Number,
            required: [true, 'Số tuần là bắt buộc'],
            index: true,
        },

        // ===== 4 MỤC ĐÁNH GIÁ =====
        // 1. Tình trạng sức khỏe
        healthStatus: {
            type: String,
            required: [true, 'Tình trạng sức khỏe là bắt buộc'],
            trim: true,
        },
        // 2. Trạng thái cảm xúc, thái độ hành vi
        emotionalBehavior: {
            type: String,
            required: [true, 'Trạng thái cảm xúc, thái độ hành vi là bắt buộc'],
            trim: true,
        },
        // 3. Kiến thức kỹ năng
        skillsKnowledge: {
            type: String,
            required: [true, 'Kiến thức kỹ năng là bắt buộc'],
            trim: true,
        },
        // 4. Ghi chú lưu ý cần quan tâm hơn (không bắt buộc)
        notes: {
            type: String,
            default: '',
            trim: true,
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
        collection: 'childrenDailyAssessments',
    },
);

// ✅ Indexes
ChildrenDailyAssessmentSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, _destroy: 1 });
ChildrenDailyAssessmentSchema.index({ studentId: 1, date: 1, _destroy: 1 });

// ✅ Unique: 1 học sinh chỉ có 1 đánh giá/ngày
ChildrenDailyAssessmentSchema.index(
    {
        schoolId: 1,
        academicYearId: 1,
        studentId: 1,
        date: 1,
    },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
        name: 'unique_student_daily_assessment',
    },
);

export const ChildrenDailyAssessmentModel = mongoose.model('ChildrenDailyAssessment', ChildrenDailyAssessmentSchema);
