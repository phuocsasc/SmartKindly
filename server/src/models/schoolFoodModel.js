// server/src/models/schoolFoodModel.js

import mongoose from 'mongoose';
import { removeVietnameseTones } from '~/utils/formatters.js'; // ✅ Named import

const SchoolFoodSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'School ID là bắt buộc'],
            ref: 'School',
            index: true,
        },
        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Food ID là bắt buộc'],
            ref: 'Food',
            index: true,
        },
        // ✅ Thông tin cơ bản (đồng bộ từ FoodModel)
        name: {
            type: String,
            required: [true, 'Tên thực phẩm là bắt buộc'],
            trim: true,
        },
        nameWithoutAccent: {
            type: String,
            trim: true,
            lowercase: true,
        },
        categories: {
            type: [String],
            required: [true, 'Loại thực phẩm là bắt buộc'],
            enum: ['Động vật', 'Thực vật', 'Thực phẩm Khô', 'Thực phẩm tươi', 'Thực phẩm ăn liền'],
        },
        protein: {
            type: Number,
            required: [true, 'Protein là bắt buộc'],
            min: [0, 'Protein phải lớn hơn hoặc bằng 0'],
            default: 0,
        },
        lipid: {
            type: Number,
            required: [true, 'Lipid là bắt buộc'],
            min: [0, 'Lipid phải lớn hơn hoặc bằng 0'],
            default: 0,
        },
        glucid: {
            type: Number,
            required: [true, 'Glucid là bắt buộc'],
            min: [0, 'Glucid phải lớn hơn hoặc bằng 0'],
            default: 0,
        },
        unit: {
            type: String,
            required: [true, 'Đơn vị tính là bắt buộc'],
            enum: {
                values: [
                    'Kg',
                    'Hộp',
                    'Miếng',
                    'Cốc',
                    'Quả',
                    'Trứng',
                    'Chén',
                    'Gói',
                    'Chai',
                    'Hũ',
                    'Cái',
                    'Ổ',
                    'Bát',
                    'Tô',
                    'Lon',
                    'Túi',
                    'Bịch',
                    'Bao',
                    'Trái',
                    'Củ',
                    'Cây',
                    'Bắp',
                    'Tép',
                    'Lát',
                    'Khoanh',
                    'Khúc',
                    'Bó',
                    'Mớ',
                    'Chùm',
                    'Nải',
                    'Lá',
                    'Con',
                    'Viên',
                    'Hạt',
                ],
                message: 'Đơn vị tính không hợp lệ',
            },
            default: 'Kg',
        },
        gramConversion: {
            type: Number,
            required: [true, 'Quy đổi sang gam là bắt buộc'],
            min: [1, 'Quy đổi sang gam phải từ 1 đến 1000000'],
            max: [1000000, 'Quy đổi sang gam phải từ 1 đến 1000000'],
        },
        wastePercentage: {
            type: Number,
            required: [true, 'Hệ số thái bỏ là bắt buộc'],
            min: [0, 'Hệ số thái bỏ phải từ 0 đến 99'],
            max: [99, 'Hệ số thái bỏ phải từ 0 đến 99'],
            default: 0,
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

// ✅ Compound index cho unique constraint
SchoolFoodSchema.index({ schoolId: 1, foodId: 1 }, { unique: true });
SchoolFoodSchema.index({ name: 'text', nameWithoutAccent: 'text' });

// ✅ Pre-save hook để tạo nameWithoutAccent
SchoolFoodSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.nameWithoutAccent = removeVietnameseTones(this.name).toLowerCase();
    }
    next();
});

export const SchoolFoodModel = mongoose.model('SchoolFood', SchoolFoodSchema);
