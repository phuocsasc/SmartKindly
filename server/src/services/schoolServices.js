import { SchoolModel } from '~/models/schoolModel';
import { slugify } from '~/utils/formatters';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

const createNew = async (data) => {
    try {
        // Kiểm tra tên trường đã tồn tại chưa
        const existingSchool = await SchoolModel.findOne({
            name: data.name,
            _destroy: false,
        });

        if (existingSchool) {
            throw new ApiError(StatusCodes.CONFLICT, 'Tên trường học đã tồn tại');
        }

        // Tạo slug và kiểm tra unique
        let baseSlug = slugify(data.name);
        let slug = baseSlug;
        let counter = 1;

        while (await SchoolModel.findOne({ slug, _destroy: false })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const newSchool = new SchoolModel({
            ...data,
            slug,
        });

        return await newSchool.save();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo trường học mới');
    }
};

const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, search = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };
        if (search) {
            filter.$or = [{ name: { $regex: search, $options: 'i' } }, { address: { $regex: search, $options: 'i' } }];
        }

        const schools = await SchoolModel.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

        const total = await SchoolModel.countDocuments(filter);

        return {
            schools,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách trường học');
    }
};

const getDetails = async (id) => {
    try {
        const school = await SchoolModel.findOne({ _id: id, _destroy: false });
        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy trường học');
        }
        return school;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin trường học');
    }
};

const update = async (id, data) => {
    try {
        const school = await SchoolModel.findOne({ _id: id, _destroy: false });
        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy trường học');
        }

        // Kiểm tra tên trường đã tồn tại (trừ chính nó)
        if (data.name) {
            const existingSchool = await SchoolModel.findOne({
                name: data.name,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existingSchool) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên trường học đã tồn tại');
            }

            // Cập nhật slug nếu tên thay đổi
            data.slug = slugify(data.name);
        }

        const updatedSchool = await SchoolModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        return updatedSchool;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật trường học');
    }
};

const deleteSchool = async (id) => {
    try {
        const school = await SchoolModel.findOne({ _id: id, _destroy: false });
        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy trường học');
        }

        // Soft delete - chỉ đánh dấu _destroy: true
        await SchoolModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa trường học thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa trường học');
    }
};

export const schoolServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteSchool,
};
