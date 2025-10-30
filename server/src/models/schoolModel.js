import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'Mã trường là bắt buộc'],
            unique: true,
            trim: true,
            match: [/^[0-9]{8}$/, 'Mã trường phải có đúng 8 chữ số'],
        },
        name: {
            type: String,
            required: [true, 'Tên trường học là bắt buộc'],
            trim: true,
            maxlength: [256, 'Tên trường học không được vượt quá 256 ký tự'],
        },
        abbreviation: {
            type: String,
            required: [true, 'Tên viết tắt là bắt buộc'],
            trim: true,
            uppercase: true,
            minlength: [2, 'Tên viết tắt phải có ít nhất 2 ký tự'],
            maxlength: [10, 'Tên viết tắt không được vượt quá 10 ký tự'],
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        address: {
            type: String,
            required: [true, 'Địa chỉ là bắt buộc'],
            trim: true,
            maxlength: [500, 'Địa chỉ không được vượt quá 500 ký tự'],
        },
        taxCode: {
            type: String,
            trim: true,
            default: null, // ✅ Mặc định null
            match: [/^[0-9]{10,13}$/, 'Mã số thuế phải có 10-13 chữ số'],
        },
        manager: {
            type: String,
            required: [true, 'Tên hiệu trưởng là bắt buộc'],
            trim: true,
            maxlength: [100, 'Tên hiệu trưởng không được vượt quá 100 ký tự'],
        },
        phone: {
            type: String,
            required: [true, 'Số điện thoại là bắt buộc'],
            trim: true,
            match: [/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'],
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null, // ✅ Mặc định null
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ'],
        },
        website: {
            type: String,
            trim: true,
            default: null, // ✅ Mặc định null
            match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Website không hợp lệ'],
        },
        establishmentDate: {
            type: Date,
            required: [true, 'Ngày thành lập là bắt buộc'],
        },
        status: {
            type: Boolean,
            default: true,
            required: true,
        },
        _destroy: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    },
);

// Static method: Tạo schoolId tự động (8 chữ số)
SchoolSchema.statics.generateSchoolId = async function () {
    let schoolId;
    let isUnique = false;

    while (!isUnique) {
        schoolId = Math.floor(10000000 + Math.random() * 90000000).toString();
        const existing = await this.findOne({ schoolId, _destroy: false });
        if (!existing) {
            isUnique = true;
        }
    }

    return schoolId;
};

// Index để tìm kiếm nhanh hơn
// SchoolSchema.index({ name: 'text', address: 'text' });
// SchoolSchema.index({ slug: 1 });
// SchoolSchema.index({ schoolId: 1 });
// SchoolSchema.index({ abbreviation: 1 });

// ✅ Compound indexes
SchoolSchema.index({ status: 1, _destroy: 1 }); // ✅ Filter active schools
SchoolSchema.index({ schoolId: 1, _destroy: 1 }); // ✅ Unique lookup

// ✅ Text search
SchoolSchema.index(
    {
        name: 'text',
        address: 'text',
        abbreviation: 'text',
    },
    {
        weights: {
            name: 10,
            abbreviation: 5,
            address: 3,
        },
    },
);

export const SchoolModel = mongoose.model('School', SchoolSchema);
