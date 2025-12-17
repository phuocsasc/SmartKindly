// server/src/models/nutritionalStandardModel.js

import mongoose from 'mongoose';

/**
 * ✅ Sub-schema: Cơ cấu PLG chuẩn
 */
const PLGStructureSchema = new mongoose.Schema(
    {
        protein: {
            type: Number,
            required: [true, 'Tỷ lệ Protein là bắt buộc'],
            min: [0, 'Tỷ lệ Protein phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Protein không được vượt quá 100'],
        },
        lipid: {
            type: Number,
            required: [true, 'Tỷ lệ Lipid là bắt buộc'],
            min: [0, 'Tỷ lệ Lipid phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Lipid không được vượt quá 100'],
        },
        glucid: {
            type: Number,
            required: [true, 'Tỷ lệ Glucid là bắt buộc'],
            min: [0, 'Tỷ lệ Glucid phải lớn hơn 0'],
            max: [100, 'Tỷ lệ Glucid không được vượt quá 100'],
        },
    },
    { _id: true },
);

/**
 * ✅ Main Schema: Định mức dinh dưỡng
 */
const NutritionalStandardSchema = new mongoose.Schema(
    {
        ageGroup: {
            type: String,
            required: [true, 'Tên nhóm trẻ là bắt buộc'],
            enum: {
                values: ['Nhóm nhà trẻ (12 - 36 tháng tuổi)', 'Nhóm mẫu giáo (3 - 6 tuổi)'],
                message: 'Nhóm trẻ không hợp lệ',
            },
            unique: true,
        },
        // ✅ Cơ cấu PLG chuẩn (có thể có nhiều)
        plgStructures: {
            type: [PLGStructureSchema],
            validate: {
                validator: function (v) {
                    return v && v.length > 0;
                },
                message: 'Phải có ít nhất 1 cơ cấu PLG chuẩn',
            },
        },
        // ✅ Protein (Đạm)
        proteinAnimal: {
            type: Number,
            required: [true, 'Protein Đạm động vật là bắt buộc'],
            min: [0.001, 'Protein Đạm động vật phải lớn hơn 0'],
        },
        proteinPlant: {
            type: Number,
            required: [true, 'Protein Đạm thực vật là bắt buộc'],
            min: [0.001, 'Protein Đạm thực vật phải lớn hơn 0'],
        },
        // ✅ Lipid (Béo)
        lipidAnimal: {
            type: Number,
            required: [true, 'Lipid Béo động vật là bắt buộc'],
            min: [0.001, 'Lipid Béo động vật phải lớn hơn 0'],
        },
        lipidPlant: {
            type: Number,
            required: [true, 'Lipid Béo thực vật là bắt buộc'],
            min: [0.001, 'Lipid Béo thực vật phải lớn hơn 0'],
        },
        // ✅ Glucid (Đường)
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
        },
        recommendedCaloriesMax: {
            type: Number,
            required: [true, 'Năng lượng khuyến nghị tối đa là bắt buộc'],
            min: [0, 'Năng lượng khuyến nghị tối đa phải lớn hơn 0'],
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
    {
        timestamps: true,
    },
);

// ✅ Index
NutritionalStandardSchema.index({ ageGroup: 1 });

// ✅ Pre-save hook: Validate PLG structures và tính totalCalories
NutritionalStandardSchema.pre('save', function (next) {
    // 1. Validate PLG structures
    if (this.isModified('plgStructures')) {
        for (const plg of this.plgStructures) {
            const total = plg.protein + plg.lipid + plg.glucid;
            if (Math.abs(total - 100) > 0.01) {
                // Allow small floating point error
                return next(
                    new Error(
                        `Tổng tỷ lệ PLG phải bằng 100% (hiện tại: ${total}%). Protein: ${plg.protein}%, Lipid: ${plg.lipid}%, Glucid: ${plg.glucid}%`,
                    ),
                );
            }
        }
    }

    // 2. Tính totalCalories
    // Calo = [(Protein động vật + Protein thực vật) * 4] + [(Lipid động vật + Lipid thực vật) * 9] + (Glucid * 4)
    const totalProtein = this.proteinAnimal + this.proteinPlant;
    const totalLipid = this.lipidAnimal + this.lipidPlant;
    this.totalCalories = Math.round(totalProtein * 4 + totalLipid * 9 + this.glucid * 4);

    // 3. Validate recommendedCalories
    if (this.recommendedCaloriesMin > this.recommendedCaloriesMax) {
        return next(new Error('Năng lượng khuyến nghị tối thiểu không được lớn hơn tối đa'));
    }

    next();
});

export const NutritionalStandardModel = mongoose.model('NutritionalStandard', NutritionalStandardSchema);
