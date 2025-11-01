// server/src/models/personnelEvaluationModel.js

import mongoose from 'mongoose';

const PersonnelEvaluationSchema = new mongoose.Schema(
    {
        personnelRecordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PersonnelRecord',
            required: [true, 'Personnel Record ID là bắt buộc'],
            index: true,
        },
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: [true, 'Năm học là bắt buộc'],
            index: true,
        },
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            index: true,
        },
        // ✅ Các field KHÔNG được update (read-only từ PersonnelRecord)
        fullName: {
            type: String,
            required: true,
        },
        personnelCode: {
            type: String,
            required: true,
        },
        // ✅ Các field CÓ THỂ update
        officialEvaluation: {
            type: String,
            enum: {
                values: ['Hoàn thành (hạn chế về NL)', 'Hoàn thành tốt', 'Không hoàn thành nhiệm vụ', 'Xuất sắc', ''],
                message: 'Đánh giá viên chức không hợp lệ',
            },
            default: '',
        },
        regularTraining: {
            type: String,
            enum: {
                values: ['Chưa hoàn thành', 'Khá', 'Tốt', 'Đạt', ''],
                message: 'Bồi dưỡng thường xuyên không hợp lệ',
            },
            default: '',
        },
        excellentTeacher: {
            type: String,
            enum: {
                values: ['Cấp Huyện', 'Cấp Tỉnh', 'Cấp trường', ''],
                message: 'Giáo viên dạy giỏi không hợp lệ',
            },
            default: '',
        },
        emulationTitle: {
            type: String,
            enum: {
                values: [
                    'Chiến sĩ thi đua cấp tỉnh',
                    'Chiến sĩ thi đua cơ sở',
                    'Chiến sĩ thi đua toàn quốc',
                    'Lao động tiên tiến',
                    '',
                ],
                message: 'Danh hiệu thi đua không hợp lệ',
            },
            default: '',
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự'],
            default: '',
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
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    },
);

// ✅ Compound unique index: 1 cán bộ chỉ có 1 đánh giá trong 1 năm học
PersonnelEvaluationSchema.index({ personnelRecordId: 1, academicYearId: 1 }, { unique: true });
PersonnelEvaluationSchema.index({ schoolId: 1, academicYearId: 1, _destroy: 1 });

export const PersonnelEvaluationModel = mongoose.model('PersonnelEvaluation', PersonnelEvaluationSchema);
