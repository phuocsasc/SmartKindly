// server/src/models/foodModel.js

import mongoose from 'mongoose';
import { removeVietnameseTones } from '~/utils/formatters.js'; // ✅ Named import

const FoodSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên thực phẩm là bắt buộc'],
            trim: true,
            minlength: [2, 'Tên thực phẩm phải có ít nhất 2 ký tự'],
            maxlength: [200, 'Tên thực phẩm không được vượt quá 200 ký tự'],
        },
        nameWithoutAccent: {
            type: String,
            trim: true,
            lowercase: true,
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
            min: [1, 'Quy đổi sang gam phải từ 1 đến 1000'],
            max: [1000000, 'Quy đổi sang gam phải từ 1 đến 1000000'],
        },
        categories: {
            type: [String],
            required: [true, 'Loại thực phẩm là bắt buộc'],
            validate: {
                validator: function (arr) {
                    return arr.length > 0;
                },
                message: 'Phải chọn ít nhất 1 loại thực phẩm',
            },
            enum: {
                values: ['Động vật', 'Thực vật', 'Thực phẩm Khô', 'Thực phẩm tươi', 'Thực phẩm ăn liền'],
                message: 'Loại thực phẩm không hợp lệ',
            },
        },
        wastePercentage: {
            type: Number,
            required: [true, 'Hệ số thái bỏ là bắt buộc'],
            min: [0, 'Hệ số thái bỏ phải từ 0 đến 99'],
            max: [99, 'Hệ số thái bỏ phải từ 0 đến 99'],
            default: 0,
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
    },
);

// ✅ Index cho tìm kiếm text
FoodSchema.index({ name: 'text', nameWithoutAccent: 'text' });

// ✅ Pre-save hook để tạo nameWithoutAccent
FoodSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.nameWithoutAccent = removeVietnameseTones(this.name).toLowerCase();
    }
    next();
});

export const FoodModel = mongoose.model('Food', FoodSchema);
