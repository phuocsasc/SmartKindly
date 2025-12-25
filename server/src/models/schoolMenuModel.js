import mongoose from 'mongoose';
import { removeVietnameseTones } from '~/utils/formatters.js';

const EVALUATION_STATUS = ['Đạt', 'Chưa đạt', 'Vượt quá định mức'];

// --- Sub-schemas ---

const MenuMealIngredientSnapshotSchema = new mongoose.Schema(
    {
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolFood', required: true },
        foodName: { type: String, required: true },
        unit: { type: String, required: true },
        gramConversion: { type: Number, required: true },
        wastePercentage: { type: Number, default: 0 },
        quantityPerChildGram: { type: Number, required: true },
        protein: { type: Number, default: 0 },
        lipid: { type: Number, default: 0 },
        glucid: { type: Number, default: 0 },
        isMainFood: { type: Boolean, default: false },
    },
    { _id: false },
);

const MenuMealSnapshotSchema = new mongoose.Schema(
    {
        mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolMeal', required: true },
        name: { type: String, required: true },
        ingredients: [MenuMealIngredientSnapshotSchema],
    },
    { _id: false },
);

const AggregatedFoodItemSchema = new mongoose.Schema(
    {
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolFood', required: true },
        foodName: { type: String, required: true },
        unit: { type: String, required: true },
        gramConversion: { type: Number, required: true },
        wastePercentage: { type: Number, required: true },
        isMainFood: { type: Boolean, default: false },
        // ✅ Thêm các field thông tin dinh dưỡng
        protein: { type: Number, default: 0 },
        lipid: { type: Number, default: 0 },
        glucid: { type: Number, default: 0 },
        // Các field tính toán
        quantityPerChildGram: { type: Number, required: true },
        totalQuantityKg: { type: Number, required: true },
        purchaseQuantityKg: { type: Number, required: true },
        purchaseQuantityByUnit: { type: Number, required: true },
    },
    { _id: false },
);

const NutritionalAnalysisSchema = new mongoose.Schema(
    {
        totalProtein: { type: Number, default: 0 },
        totalLipid: { type: Number, default: 0 },
        totalGlucid: { type: Number, default: 0 },
        totalCalories: { type: Number, default: 0 },
        caloriesEvaluation: { type: String, enum: EVALUATION_STATUS },
        proteinPercentage: { type: Number, default: 0 },
        lipidPercentage: { type: Number, default: 0 },
        glucidPercentage: { type: Number, default: 0 },
        plgEvaluation: {
            protein: { type: String, enum: EVALUATION_STATUS },
            lipid: { type: String, enum: EVALUATION_STATUS },
            glucid: { type: String, enum: EVALUATION_STATUS },
        },
    },
    { _id: false },
);

// --- Main Schema ---
const SchoolMenuSchema = new mongoose.Schema(
    {
        schoolId: { type: String, required: true, ref: 'School', index: true },
        menuName: { type: String, required: true, trim: true },
        menuNameWithoutAccent: { type: String, trim: true, lowercase: true },
        numberOfChildren: { type: Number, required: true, min: [1, 'Số trẻ phải lớn hơn 0'] },
        nutritionalStandardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolNutritionalStandard',
            required: true,
        },
        ageGroup: { type: String, required: true },
        meals: {
            'Bữa sáng': [MenuMealSnapshotSchema],
            'Bữa trưa': [MenuMealSnapshotSchema],
            'Bữa xế': [MenuMealSnapshotSchema],
            'Bữa phụ': [MenuMealSnapshotSchema],
        },
        aggregatedFoodTable: [AggregatedFoodItemSchema],
        analysis: NutritionalAnalysisSchema,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        _destroy: { type: Boolean, default: false },
    },
    { timestamps: true },
);

SchoolMenuSchema.index({ schoolId: 1, menuName: 1, _destroy: 1 });
SchoolMenuSchema.index({ menuNameWithoutAccent: 'text' });

SchoolMenuSchema.pre('save', function (next) {
    if (this.isModified('menuName')) {
        this.menuNameWithoutAccent = removeVietnameseTones(this.menuName).toLowerCase();
    }
    next();
});

export const SchoolMenuModel = mongoose.model('SchoolMenu', SchoolMenuSchema);
