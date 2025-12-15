// server/src/models/foodModel.js

import mongoose from 'mongoose';

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
        // ✅ THÊM TRƯỜNG ĐơN GIÁ
        unitPrice: {
            type: Number,
            required: [true, 'Đơn giá là bắt buộc'],
            min: [0, 'Đơn giá phải lớn hơn hoặc bằng 0'],
            default: 0,
        },
        unit: {
            type: String,
            required: [true, 'Đơn vị tính là bắt buộc'],
            enum: {
                values: ['Kg', 'Hộp', 'Miếng', 'Lit', 'Quả', 'Trứng', 'Gram', 'Gói', 'Chai', 'Hũ', 'Cái', 'Ổ'],
                message: 'Đơn vị tính không hợp lệ',
            },
            default: 'Kg',
        },
        gramConversion: {
            type: Number,
            required: [true, 'Quy đổi sang gam là bắt buộc'],
            min: [1, 'Quy đổi sang gam phải từ 1 đến 1000'],
            max: [1000, 'Quy đổi sang gam phải từ 1 đến 1000'],
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

// ✅ Helper function để remove dấu tiếng Việt
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    str = str.replace(/Đ/g, 'D');
    return str;
}

export const FoodModel = mongoose.model('Food', FoodSchema);
