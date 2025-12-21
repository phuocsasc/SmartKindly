// server/src/models/schoolNutritionalStandardModel.js

import mongoose from 'mongoose';

/**
 * ✅ Sub-schema: Cơ cấu PLG chuẩn duy nhất (có khoảng Từ - Đến)
 */
const PLGStructureSchema = new mongoose.Schema(
    {
        // Protein (Đạm)
        proteinMin: {
            type: Number,
            required: [true, 'Tỷ lệ Protein tối thiểu là bắt buộc'],
            min: [1, 'Tỷ lệ Protein tối thiểu phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Protein tối thiểu không được vượt quá 100'],
            integer: true,
        },
        proteinMax: {
            type: Number,
            required: [true, 'Tỷ lệ Protein tối đa là bắt buộc'],
            min: [1, 'Tỷ lệ Protein tối đa phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Protein tối đa không được vượt quá 100'],
            integer: true,
        },
        // Lipid (Béo)
        lipidMin: {
            type: Number,
            required: [true, 'Tỷ lệ Lipid tối thiểu là bắt buộc'],
            min: [1, 'Tỷ lệ Lipid tối thiểu phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Lipid tối thiểu không được vượt quá 100'],
            integer: true,
        },
        lipidMax: {
            type: Number,
            required: [true, 'Tỷ lệ Lipid tối đa là bắt buộc'],
            min: [1, 'Tỷ lệ Lipid tối đa phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Lipid tối đa không được vượt quá 100'],
            integer: true,
        },
        // Glucid (Đường)
        glucidMin: {
            type: Number,
            required: [true, 'Tỷ lệ Glucid tối thiểu là bắt buộc'],
            min: [1, 'Tỷ lệ Glucid tối thiểu phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Glucid tối thiểu không được vượt quá 100'],
            integer: true,
        },
        glucidMax: {
            type: Number,
            required: [true, 'Tỷ lệ Glucid tối đa là bắt buộc'],
            min: [1, 'Tỷ lệ Glucid tối đa phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Glucid tối đa không được vượt quá 100'],
            integer: true,
        },
    },
    { _id: false },
);

/**
 * ✅ Main Schema: Định mức dinh dưỡng của trường (Copy từ Admin)
 */
const SchoolNutritionalStandardSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        // ✅ Reference đến NutritionalStandard (Admin)
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
        // ✅ Cơ cấu PLG chuẩn duy nhất
        plgStructure: {
            type: PLGStructureSchema,
            required: [true, 'Cơ cấu PLG chuẩn là bắt buộc'],
        },
        // ✅ Định mức 1 ngày
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

// ✅ Composite unique index
SchoolNutritionalStandardSchema.index({ schoolId: 1, nutritionalStandardId: 1 }, { unique: true });

// ✅ Pre-save hook: Validate PLG và tính totalCalories
SchoolNutritionalStandardSchema.pre('save', function (next) {
    // 1. Validate PLG structure (Min <= Max)
    if (this.isModified('plgStructure')) {
        const plg = this.plgStructure;

        if (plg.proteinMin > plg.proteinMax) {
            return next(new Error('Tỷ lệ Protein tối thiểu không được lớn hơn tối đa'));
        }
        if (plg.lipidMin > plg.lipidMax) {
            return next(new Error('Tỷ lệ Lipid tối thiểu không được lớn hơn tối đa'));
        }
        if (plg.glucidMin > plg.glucidMax) {
            return next(new Error('Tỷ lệ Glucid tối thiểu không được lớn hơn tối đa'));
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
