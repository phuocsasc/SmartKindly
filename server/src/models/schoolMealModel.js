// server/src/models/schoolMealModel.js

import mongoose from 'mongoose';
import { removeVietnameseTones } from '~/utils/formatters.js'; // ✅ Named import

/**
 * ✅ Sub-schema: Nguyên liệu (Ingredient) của món ăn
 */
const IngredientSchema = new mongoose.Schema(
    {
        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Food ID là bắt buộc'],
            ref: 'SchoolFood',
        },
        // ✅ Copy thông tin từ SchoolFood để tránh mất data khi food bị xóa/update
        foodName: {
            type: String,
            required: true,
        },
        foodNameWithoutAccent: {
            type: String,
        },
        categories: [String],
        protein: {
            type: Number,
            default: 0,
        },
        lipid: {
            type: Number,
            default: 0,
        },
        glucid: {
            type: Number,
            default: 0,
        },
        unit: {
            type: String,
            required: true,
        },
        gramConversion: {
            type: Number,
            required: true,
        },
        wastePercentage: {
            type: Number,
            default: 0,
        },
        // ✅ Thông số do user nhập
        quantityPerChildGram: {
            type: Number,
            required: [true, 'Lượng ăn của 1 trẻ (g) là bắt buộc'],
            min: [0.001, 'Lượng ăn phải lớn hơn 0'],
        },
        // ✅ Tự động tính
        quantityPerChildKg: {
            type: Number,
            default: 0,
        },
        // ✅ Calo = [(Protein x 4) + (Lipid x 9) + (Glucid x 4)] * quantityPerChildGram
        caloriesPerChild: {
            type: Number,
            default: 0,
        },
        // ✅ Thực phẩm chính hay không
        isMainFood: {
            type: Boolean,
            default: false,
        },
    },
    { _id: true },
);

/**
 * ✅ Main Schema: Món ăn của trường
 */
const SchoolMealSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Tên món ăn là bắt buộc'],
            trim: true,
            minlength: [2, 'Tên món ăn phải có ít nhất 2 ký tự'],
            maxlength: [200, 'Tên món ăn không được vượt quá 200 ký tự'],
        },
        nameWithoutAccent: {
            type: String,
            trim: true,
            lowercase: true,
        },
        mealType: {
            type: String,
            required: [true, 'Loại món ăn là bắt buộc'],
            enum: {
                values: [
                    'Món kho',
                    'Món luộc',
                    'Món canh',
                    'Món mặn',
                    'Món xào',
                    'Món xế',
                    'Soup',
                    'Lẩu',
                    'Món bánh',
                    'Tráng miệng',
                ],
                message: 'Loại món ăn không hợp lệ',
            },
        },
        ingredients: {
            type: [IngredientSchema],
            validate: {
                validator: function (v) {
                    return v && v.length > 0;
                },
                message: 'Phải có ít nhất 1 nguyên liệu',
            },
        },
        // ✅ Tổng calo của món ăn (tổng calo của tất cả nguyên liệu)
        totalCalories: {
            type: Number,
            default: 0,
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

// ✅ Index cho tìm kiếm
SchoolMealSchema.index({ schoolId: 1, name: 1 });
SchoolMealSchema.index({ name: 'text', nameWithoutAccent: 'text' });

// ✅ Pre-save hook: Tạo nameWithoutAccent và tính toán các giá trị
SchoolMealSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.nameWithoutAccent = removeVietnameseTones(this.name).toLowerCase();
    }

    // ✅ Tính toán lại các giá trị cho từng ingredient
    if (this.isModified('ingredients')) {
        this.ingredients.forEach((ingredient) => {
            // 1. Tính quantityPerChildKg
            ingredient.quantityPerChildKg = ingredient.quantityPerChildGram / 1000;

            // 2. Tính caloriesPerChild = [(Protein x 4) + (Lipid x 9) + (Glucid x 4)] * quantityPerChildGram
            const caloriesPer1g = ingredient.protein * 4 + ingredient.lipid * 9 + ingredient.glucid * 4;
            ingredient.caloriesPerChild = caloriesPer1g * ingredient.quantityPerChildGram;
        });

        // 3. Tính totalCalories
        this.totalCalories = this.ingredients.reduce((sum, ing) => sum + ing.caloriesPerChild, 0);
    }

    next();
});

export const SchoolMealModel = mongoose.model('SchoolMeal', SchoolMealSchema);
