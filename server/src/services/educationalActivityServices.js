// server/src/services/educationalActivityServices.js

import { EducationalActivityModel } from '~/models/educationalActivityModel.js';
import { YearTargetModel } from '~/models/yearTargetModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Tạo mới hoạt động giáo dục
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [EducationalActivity createNew] Starting with data:', data);

        // ✅ Kiểm tra user (chỉ admin mới được tạo)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền tạo hoạt động giáo dục');
        }

        // ✅ Kiểm tra yearTarget tồn tại
        const yearTarget = await YearTargetModel.findOne({
            _id: data.yearTargetId,
            ageGroup: data.ageGroup,
            _destroy: false,
        });

        if (!yearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học tương ứng');
        }

        // ✅ Kiểm tra mục tiêu (targetCode) có tồn tại trong yearTarget không
        let targetExists = false;
        let targetCode = null;

        for (const mainField of yearTarget.mainFields) {
            if (mainField.code !== data.mainFieldCode) continue;

            const expectedResults = data.subFieldCode
                ? mainField.subFields?.find((sf) => sf.code === data.subFieldCode)?.expectedResults
                : mainField.expectedResults;

            const expectedResult = expectedResults?.find((er) => er.code === data.expectedResultCode);
            const target = expectedResult?.targets?.find((t) => t._id.toString() === data.targetId);

            if (target) {
                targetExists = true;
                targetCode = target.code; // Get code from structure
                break;
            }
        }

        if (!targetExists) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                `Không tìm thấy mục tiêu với ID "${data.targetId}" trong cấu trúc mục tiêu năm học`,
            );
        }

        // ✅ Check duplicate by targetId
        const existing = await EducationalActivityModel.findOne({
            ageGroup: data.ageGroup,
            targetId: data.targetId, // ✅ Check by targetId
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Mục tiêu "${targetCode}" đã có hoạt động giáo dục. Mỗi mục tiêu chỉ có 1 hoạt động.`,
            );
        }

        // ✅ Tạo mới
        const newActivity = new EducationalActivityModel({
            ageGroup: data.ageGroup,
            yearTargetId: data.yearTargetId,
            targetId: data.targetId, // ✅ Primary key
            mainFieldCode: data.mainFieldCode,
            subFieldCode: data.subFieldCode || null,
            expectedResultCode: data.expectedResultCode,
            targetCode: targetCode, // Snapshot
            activityContent: data.activityContent,
            createdBy: userId,
        });

        await newActivity.save();

        const populated = await EducationalActivityModel.findById(newActivity._id)
            .populate('createdBy', 'fullName username')
            .populate('yearTargetId', 'ageGroup')
            .lean();

        console.log('✅ [EducationalActivity createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [EducationalActivity createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo hoạt động giáo dục: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách hoạt động giáo dục
 */
const getAll = async (query) => {
    try {
        const { page = 1, limit = 10, ageGroup } = query;

        const filter = { _destroy: false };
        if (ageGroup) filter.ageGroup = ageGroup;

        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            EducationalActivityModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('yearTargetId', 'ageGroup')
                .sort({ ageGroup: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            EducationalActivityModel.countDocuments(filter),
        ]);

        // ✅ Enrich with current target info
        const enrichedActivities = await Promise.all(
            activities.map(async (activity) => {
                const yearTarget = await YearTargetModel.findById(activity.yearTargetId);

                if (!yearTarget) return activity;

                let currentTargetInfo = null;

                for (const mainField of yearTarget.mainFields) {
                    const expectedResults = activity.subFieldCode
                        ? mainField.subFields?.find((sf) => sf.code === activity.subFieldCode)?.expectedResults
                        : mainField.expectedResults;

                    for (const expectedResult of expectedResults || []) {
                        const target = expectedResult.targets?.find(
                            (t) => t._id.toString() === activity.targetId.toString(),
                        );

                        if (target) {
                            currentTargetInfo = {
                                currentCode: target.code, // MT3 (after renumber)
                                currentContent: target.content,
                                originalCode: activity.targetCode, // MT2 (at creation)
                            };
                            break;
                        }
                    }

                    if (currentTargetInfo) break;
                }

                return {
                    ...activity,
                    currentTargetInfo,
                };
            }),
        );

        return {
            activities: enrichedActivities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [EducationalActivity getAll] Error:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách hoạt động giáo dục');
    }
};

/**
 * ✅ Lấy chi tiết hoạt động giáo dục
 */
const getDetails = async (id) => {
    try {
        const activity = await EducationalActivityModel.findOne({ _id: id, _destroy: false })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .populate('yearTargetId', 'ageGroup mainFields')
            .lean();

        if (!activity) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hoạt động giáo dục');
        }

        return activity;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin hoạt động giáo dục');
    }
};

/**
 * ✅ Lấy hoạt động giáo dục theo targetCode
 */
const getByTargetCode = async (query) => {
    try {
        const { ageGroup, targetCode } = query;

        if (!ageGroup || !targetCode) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Thiếu thông tin ageGroup hoặc targetCode');
        }

        const activity = await EducationalActivityModel.findOne({
            ageGroup,
            targetCode,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        return activity; // Trả về null nếu chưa có hoạt động
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy hoạt động giáo dục theo mục tiêu');
    }
};

/**
 * ✅ Cập nhật hoạt động giáo dục
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [EducationalActivity update] Starting with id:', id);

        // ✅ Kiểm tra user (chỉ admin mới được update)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền cập nhật hoạt động giáo dục');
        }

        const activity = await EducationalActivityModel.findOne({ _id: id, _destroy: false });
        if (!activity) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hoạt động giáo dục');
        }

        // ✅ Update
        const updatedActivity = await EducationalActivityModel.findByIdAndUpdate(
            id,
            { ...data, lastUpdatedBy: userId },
            { new: true, runValidators: true },
        )
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .populate('yearTargetId', 'ageGroup')
            .lean();

        console.log('✅ [EducationalActivity update] Updated successfully');
        return updatedActivity;
    } catch (error) {
        console.error('❌ [EducationalActivity update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật hoạt động giáo dục: ' + error.message);
    }
};

/**
 * ✅ Xóa hoạt động giáo dục (soft delete)
 */
const deleteActivity = async (id, userId) => {
    try {
        // ✅ Kiểm tra user (chỉ admin mới được xóa)
        const user = await UserModel.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ admin mới có quyền xóa hoạt động giáo dục');
        }

        const activity = await EducationalActivityModel.findOne({ _id: id, _destroy: false });
        if (!activity) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hoạt động giáo dục');
        }

        await EducationalActivityModel.deleteOne({ _id: id });

        return { message: 'Xóa hoạt động giáo dục thành công' };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa hoạt động giáo dục');
    }
};

export const educationalActivityServices = {
    createNew,
    getAll,
    getDetails,
    getByTargetCode,
    update,
    deleteActivity,
};
