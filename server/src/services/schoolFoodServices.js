// server/src/services/schoolFoodServices.js

import { SchoolFoodModel } from '~/models/schoolFoodModel.js';
import { FoodModel } from '~/models/foodModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Đồng bộ toàn bộ thực phẩm từ FoodModel sang SchoolFoodModel cho 1 trường
 * SYNC TẤT CẢ: Thêm mới nếu chưa có, cập nhật các field đồng bộ nếu đã có
 */
const syncFoodsForSchool = async (schoolId) => {
    try {
        console.log('🔄 [syncFoodsForSchool] Starting for schoolId:', schoolId);

        // ✅ 1. Lấy tất cả thực phẩm từ FoodModel (admin database)
        const allFoods = await FoodModel.find({ _destroy: false }).lean();
        console.log(`📊 Found ${allFoods.length} foods in admin database`);

        let result = {
            upsertedCount: 0,
            modifiedCount: 0,
            deletedCount: 0,
        };

        if (allFoods.length === 0) {
            console.log('⚠️ No foods found in admin database');

            // ✅ Nếu admin không có thực phẩm nào, đánh dấu _destroy = true thay vì xóa
            const deleteResult = await SchoolFoodModel.updateMany({ schoolId }, { $set: { _destroy: true } });

            return {
                total: 0,
                upserted: 0,
                modified: 0,
                deleted: deleteResult.modifiedCount,
            };
        }

        // ✅ 2. Lấy danh sách foodId từ admin
        const adminFoodIds = allFoods.map((food) => food._id.toString());

        // ✅ 3. Đánh dấu _destroy = true cho các thực phẩm KHÔNG CÒN trong admin
        // (KHÔNG XÓA để giữ reference trong meals)
        const deleteResult = await SchoolFoodModel.updateMany(
            {
                schoolId,
                foodId: { $nin: adminFoodIds },
                _destroy: false,
            },
            { $set: { _destroy: true } },
        );

        result.deletedCount = deleteResult.modifiedCount;

        if (deleteResult.modifiedCount > 0) {
            console.log(`🗑️ Marked ${deleteResult.modifiedCount} foods as deleted (not in admin database)`);
        }

        // ✅ 4. Upsert thực phẩm từ admin
        const bulkOps = [];

        for (const food of allFoods) {
            bulkOps.push({
                updateOne: {
                    filter: { schoolId, foodId: food._id },
                    update: {
                        // ✅ Nếu chưa có thì insert với _id mới
                        $setOnInsert: {
                            schoolId,
                            foodId: food._id,
                            // Các field tùy chỉnh của trường (giữ nguyên nếu đã có)
                            unitPrice: food.unitPrice,
                            unit: food.unit,
                            gramConversion: food.gramConversion,
                            wastePercentage: food.wastePercentage,
                        },
                        // ✅ Luôn update các field đồng bộ từ admin
                        $set: {
                            name: food.name,
                            nameWithoutAccent: food.nameWithoutAccent,
                            categories: food.categories,
                            protein: food.protein,
                            lipid: food.lipid,
                            glucid: food.glucid,
                            _destroy: false, // ✅ Đảm bảo food được khôi phục nếu đã bị đánh dấu xóa
                        },
                    },
                    upsert: true,
                },
            });
        }

        // ✅ Execute bulk operations
        if (bulkOps.length > 0) {
            const bulkResult = await SchoolFoodModel.bulkWrite(bulkOps);
            result.upsertedCount = bulkResult.upsertedCount || 0;
            result.modifiedCount = bulkResult.modifiedCount || 0;

            console.log(
                `✅ Synced ${result.upsertedCount} new, ${result.modifiedCount} updated, ${result.deletedCount} marked deleted`,
            );
        }

        console.log('✅ [syncFoodsForSchool] Completed');
        return {
            total: allFoods.length,
            upserted: result.upsertedCount,
            modified: result.modifiedCount,
            deleted: result.deletedCount,
        };
    } catch (error) {
        console.error('❌ [syncFoodsForSchool] Error:', error);
        throw error;
    }
};

/**
 * ✅ Lấy danh sách thực phẩm của trường
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 20, search = '', category = '', unit = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { schoolId: user.schoolId, _destroy: false };

        // ✅ Search by name (có dấu hoặc không dấu)
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
            SchoolFoodModel.find(filter)
                .populate('lastUpdatedBy', 'fullName username')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1, _id: -1 })
                .lean(),
            SchoolFoodModel.countDocuments(filter),
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
        console.error('❌ [SchoolFood getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách thực phẩm');
    }
};

/**
 * ✅ Lấy chi tiết thực phẩm
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const food = await SchoolFoodModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!food) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực phẩm');
        }

        return food;
    } catch (error) {
        console.error('❌ [SchoolFood getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin thực phẩm');
    }
};

/**
 * ✅ Cập nhật thực phẩm (Chỉ BGH được update: unitPrice, unit, gramConversion, wastePercentage)
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [SchoolFood update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được update
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền cập nhật thực phẩm');
        }

        const food = await SchoolFoodModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!food) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực phẩm');
        }

        // ✅ Chỉ cho phép update các field: unitPrice, unit, gramConversion, wastePercentage
        const allowedFields = ['unitPrice', 'unit', 'gramConversion', 'wastePercentage'];
        const updateData = {};

        allowedFields.forEach((field) => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        // ✅ Update
        Object.assign(food, updateData, { lastUpdatedBy: userId });
        await food.save();

        const updated = await SchoolFoodModel.findById(food._id).populate('lastUpdatedBy', 'fullName username').lean();

        console.log('✅ [SchoolFood update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [SchoolFood update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật thực phẩm');
    }
};

/**
 * ✅ FORCE SYNC: Đồng bộ TẤT CẢ thực phẩm từ admin (dù đã có hay chưa)
 */
const forceSync = async (userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được sync
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền đồng bộ');
        }

        console.log('🔄 [forceSync] Force syncing for school:', user.schoolId);

        const result = await syncFoodsForSchool(user.schoolId);

        return {
            synced: true,
            message: 'Đã đồng bộ danh sách thực phẩm từ ngân hàng dữ liệu',
            total: result.total,
            upserted: result.upserted,
            modified: result.modified,
        };
    } catch (error) {
        console.error('❌ [forceSync] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đồng bộ thực phẩm');
    }
};

/**
 * ✅ Kiểm tra và sync nếu trường chưa có thực phẩm (CHỈ LẦN ĐẦU)
 */
const checkAndSync = async (userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // Kiểm tra xem trường đã có thực phẩm chưa
        const count = await SchoolFoodModel.countDocuments({
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (count === 0) {
            console.log('🔄 [checkAndSync] School has no foods, syncing...');
            const result = await syncFoodsForSchool(user.schoolId);
            return {
                synced: true,
                message: `Đã đồng bộ ${result.total} thực phẩm từ ngân hàng dữ liệu`,
            };
        }

        return { synced: false, message: 'Trường đã có dữ liệu thực phẩm' };
    } catch (error) {
        console.error('❌ [checkAndSync] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi kiểm tra đồng bộ');
    }
};

export const schoolFoodServices = {
    syncFoodsForSchool,
    getAll,
    getDetails,
    update,
    checkAndSync,
    forceSync,
};
