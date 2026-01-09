// server/src/services/yearTargetServices.js

import { YearTargetModel } from '~/models/yearTargetModel.js';
import { EducationalActivityModel } from '~/models/educationalActivityModel.js'; // ✅ ADD
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Helper: Xóa cascade hoạt động giáo dục khi xóa 1 target cụ thể
 * @param {ObjectId} yearTargetId - ID của yearTarget document
 * @param {ObjectId} targetId - ID của target cần xóa (nằm trong mảng targets)
 */
const deleteCascadeActivitiesForTarget = async (yearTargetId, targetId) => {
    try {
        console.log('🗑️ [deleteCascadeActivitiesForTarget] Deleting activities for:', {
            yearTargetId: yearTargetId.toString(),
            targetId: targetId.toString(),
        });

        // ✅ Hard delete các hoạt động có targetId này
        const deleteResult = await EducationalActivityModel.deleteMany({
            yearTargetId: yearTargetId,
            targetId: targetId,
            _destroy: false,
        });

        console.log(`✅ Deleted ${deleteResult.deletedCount} educational activities for target ${targetId}`);

        return deleteResult.deletedCount;
    } catch (error) {
        console.error('❌ [deleteCascadeActivitiesForTarget] Error:', error);
        throw error;
    }
};

/**
 * ✅ Tạo mới Year Target
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [YearTarget createNew] Starting with data:', data);

        // ✅ Kiểm tra user (chỉ admin mới được tạo)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền tạo mục tiêu năm học');
        }

        // ✅ Kiểm tra nhóm tuổi đã tồn tại chưa
        const existing = await YearTargetModel.findOne({
            ageGroup: data.ageGroup,
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, `Nhóm tuổi "${data.ageGroup}" đã có mục tiêu năm học`);
        }

        // ✅ Tạo mới
        const newYearTarget = new YearTargetModel({
            ...data,
            createdBy: userId,
        });

        await newYearTarget.save();

        const populated = await YearTargetModel.findById(newYearTarget._id)
            .populate('createdBy', 'fullName username')
            .lean();

        console.log('✅ [YearTarget createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [YearTarget createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo mục tiêu năm học: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách Year Targets
 */
const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, ageGroup = '' } = query;
        const skip = (page - 1) * limit;

        const filter = { _destroy: false };
        if (ageGroup) filter.ageGroup = ageGroup;

        const [yearTargets, total] = await Promise.all([
            YearTargetModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ ageGroup: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            YearTargetModel.countDocuments(filter),
        ]);

        return {
            yearTargets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách mục tiêu năm học');
    }
};

/**
 * ✅ Lấy chi tiết Year Target
 */
const getDetails = async (id) => {
    try {
        const yearTarget = await YearTargetModel.findOne({ _id: id, _destroy: false })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!yearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        return yearTarget;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin mục tiêu năm học');
    }
};

/**
 * ✅ Cập nhật Year Target
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [YearTarget update] Starting with id:', id);

        // ✅ Kiểm tra user (chỉ admin mới được update)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền cập nhật mục tiêu năm học');
        }

        const yearTarget = await YearTargetModel.findOne({ _id: id, _destroy: false });
        if (!yearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        // ✅ Nếu đổi ageGroup, kiểm tra trùng
        if (data.ageGroup && data.ageGroup !== yearTarget.ageGroup) {
            const existing = await YearTargetModel.findOne({
                ageGroup: data.ageGroup,
                _id: { $ne: id },
                _destroy: false,
            });

            if (existing) {
                throw new ApiError(StatusCodes.CONFLICT, `Nhóm tuổi "${data.ageGroup}" đã có mục tiêu năm học`);
            }
        }

        // ✅ ============================================
        // CASCADE DELETE: Tìm targets bị xóa trong mainFields
        // ============================================
        if (data.mainFields) {
            console.log('🔍 [YearTarget update] Checking for deleted targets...');

            // Thu thập tất cả targetIds từ OLD structure
            const oldTargetIds = new Set();
            yearTarget.mainFields.forEach((mainField) => {
                if (mainField.subFields && Array.isArray(mainField.subFields)) {
                    mainField.subFields.forEach((subField) => {
                        subField.expectedResults?.forEach((er) => {
                            er.targets?.forEach((target) => {
                                if (target._id) oldTargetIds.add(target._id.toString());
                            });
                        });
                    });
                } else {
                    mainField.expectedResults?.forEach((er) => {
                        er.targets?.forEach((target) => {
                            if (target._id) oldTargetIds.add(target._id.toString());
                        });
                    });
                }
            });

            // Thu thập tất cả targetIds từ NEW structure
            const newTargetIds = new Set();
            data.mainFields.forEach((mainField) => {
                if (mainField.subFields && Array.isArray(mainField.subFields)) {
                    mainField.subFields.forEach((subField) => {
                        subField.expectedResults?.forEach((er) => {
                            er.targets?.forEach((target) => {
                                if (target._id) newTargetIds.add(target._id.toString());
                            });
                        });
                    });
                } else {
                    mainField.expectedResults?.forEach((er) => {
                        er.targets?.forEach((target) => {
                            if (target._id) newTargetIds.add(target._id.toString());
                        });
                    });
                }
            });

            // Tìm các targetIds bị xóa (có trong old nhưng không có trong new)
            const deletedTargetIds = [...oldTargetIds].filter((id) => !newTargetIds.has(id));

            console.log('📊 [YearTarget update] Target comparison:', {
                oldCount: oldTargetIds.size,
                newCount: newTargetIds.size,
                deletedCount: deletedTargetIds.length,
                deletedTargetIds,
            });

            // ✅ Xóa các hoạt động giáo dục tương ứng với targets bị xóa
            if (deletedTargetIds.length > 0) {
                let totalDeletedActivities = 0;

                for (const targetId of deletedTargetIds) {
                    const deletedCount = await deleteCascadeActivitiesForTarget(yearTarget._id, targetId);
                    totalDeletedActivities += deletedCount;
                }

                console.log(`✅ [YearTarget update] Cascade deleted ${totalDeletedActivities} educational activities`);
            }
        }

        // ✅ Update
        const updatedYearTarget = await YearTargetModel.findByIdAndUpdate(
            id,
            { ...data, lastUpdatedBy: userId },
            { new: true, runValidators: true },
        )
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [YearTarget update] Updated successfully');
        return updatedYearTarget;
    } catch (error) {
        console.error('❌ [YearTarget update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật mục tiêu năm học: ' + error.message);
    }
};

/**
 * ✅ Xóa Year Target (soft delete)
 */
const deleteYearTarget = async (id, userId) => {
    try {
        console.log('🗑️ [YearTarget deleteYearTarget] Starting with id:', id);

        // ✅ STEP 1: Verify user permission (only admin)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền xóa mục tiêu năm học');
        }

        // ✅ STEP 2: Find the year target
        const yearTarget = await YearTargetModel.findOne({ _id: id, _destroy: false });
        if (!yearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        console.log('📋 [YearTarget deleteYearTarget] Found target:', {
            _id: yearTarget._id,
            ageGroup: yearTarget.ageGroup,
        });

        // ✅ STEP 3: Collect all targetIds from mainFields structure
        const targetIdsToDelete = [];

        yearTarget.mainFields.forEach((mainField) => {
            // Case 1: Has subFields
            if (mainField.subFields && Array.isArray(mainField.subFields)) {
                mainField.subFields.forEach((subField) => {
                    if (subField.expectedResults && Array.isArray(subField.expectedResults)) {
                        subField.expectedResults.forEach((expectedResult) => {
                            if (expectedResult.targets && Array.isArray(expectedResult.targets)) {
                                expectedResult.targets.forEach((target) => {
                                    if (target._id) {
                                        targetIdsToDelete.push(target._id);
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // Case 2: Has expectedResults directly
            if (mainField.expectedResults && Array.isArray(mainField.expectedResults)) {
                mainField.expectedResults.forEach((expectedResult) => {
                    if (expectedResult.targets && Array.isArray(expectedResult.targets)) {
                        expectedResult.targets.forEach((target) => {
                            if (target._id) {
                                targetIdsToDelete.push(target._id);
                            }
                        });
                    }
                });
            }
        });

        console.log(
            `🔍 [YearTarget deleteYearTarget] Found ${targetIdsToDelete.length} target IDs to check for activities`,
        );

        // ✅ STEP 4: HARD DELETE related educational activities (by targetId)
        const deleteActivitiesResult = await EducationalActivityModel.deleteMany({
            yearTargetId: yearTarget._id,
            targetId: { $in: targetIdsToDelete },
            _destroy: false,
        });

        console.log(
            `🗑️ [YearTarget deleteYearTarget] HARD deleted ${deleteActivitiesResult.deletedCount} related educational activities`,
        );

        // ✅ STEP 5: HARD DELETE the year target
        await YearTargetModel.findByIdAndDelete(id);

        console.log('✅ [YearTarget deleteYearTarget] HARD deleted year target successfully');

        return {
            message: 'Xóa mục tiêu năm học thành công',
            deletedActivitiesCount: deleteActivitiesResult.deletedCount,
            yearTargetInfo: {
                ageGroup: yearTarget.ageGroup,
                targetsCount: targetIdsToDelete.length,
            },
        };
    } catch (error) {
        console.error('❌ [YearTarget deleteYearTarget] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa mục tiêu năm học: ' + error.message);
    }
};

export const yearTargetServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteYearTarget,
};
