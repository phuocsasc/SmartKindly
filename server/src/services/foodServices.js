// server/src/services/foodServices.js

import { FoodModel } from '~/models/foodModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

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

        // ✅ Search by name (có dấu hoặc không dấu, hoa thường)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [{ name: searchRegex }, { nameWithoutAccent: searchRegex }];
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
        if (data.name && data.name !== food.name) {
            const existingFood = await FoodModel.findOne({
                _id: { $ne: id },
                name: { $regex: new RegExp(`^${data.name}$`, 'i') },
                _destroy: false,
            });

            if (existingFood) {
                throw new ApiError(StatusCodes.CONFLICT, 'Tên thực phẩm đã tồn tại');
            }
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

        for (const [index, item] of data.entries()) {
            try {
                const rowNumber = index + 7; // Excel row number

                // Validate
                if (!item.name || item.name.trim() === '') {
                    results.errors.push({
                        row: rowNumber,
                        name: item.name || '(Chưa có tên)',
                        error: 'Thiếu tên thực phẩm',
                    });
                    continue;
                }

                // Check duplicate
                const existingFood = await FoodModel.findOne({
                    name: { $regex: new RegExp(`^${item.name}$`, 'i') },
                    _destroy: false,
                });

                if (existingFood) {
                    results.errors.push({
                        row: rowNumber,
                        name: item.name,
                        error: 'Tên thực phẩm đã tồn tại',
                    });
                    continue;
                }

                // Create food
                const newFood = new FoodModel({
                    name: item.name,
                    unitPrice: item.unitPrice ?? 0,
                    unit: item.unit || 'Kg',
                    gramConversion: item.gramConversion,
                    categories: item.categories,
                    wastePercentage: item.wastePercentage ?? 0,
                    protein: item.protein ?? 0,
                    lipid: item.lipid ?? 0,
                    glucid: item.glucid ?? 0,
                    createdBy: userId,
                });

                await newFood.save();

                results.created.push({
                    name: newFood.name,
                    unit: newFood.unit,
                });

                console.log(`✅ Created food: ${newFood.name}`);
            } catch (error) {
                console.error(`❌ Error at row ${index + 7}:`, error);
                results.errors.push({
                    row: index + 7,
                    name: item.name || '(Chưa có tên)',
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
