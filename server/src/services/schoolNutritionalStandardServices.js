// server/src/services/schoolNutritionalStandardServices.js

import { SchoolNutritionalStandardModel } from '~/models/schoolNutritionalStandardModel.js';
import { NutritionalStandardModel } from '~/models/nutritionalStandardModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Đồng bộ định mức dinh dưỡng từ Admin sang School
 */
const syncStandardsForSchool = async (schoolId) => {
    try {
        console.log('🔄 [syncStandardsForSchool] Starting for schoolId:', schoolId);

        // 1. Lấy tất cả định mức từ Admin
        const allStandards = await NutritionalStandardModel.find({ _destroy: false }).lean();

        if (allStandards.length === 0) {
            return { total: 0, synced: 0, message: 'Không có định mức dinh dưỡng nào trong hệ thống' };
        }

        const bulkOps = [];

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
                            plgStructure: standard.plgStructure,
                            protein: standard.protein,
                            lipid: standard.lipid,
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
        const result = await SchoolNutritionalStandardModel.bulkWrite(bulkOps);

        console.log('✅ [syncStandardsForSchool] Synced successfully');
        return {
            total: allStandards.length,
            synced: result.upsertedCount + result.modifiedCount,
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
            // Auto sync if no data
            const syncResult = await syncStandardsForSchool(user.schoolId);
            return { synced: true, message: syncResult.message };
        }

        return { synced: false, message: 'Đã có dữ liệu định mức dinh dưỡng' };
    } catch (error) {
        console.error('❌ [SchoolNutritionalStandard checkAndSync] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi kiểm tra đồng bộ định mức dinh dưỡng');
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

        // ✅ Chỉ BGH mới được force sync
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền đồng bộ định mức dinh dưỡng');
        }

        const syncResult = await syncStandardsForSchool(user.schoolId);
        return syncResult;
    } catch (error) {
        console.error('❌ [SchoolNutritionalStandard forceSync] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi đồng bộ định mức dinh dưỡng');
    }
};

export const schoolNutritionalStandardServices = {
    syncStandardsForSchool,
    getAll,
    getDetails,
    checkAndSync,
    forceSync,
};
