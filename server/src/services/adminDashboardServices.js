// server/src/services/adminDashboardServices.js

import { UserModel } from '~/models/userModel.js';
import { SchoolModel } from '~/models/schoolModel.js';
import { FoodModel } from '~/models/foodModel.js';
import { YearTargetModel } from '~/models/yearTargetModel.js';
import { EducationalActivityModel } from '~/models/educationalActivityModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Helper: Verify user is admin
 */
const verifyAdmin = async (userId) => {
    const user = await UserModel.findById(userId).select('role');
    if (!user || user.role !== 'admin') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền truy cập');
    }
    return user;
};

/**
 * ✅ GET ADMIN DASHBOARD STATISTICS
 */
const getAdminDashboardStats = async (userId) => {
    try {
        console.log('📊 [AdminDashboard getStats] Starting...');

        // ✅ Step 1: Verify admin permission
        await verifyAdmin(userId);

        // ============================================
        // ✅ 1. THỐNG KÊ TRƯỜNG HỌC THEO TRẠNG THÁI
        // ============================================
        console.log('📊 [1/5] Calculating schools statistics...');

        const schoolsByStatus = await SchoolModel.aggregate([
            {
                $match: {
                    _destroy: false,
                },
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const totalActiveSchools = schoolsByStatus.find((s) => s._id === true)?.count || 0;
        const totalInactiveSchools = schoolsByStatus.find((s) => s._id === false)?.count || 0;
        const totalSchools = totalActiveSchools + totalInactiveSchools;

        console.log('✅ Schools stats:', {
            total: totalSchools,
            active: totalActiveSchools,
            inactive: totalInactiveSchools,
        });

        // ============================================
        // ✅ 2. THỐNG KÊ NGƯỜI DÙNG THEO VAI TRÒ
        // ============================================
        console.log('📊 [2/5] Calculating users statistics...');

        const usersByRole = await UserModel.aggregate([
            {
                $match: {
                    role: { $in: ['ban_giam_hieu', 'to_truong', 'giao_vien', 'phu_huynh'] },
                    status: true, // Only active users
                    _destroy: false,
                },
            },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                },
            },
        ]);

        const banGiamHieuCount = usersByRole.find((u) => u._id === 'ban_giam_hieu')?.count || 0;
        const toTruongCount = usersByRole.find((u) => u._id === 'to_truong')?.count || 0;
        const giaoVienCount = usersByRole.find((u) => u._id === 'giao_vien')?.count || 0;
        const phuHuynhCount = usersByRole.find((u) => u._id === 'phu_huynh')?.count || 0;

        const totalUsers = banGiamHieuCount + toTruongCount + giaoVienCount + phuHuynhCount;

        console.log('✅ Users stats:', {
            total: totalUsers,
            banGiamHieu: banGiamHieuCount,
            toTruong: toTruongCount,
            giaoVien: giaoVienCount,
            phuHuynh: phuHuynhCount,
        });

        // ============================================
        // ✅ 3. THỐNG KÊ THỰC PHẨM THEO LOẠI
        // ============================================
        console.log('📊 [3/5] Calculating food statistics...');

        const foodByType = await FoodModel.aggregate([
            {
                $match: {
                    _destroy: false,
                },
            },
            {
                $group: {
                    _id: '$foodType',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        const totalFoods = foodByType.reduce((sum, item) => sum + item.count, 0);

        console.log('✅ Food stats:', {
            total: totalFoods,
            byType: foodByType.map((f) => ({ foodType: f._id, count: f.count })),
        });

        // ============================================
        // ✅ 4. THỐNG KÊ MỤC TIÊU NĂM HỌC THEO ĐỘ TUỔI
        // ============================================
        console.log('📊 [4/5] Calculating year targets statistics...');

        const yearTargets = await YearTargetModel.find({
            _destroy: false,
        })
            .select('ageGroup mainFields')
            .lean();

        const yearTargetsByAgeGroup = yearTargets.map((target) => {
            let totalTargets = 0;

            // Count targets in mainFields structure
            if (target.mainFields && Array.isArray(target.mainFields)) {
                target.mainFields.forEach((mainField) => {
                    // Case 1: Has subFields
                    if (mainField.subFields && Array.isArray(mainField.subFields)) {
                        mainField.subFields.forEach((subField) => {
                            if (subField.expectedResults && Array.isArray(subField.expectedResults)) {
                                subField.expectedResults.forEach((expectedResult) => {
                                    if (expectedResult.targets && Array.isArray(expectedResult.targets)) {
                                        totalTargets += expectedResult.targets.length;
                                    }
                                });
                            }
                        });
                    }

                    // Case 2: Has expectedResults directly
                    if (mainField.expectedResults && Array.isArray(mainField.expectedResults)) {
                        mainField.expectedResults.forEach((expectedResult) => {
                            if (expectedResult.targets && Array.isArray(expectedResult.targets)) {
                                totalTargets += expectedResult.targets.length;
                            }
                        });
                    }
                });
            }

            return {
                ageGroup: target.ageGroup,
                count: totalTargets,
            };
        });

        const totalYearTargets = yearTargetsByAgeGroup.reduce((sum, item) => sum + item.count, 0);

        console.log('✅ Year targets stats:', {
            total: totalYearTargets,
            byAgeGroup: yearTargetsByAgeGroup,
        });

        // ============================================
        // ✅ 5. THỐNG KÊ HOẠT ĐỘNG GIÁO DỤC THEO ĐỘ TUỔI
        // ============================================
        console.log('📊 [5/5] Calculating educational activities statistics...');

        const activitiesByAgeGroup = await EducationalActivityModel.aggregate([
            {
                $match: {
                    _destroy: false,
                },
            },
            {
                $group: {
                    _id: '$ageGroup',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        const totalActivities = activitiesByAgeGroup.reduce((sum, item) => sum + item.count, 0);

        console.log('✅ Educational activities stats:', {
            total: totalActivities,
            byAgeGroup: activitiesByAgeGroup.map((a) => ({ ageGroup: a._id, count: a.count })),
        });

        // ============================================
        // ✅ FINAL RESPONSE
        // ============================================
        console.log('✅ [AdminDashboard getStats] Completed');

        return {
            // 1. School statistics
            schools: {
                total: totalSchools,
                active: totalActiveSchools,
                inactive: totalInactiveSchools,
            },

            // 2. User statistics by role
            users: {
                total: totalUsers,
                byRole: [
                    { role: 'ban_giam_hieu', count: banGiamHieuCount },
                    { role: 'to_truong', count: toTruongCount },
                    { role: 'giao_vien', count: giaoVienCount },
                    { role: 'phu_huynh', count: phuHuynhCount },
                ],
            },

            // 3. Food statistics by type
            foods: {
                total: totalFoods,
                byType: foodByType.map((item) => ({
                    foodType: item._id,
                    count: item.count,
                })),
            },

            // 4. Year targets by age group
            yearTargets: {
                total: totalYearTargets,
                byAgeGroup: yearTargetsByAgeGroup,
            },

            // 5. Educational activities by age group
            educationalActivities: {
                total: totalActivities,
                byAgeGroup: activitiesByAgeGroup.map((item) => ({
                    ageGroup: item._id,
                    count: item.count,
                })),
            },
        };
    } catch (error) {
        console.error('❌ [AdminDashboard getStats] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thống kê dashboard admin');
    }
};

export const adminDashboardServices = {
    getAdminDashboardStats,
};
