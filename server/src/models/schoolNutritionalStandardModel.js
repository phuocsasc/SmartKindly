// server/src/models/schoolNutritionalStandardModel.js

import mongoose from 'mongoose';

/**
 * ✅ Sub-schema: Cơ cấu PLG chuẩn (có thể có nhiều, chỉ chọn 1)
 */
const PLGStructureSchema = new mongoose.Schema(
    {
        protein: {
            type: Number,
            required: [true, 'Tỷ lệ Protein là bắt buộc'],
            min: [1, 'Tỷ lệ Protein phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Protein không được vượt quá 100'],
            integer: true, // Số nguyên
        },
        lipid: {
            type: Number,
            required: [true, 'Tỷ lệ Lipid là bắt buộc'],
            min: [1, 'Tỷ lệ Lipid phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Lipid không được vượt quá 100'],
            integer: true, // Số nguyên
        },
        glucid: {
            type: Number,
            required: [true, 'Tỷ lệ Glucid là bắt buộc'],
            min: [1, 'Tỷ lệ Glucid phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Glucid không được vượt quá 100'],
            integer: true, // Số nguyên
        },
        // ✅ Trạng thái chọn (chỉ được chọn 1 PLG structure)
        isSelected: {
            type: Boolean,
            default: false,
        },
    },
    { _id: true },
);

/**
 * ✅ Main Schema: Định mức dinh dưỡng của trường
 */
const SchoolNutritionalStandardSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        nutritionalStandardId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Nutritional Standard ID là bắt buộc'],
            ref: 'NutritionalStandard',
            index: true,
        },
        // ✅ Copy data từ NutritionalStandardModel
        ageGroup: {
            type: String,
            required: [true, 'Tên nhóm trẻ là bắt buộc'],
            enum: {
                values: ['Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)'],
                message: 'Nhóm trẻ không hợp lệ',
            },
        },
        // ✅ Cơ cấu PLG chuẩn (có thể có nhiều, chỉ chọn 1)
        plgStructures: {
            type: [PLGStructureSchema],
            validate: {
                validator: function (v) {
                    return v && v.length > 0;
                },
                message: 'Phải có ít nhất 1 cơ cấu PLG chuẩn',
            },
        },
        // ✅ Định mức 1 ngày của mỗi chất (loại bỏ tách động vật/thực vật)
        protein: {
            type: Number,
            required: [true, 'Protein Đạm là bắt buộc'],
            min: [0.001, 'Protein Đạm phải lớn hơn 0'],
        },
        lipid: {
            type: Number,
            required: [true, 'Lipid Béo là bắt buộc'],
            min: [0.001, 'Lipid Béo phải lớn hơn 0'],
        },
        glucid: {
            type: Number,
            required: [true, 'Glucid Đường là bắt buộc'],
            min: [0.001, 'Glucid Đường phải lớn hơn 0'],
        },
        // ✅ Calo cả ngày (tự tính)
        totalCalories: {
            type: Number,
            default: 0,
        },
        // ✅ Năng lượng khuyến nghị ăn tại trường
        recommendedCaloriesMin: {
            type: Number,
            required: [true, 'Năng lượng khuyến nghị tối thiểu là bắt buộc'],
            min: [0, 'Năng lượng khuyến nghị tối thiểu phải lớn hơn 0'],
            integer: true, // Số nguyên
        },
        recommendedCaloriesMax: {
            type: Number,
            required: [true, 'Năng lượng khuyến nghị tối đa là bắt buộc'],
            min: [0, 'Năng lượng khuyến nghị tối đa phải lớn hơn 0'],
            integer: true, // Số nguyên
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
    },
);

// ✅ Composite index: schoolId + nutritionalStandardId (unique)
SchoolNutritionalStandardSchema.index({ schoolId: 1, nutritionalStandardId: 1 }, { unique: true });

// ✅ Pre-save hook: Validate PLG structures và tính totalCalories
SchoolNutritionalStandardSchema.pre('save', function (next) {
    // 1. Validate PLG structures
    if (this.isModified('plgStructures')) {
        // Validate tổng = 100%
        for (const plg of this.plgStructures) {
            const total = plg.protein + plg.lipid + plg.glucid;
            if (Math.abs(total - 100) > 0.01) {
                return next(
                    new Error(
                        `Tổng tỷ lệ PLG phải bằng 100% (hiện tại: ${total}%). Protein: ${plg.protein}%, Lipid: ${plg.lipid}%, Glucid: ${plg.glucid}%`,
                    ),
                );
            }
        }
        // Validate chỉ được chọn 1 PLG structure
        const selectedCount = this.plgStructures.filter((plg) => plg.isSelected).length;
        if (selectedCount > 1) {
            return next(new Error('Chỉ được chọn 1 cơ cấu PLG chuẩn'));
        }
    }

    // 2. Tính totalCalories
    this.totalCalories = Math.round(this.protein * 4 + this.lipid * 9 + this.glucid * 4);

    // 3. Validate recommendedCalories
    if (this.recommendedCaloriesMin > this.recommendedCaloriesMax) {
        return next(new Error('Năng lượng khuyến nghị tối thiểu không được lớn hơn tối đa'));
    }

    next();
});

export const SchoolNutritionalStandardModel = mongoose.model(
    'SchoolNutritionalStandard',
    SchoolNutritionalStandardSchema,
);
