// server/src/services/foodServices.js

import { FoodModel } from '~/models/foodModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { removeVietnameseTones } from '~/utils/formatters.js'; // ✅ Named import

/**
 * ✅ Tạo thực phẩm mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [Food createNew] Starting with data:', data);

        // ✅ Verify user is admin
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền tạo thực phẩm');
        }

        // ✅ Check duplicate name (case-insensitive)
        const existingFood = await FoodModel.findOne({
            name: { $regex: new RegExp(`^${data.name}$`, 'i') },
            _destroy: false,
        });

        if (existingFood) {
            throw new ApiError(StatusCodes.CONFLICT, 'Tên thực phẩm đã tồn tại');
        }

        // ✅ Create food
        const newFood = new FoodModel({
            ...data,
            createdBy: userId,
        });

        await newFood.save();

        const populated = await FoodModel.findById(newFood._id).populate('createdBy', 'fullName username').lean();

        console.log('✅ [Food createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [Food createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo thực phẩm: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách thực phẩm
 */
const getAll = async (query) => {
    try {
        const { page = 1, limit = 20, search = '', category = '', unit = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };

        // ✅ IMPROVED SEARCH: Trim, lowercase, bỏ dấu
        if (search) {
            const searchTrimmed = search.trim(); // Loại bỏ khoảng trắng đầu cuối
            const searchNormalized = removeVietnameseTones(searchTrimmed).toLowerCase(); // Bỏ dấu + lowercase

            filter.$or = [
                { name: { $regex: searchTrimmed, $options: 'i' } }, // Tìm có dấu
                { nameWithoutAccent: { $regex: searchNormalized, $options: 'i' } }, // Tìm không dấu
            ];
        }

        // ✅ Filter by category
        if (category) {
            filter.categories = category;
        }

        // ✅ Filter by unit
        if (unit) {
            filter.unit = unit;
        }

        const [foods, total] = await Promise.all([
            FoodModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .lean(),
            FoodModel.countDocuments(filter),
        ]);

        return {
            foods,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [Food getAll] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách thực phẩm');
    }
};

/**
 * ✅ Lấy chi tiết thực phẩm
 */
const getDetails = async (id) => {
    try {
        const food = await FoodModel.findOne({ _id: id, _destroy: false })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!food) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực phẩm');
        }

        return food;
    } catch (error) {
        console.error('❌ [Food getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin thực phẩm');
    }
};

/**
 * ✅ Cập nhật thực phẩm
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [Food update] Starting with id:', id);

        // ✅ Verify user is admin
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền cập nhật thực phẩm');
        }

        const food = await FoodModel.findOne({ _id: id, _destroy: false });
        if (!food) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực phẩm');
        }

        // ✅ Check duplicate name if name is being updated
        if (data.name && data.name.trim() !== food.name) {
            const normalizedName = data.name.trim();
            const existingFood = await FoodModel.findOne({
                _id: { $ne: id },
                name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
                _destroy: false,
            });

            if (existingFood) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên thực phẩm đã tồn tại');
            }
        }

        // ✅ Trim name if provided
        if (data.name) {
            data.name = data.name.trim();
        }

        // ✅ Update (KHÔNG TỰ ĐỘNG SYNC)
        const updated = await FoodModel.findOneAndUpdate(
            { _id: id, _destroy: false },
            {
                ...data,
                lastUpdatedBy: userId,
            },
            { new: true, runValidators: true },
        )
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [Food update] Updated successfully (NO AUTO-SYNC)');
        return updated;
    } catch (error) {
        console.error('❌ [Food update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật thực phẩm');
    }
};

/**
 * ✅ Xóa thực phẩm
 */
const deleteFood = async (id, userId) => {
    try {
        console.log('🗑️ [Food delete] Starting with id:', id);

        // ✅ Verify user is admin
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền xóa thực phẩm');
        }

        const food = await FoodModel.findById(id);
        if (!food) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực phẩm');
        }

        // ✅ Xóa food (hard delete, KHÔNG AUTO-SYNC)
        await FoodModel.findByIdAndDelete(id);

        console.log('✅ [Food delete] Deleted successfully (NO AUTO-SYNC)');
        return { message: 'Xóa thực phẩm thành công' };
    } catch (error) {
        console.error('❌ [Food delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa thực phẩm');
    }
};

/**
 * ✅ Xóa nhiều thực phẩm (HARD DELETE)
 */
const deleteManyFoods = async (ids, userId) => {
    try {
        console.log('🗑️ [Food deleteMany] Starting with', ids.length, 'foods');

        // ✅ Verify user is admin
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền xóa thực phẩm');
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Danh sách ID không hợp lệ');
        }

        // ✅ Hard delete (KHÔNG AUTO-SYNC)
        const result = await FoodModel.deleteMany({
            _id: { $in: ids },
        });

        console.log(`✅ [Food deleteMany] Deleted ${result.deletedCount} foods (NO AUTO-SYNC)`);

        return {
            message: `Đã xóa ${result.deletedCount} thực phẩm`,
        };
    } catch (error) {
        console.error('❌ [Food deleteMany] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa nhiều thực phẩm');
    }
};

/**
 * ✅ Import bulk foods from Excel
 */
const importBulk = async (data, userId) => {
    try {
        console.log('📋 [Food importBulk] Starting with', data.length, 'foods');

        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền import thực phẩm');
        }

        const results = {
            created: [],
            errors: [],
        };

        for (const foodData of data) {
            try {
                // ✅ Trim name
                const normalizedName = foodData.name.trim();

                // Check duplicate
                const existing = await FoodModel.findOne({
                    name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
                    _destroy: false,
                });

                if (existing) {
                    results.errors.push({
                        row: foodData.rowNumber,
                        name: normalizedName,
                        error: 'Thực phẩm đã tồn tại',
                    });
                    continue;
                }

                const newFood = new FoodModel({
                    ...foodData,
                    name: normalizedName,
                    createdBy: userId,
                });

                await newFood.save();
                results.created.push(newFood);
            } catch (error) {
                results.errors.push({
                    row: foodData.rowNumber,
                    name: foodData.name,
                    error: error.message,
                });
            }
        }

        console.log('✅ [Food importBulk] Done:', {
            created: results.created.length,
            errors: results.errors.length,
        });

        return results;
    } catch (error) {
        console.error('❌ [Food importBulk] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi import thực phẩm');
    }
};

export const foodServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteFood,
    deleteManyFoods,
    importBulk,
};
