// server/src/models/childrenCertificateModel.js

import mongoose from 'mongoose';

const ChildrenCertificateSchema = new mongoose.Schema(
    {
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
        weekNumber: {
            type: Number,
            required: [true, 'Số tuần là bắt buộc'],
            min: 1,
            index: true,
        },
        // ✅ Hoa bé ngoan (true: được hoa, false: không được hoa)
        isGoodChild: {
            type: Boolean,
            default: false,
        },
        // ✅ Nhận xét (bắt buộc)
        comment: {
            type: String,
            required: [true, 'Nhận xét là bắt buộc'],
            trim: true,
        },
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
        collection: 'childrenCertificates',
    },
);

// ✅ Indexes
ChildrenCertificateSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, weekNumber: 1, _destroy: 1 });
ChildrenCertificateSchema.index({ studentId: 1, weekNumber: 1, _destroy: 1 });

// ✅ Unique constraint: 1 học sinh chỉ có 1 phiếu/tuần
ChildrenCertificateSchema.index(
    {
        schoolId: 1,
        academicYearId: 1,
        studentId: 1,
        weekNumber: 1,
    },
    {
        unique: true,
        partialFilterExpression: { _destroy: false },
        name: 'unique_student_weekly_certificate',
    },
);

export const ChildrenCertificateModel = mongoose.model('ChildrenCertificate', ChildrenCertificateSchema);
