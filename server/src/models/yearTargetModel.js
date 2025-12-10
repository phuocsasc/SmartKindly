// server/src/models/yearTargetModel.js

import mongoose from 'mongoose';

/**
 * ✅ Sub-schema: Kết quả mong đợi (Mục tiêu con)
 */
const ExpectedResultSchema = new mongoose.Schema(
    {
        code: {
            type: String, // "1", "2", "3"...
            required: true,
        },
        description: {
            type: String, // "Thực hiện động tác phát triển các nhóm cơ và hô hấp"
            required: true,
        },
        targets: [
            {
                code: String, // "MT1", "MT2"...
                content: String, // "Trẻ bắt chước được 1 số động tác theo cô..."
            },
        ],
    },
    { _id: true },
);

/**
 * ✅ Sub-schema: Lĩnh vực phát triển con (a, b, c...)
 */
const SubFieldSchema = new mongoose.Schema(
    {
        code: {
            type: String, // "a)", "b)", "c)"...
            required: true,
        },
        name: {
            type: String, // "Phát triển vận động", "Giáo dục dinh dưỡng và sức khỏe"
            required: true,
        },
        expectedResults: [ExpectedResultSchema],
    },
    { _id: true },
);

/**
 * ✅ Sub-schema: Lĩnh vực phát triển chính (I, II, III, IV, V)
 */
const MainFieldSchema = new mongoose.Schema(
    {
        code: {
            type: String, // "I", "II", "III", "IV", "V"
            required: true,
        },
        name: {
            type: String, // "Giáo dục phát triển thể chất"
            required: true,
        },
        subFields: [SubFieldSchema], // Có thể có hoặc không (như "III. Giáo dục phát triển ngôn ngữ" không có)
        expectedResults: [ExpectedResultSchema], // Trường hợp không có subFields thì có expectedResults trực tiếp
    },
    { _id: true },
);

/**
 * ✅ Main Schema: Year Target (Mục tiêu năm học)
 */
const YearTargetSchema = new mongoose.Schema(
    {
        ageGroup: {
            type: String,
            required: [true, 'Nhóm tuổi là bắt buộc'],
            enum: {
                values: [
                    'Nhà trẻ 12-24 tháng',
                    'Nhà trẻ 24-36 tháng',
                    'Khối mầm 3-4 tuổi',
                    'Khối chồi 4-5 tuổi',
                    'Khối lá 5-6 tuổi',
                ],
                message: 'Nhóm tuổi không hợp lệ',
            },
            index: true,
        },
        mainFields: [MainFieldSchema],
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
        collection: 'yearTargets',
    },
);

// ✅ Index để tìm kiếm nhanh
YearTargetSchema.index({ ageGroup: 1, _destroy: 1 });

export const YearTargetModel = mongoose.model('YearTarget', YearTargetSchema);
