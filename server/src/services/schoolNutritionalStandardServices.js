// server/src/services/schoolNutritionalStandardServices.js

import { SchoolNutritionalStandardModel } from '~/models/schoolNutritionalStandardModel.js';
import { NutritionalStandardModel } from '~/models/nutritionalStandardModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Đồng bộ định mức dinh dưỡng từ NutritionalStandardModel sang SchoolNutritionalStandardModel
 */
const syncStandardsForSchool = async (schoolId) => {
    try {
        console.log('🔄 [syncStandardsForSchool] Starting for schoolId:', schoolId);

        // 1. Lấy tất cả định mức dinh dưỡng từ admin database
        const allStandards = await NutritionalStandardModel.find({ _destroy: false }).lean();

        if (allStandards.length === 0) {
            return { total: 0, upserted: 0, modified: 0, message: 'Không có định mức dinh dưỡng nào trong hệ thống' };
        }

        const bulkOps = [];
        const result = { upsertedCount: 0, modifiedCount: 0 };

        // 2. Prepare bulk operations
        for (const standard of allStandards) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        schoolId: schoolId,
                        nutritionalStandardId: standard._id,
                    },
                    update: {
                        $setOnInsert: {
                            schoolId: schoolId,
                            nutritionalStandardId: standard._id,
                            _destroy: false,
                        },
                        $set: {
                            ageGroup: standard.ageGroup,
                            plgStructures: standard.plgStructures.map((plg) => ({
                                protein: plg.protein,
                                lipid: plg.lipid,
                                glucid: plg.glucid,
                                isSelected: false, // ✅ Default = false
                            })),
                            proteinAnimal: standard.proteinAnimal,
                            proteinPlant: standard.proteinPlant,
                            lipidAnimal: standard.lipidAnimal,
                            lipidPlant: standard.lipidPlant,
                            glucid: standard.glucid,
                            totalCalories: standard.totalCalories,
                            recommendedCaloriesMin: standard.recommendedCaloriesMin,
                            recommendedCaloriesMax: standard.recommendedCaloriesMax,
                        },
                    },
                    upsert: true,
                },
            });
        }

        // 3. Execute bulk operations
        if (bulkOps.length > 0) {
            const bulkResult = await SchoolNutritionalStandardModel.bulkWrite(bulkOps);
            result.upsertedCount = bulkResult.upsertedCount || 0;
            result.modifiedCount = bulkResult.modifiedCount || 0;

            console.log(`✅ Synced ${result.upsertedCount} new, ${result.modifiedCount} updated`);
        }

        console.log('✅ [syncStandardsForSchool] Completed');
        return {
            total: allStandards.length,
            upserted: result.upsertedCount,
            modified: result.modifiedCount,
            message: `Đồng bộ thành công ${allStandards.length} định mức dinh dưỡng`,
        };
    } catch (error) {
        console.error('❌ [syncStandardsForSchool] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đồng bộ định mức dinh dưỡng: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách định mức dinh dưỡng của trường
 */
const getAll = async (query, userId) => {
    try {
        const { page = 1, limit = 20, ageGroup = '' } = query;
        const skip = (page - 1) * limit;

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const filter = { schoolId: user.schoolId, _destroy: false };

        if (ageGroup) {
            filter.ageGroup = ageGroup;
        }

        const [standards, total] = await Promise.all([
            SchoolNutritionalStandardModel.find(filter)
                .populate('lastUpdatedBy', 'fullName username')
                .skip(skip)
                .limit(Number(limit))
                .sort({ createdAt: -1 })
                .lean(),
            SchoolNutritionalStandardModel.countDocuments(filter),
        ]);

        return {
            standards,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [SchoolNutritionalStandard getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách định mức dinh dưỡng');
    }
};

/**
 * ✅ Lấy chi tiết định mức dinh dưỡng
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const standard = await SchoolNutritionalStandardModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!standard) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy định mức dinh dưỡng');
        }

        return standard;
    } catch (error) {
        console.error('❌ [SchoolNutritionalStandard getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin định mức dinh dưỡng');
    }
};

/**
 * ✅ Cập nhật định mức dinh dưỡng (chỉ BGH, chỉ chọn 1 PLG structure)
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [SchoolNutritionalStandard update] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được update
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền cập nhật định mức dinh dưỡng');
        }

        const standard = await SchoolNutritionalStandardModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!standard) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy định mức dinh dưỡng');
        }

        // ✅ Validate chỉ được chọn 1 PLG structure
        if (data.plgStructures) {
            const selectedCount = data.plgStructures.filter((plg) => plg.isSelected).length;
            if (selectedCount > 1) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được chọn 1 cơ cấu PLG chuẩn');
            }
        }

        // ✅ Update
        Object.assign(standard, data, { lastUpdatedBy: userId });
        await standard.save();

        const updated = await SchoolNutritionalStandardModel.findById(standard._id)
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [SchoolNutritionalStandard update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [SchoolNutritionalStandard update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật định mức dinh dưỡng: ' + error.message);
    }
};

/**
 * ✅ Kiểm tra và tự động đồng bộ lần đầu
 */
const checkAndSync = async (userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const count = await SchoolNutritionalStandardModel.countDocuments({
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (count === 0) {
            console.log('🔄 [checkAndSync] School has no standards, syncing...');
            const result = await syncStandardsForSchool(user.schoolId);
            return {
                synced: true,
                message: `Đã đồng bộ ${result.total} định mức dinh dưỡng từ ngân hàng dữ liệu`,
            };
        }

        return { synced: false, message: 'Trường đã có dữ liệu định mức dinh dưỡng' };
    } catch (error) {
        console.error('❌ [checkAndSync] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi kiểm tra đồng bộ');
    }
};

/**
 * ✅ Force sync (đồng bộ tất cả)
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

        const result = await syncStandardsForSchool(user.schoolId);

        return {
            synced: true,
            message: `Đã đồng bộ thành công: ${result.upserted} mới, ${result.modified} cập nhật`,
            data: result,
        };
    } catch (error) {
        console.error('❌ [forceSync] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đồng bộ: ' + error.message);
    }
};

export const schoolNutritionalStandardServices = {
    syncStandardsForSchool,
    getAll,
    getDetails,
    update,
    checkAndSync,
    forceSync,
};
