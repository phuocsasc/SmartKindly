// server/src/services/schoolEducationalActivityServices.js

import { SchoolEducationalActivityModel } from '~/models/schoolEducationalActivityModel.js';
import { SchoolYearTargetModel } from '~/models/schoolYearTargetModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { UserModel } from '~/models/userModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ClassModel } from '~/models/classModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Helper: Get accessible age groups for user
 */
const getAccessibleAgeGroups = async (user, academicYearId) => {
    // Ban giám hiệu: full access
    if (user.role === 'ban_giam_hieu') {
        return [
            'Nhà trẻ 12-24 tháng',
            'Nhà trẻ 24-36 tháng',
            'Khối mầm 3-4 tuổi',
            'Khối chồi 4-5 tuổi',
            'Khối lá 5-6 tuổi',
        ];
    }

    // Tổ trưởng: xem theo tổ được phân công
    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        }).select('name');

        const ageGroups = [];
        const mapping = {
            'Khối Nhà Trẻ': ['Nhà trẻ 12-24 tháng', 'Nhà trẻ 24-36 tháng'],
            'Khối Mầm': ['Khối mầm 3-4 tuổi'],
            'Khối Chồi': ['Khối chồi 4-5 tuổi'],
            'Khối Lá': ['Khối lá 5-6 tuổi'],
        };

        departments.forEach((dept) => {
            const groups = mapping[dept.name];
            if (groups) ageGroups.push(...groups);
        });

        return [...new Set(ageGroups)];
    }

    // Giáo viên: xem theo lớp chủ nhiệm
    if (user.role === 'giao_vien') {
        const classData = await ClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id,
            _destroy: false,
        }).select('ageGroup');

        return classData ? [classData.ageGroup] : [];
    }

    return [];
};

/**
 * ✅ Tạo mới School Educational Activity
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [SchoolEducationalActivity createNew] Starting with data:', data);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra năm học (phải là active)
        const academicYear = await AcademicYearModel.findOne({
            _id: data.academicYearId,
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Chỉ có thể thêm hoạt động cho năm học đang hoạt động');
        }

        // ✅ Kiểm tra quyền truy cập ageGroup
        const accessibleAgeGroups = await getAccessibleAgeGroups(user, data.academicYearId);
        if (!accessibleAgeGroups.includes(data.ageGroup)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thêm hoạt động cho nhóm tuổi này');
        }

        // ✅ Kiểm tra SchoolYearTarget tồn tại
        const schoolYearTarget = await SchoolYearTargetModel.findOne({
            _id: data.schoolYearTargetId,
            schoolId,
            academicYearId: data.academicYearId,
            ageGroup: data.ageGroup,
            _destroy: false,
        });

        if (!schoolYearTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học tương ứng');
        }

        // ✅ Kiểm tra mục tiêu có tồn tại trong structure không
        let targetExists = false;
        let targetCode = null;

        // ✅ Tìm target và lấy code
        for (const mainField of schoolYearTarget.mainFields) {
            if (mainField.code !== data.mainFieldCode) continue;

            const expectedResults = data.subFieldCode
                ? mainField.subFields?.find((sf) => sf.code === data.subFieldCode)?.expectedResults
                : mainField.expectedResults;

            const expectedResult = expectedResults?.find((er) => er.code === data.expectedResultCode);
            const target = expectedResult?.targets?.find((t) => t._id.toString() === data.targetId);

            if (target) {
                targetExists = true;
                targetCode = target.code; // ✅ Lấy code từ structure
                break;
            }
        }

        if (!targetExists) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                `Không tìm thấy mục tiêu "${data.targetId}" trong cấu trúc mục tiêu năm học`,
            );
        }

        // ✅ Kiểm tra đã có hoạt động cho mục tiêu này chưa
        const existing = await SchoolEducationalActivityModel.findOne({
            schoolId,
            academicYearId: data.academicYearId,
            ageGroup: data.ageGroup,
            targetId: data.targetId, // ✅ Check theo targetId
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, `Mục tiêu "${data.targetId}" đã có hoạt động giáo dục`);
        }

        // ✅ Tạo mới
        const newActivity = new SchoolEducationalActivityModel({
            schoolId,
            academicYearId: data.academicYearId,
            ageGroup: data.ageGroup,
            schoolYearTargetId: data.schoolYearTargetId,
            targetId: data.targetId, // ✅ Lưu targetId
            mainFieldCode: data.mainFieldCode,
            subFieldCode: data.subFieldCode || null,
            expectedResultCode: data.expectedResultCode,
            targetCode: targetCode,
            activityContent: data.activityContent,
            createdBy: userId,
        });

        await newActivity.save();

        const populated = await SchoolEducationalActivityModel.findById(newActivity._id)
            .populate('createdBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        console.log('✅ [SchoolEducationalActivity createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [SchoolEducationalActivity createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo hoạt động giáo dục: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách School Educational Activities
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId, ageGroup } = query;

        const filter = {
            schoolId: user.schoolId,
            _destroy: false,
        };

        if (academicYearId) filter.academicYearId = academicYearId;
        if (ageGroup) filter.ageGroup = ageGroup;

        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            SchoolEducationalActivityModel.find(filter)
                .populate('schoolYearTargetId', 'ageGroup')
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SchoolEducationalActivityModel.countDocuments(filter),
        ]);

        // ✅ Enrich activities with current target info
        const enrichedActivities = await Promise.all(
            activities.map(async (activity) => {
                const yearTarget = await SchoolYearTargetModel.findById(activity.schoolYearTargetId);

                if (!yearTarget) return activity;

                // Find current target info by targetId
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
                                currentCode: target.code, // MT3 (sau khi renumber)
                                currentContent: target.content,
                                originalCode: activity.targetCode, // MT2 (lúc tạo)
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
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách hoạt động giáo dục');
    }
};

/**
 * ✅ Lấy chi tiết School Educational Activity
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const activity = await SchoolEducationalActivityModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        if (!activity) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hoạt động giáo dục');
        }

        // ✅ Kiểm tra quyền xem
        const accessibleAgeGroups = await getAccessibleAgeGroups(user, activity.academicYearId._id);
        if (!accessibleAgeGroups.includes(activity.ageGroup)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem hoạt động này');
        }

        return activity;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin hoạt động giáo dục');
    }
};

/**
 * ✅ Cập nhật School Educational Activity
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [SchoolEducationalActivity update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const activity = await SchoolEducationalActivityModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!activity) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hoạt động giáo dục');
        }

        // ✅ Chỉ update trong năm học đang active
        if (activity.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật hoạt động trong năm học đang hoạt động');
        }

        // ✅ Kiểm tra quyền cập nhật
        const accessibleAgeGroups = await getAccessibleAgeGroups(user, activity.academicYearId._id);
        if (!accessibleAgeGroups.includes(activity.ageGroup)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật hoạt động này');
        }

        // ✅ CHỈ cho phép update activityContent
        const updateData = {
            activityContent: data.activityContent,
            lastUpdatedBy: userId,
        };

        const updatedActivity = await SchoolEducationalActivityModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        console.log('✅ [SchoolEducationalActivity update] Updated successfully');

        return updatedActivity;
    } catch (error) {
        console.error('❌ [SchoolEducationalActivity update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật hoạt động giáo dục');
    }
};

/**
 * ✅ Xóa School Educational Activity
 */
const deleteActivity = async (id, userId) => {
    try {
        console.log('🔍 [deleteActivity] Starting with id:', id, 'userId:', userId);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        console.log('👤 [deleteActivity] User:', user);

        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const activity = await SchoolEducationalActivityModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });
        console.log('📋 [deleteActivity] Activity:', activity);

        if (!activity) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy hoạt động giáo dục');
        }

        console.log('🔍 [deleteActivity] academicYearId:', activity.academicYearId);
        console.log('🔍 [deleteActivity] academicYearId type:', typeof activity.academicYearId);

        // ✅ Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: activity.academicYearId,
            _destroy: false,
        }).select('status');
        console.log('📅 [deleteActivity] Academic year:', academicYear);

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        if (academicYear.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa hoạt động trong năm học đang hoạt động');
        }

        console.log('🔍 [deleteActivity] Calling getAccessibleAgeGroups...');
        const accessibleAgeGroups = await getAccessibleAgeGroups(user, activity.academicYearId);
        console.log('✅ [deleteActivity] Accessible age groups:', accessibleAgeGroups);

        if (!accessibleAgeGroups.includes(activity.ageGroup)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa hoạt động này');
        }

        if (user.role === 'giao_vien') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Giáo viên chỉ có quyền xem');
        }
        // ✅ Lưu thông tin trước khi xóa
        const activityInfo = {
            targetCode: activity.targetCode,
            ageGroup: activity.ageGroup,
        };

        await SchoolEducationalActivityModel.findByIdAndUpdate(id, { _destroy: true });
        console.log('✅ [deleteActivity] Deleted successfully');

        return { message: 'Xóa hoạt động giáo dục thành công', activityInfo };
    } catch (error) {
        console.error('❌ [SchoolEducationalActivity deleteActivity] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa hoạt động giáo dục');
    }
};

/**
 * ✅ Copy từ năm học cũ
 */
const copyFromYear = async (data, userId) => {
    try {
        console.log('📋 [SchoolEducationalActivity copyFromYear] Starting with data:', data);
        const { fromAcademicYearId, toAcademicYearId } = data;

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu và tổ trưởng mới được copy
        if (user.role !== 'ban_giam_hieu' && user.role !== 'to_truong') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Chỉ ban giám hiệu và tổ trưởng mới có quyền copy hoạt động giáo dục',
            );
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra năm học nguồn
        const fromYear = await AcademicYearModel.findOne({
            _id: fromAcademicYearId,
            schoolId,
            _destroy: false,
        });

        if (!fromYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học nguồn');
        }

        // ✅ Kiểm tra năm học đích (phải là active)
        const toYear = await AcademicYearModel.findOne({
            _id: toAcademicYearId,
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!toYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Năm học đích không hợp lệ hoặc không đang hoạt động');
        }

        // ✅ Xác định các nhóm tuổi được phép copy
        let allowedAgeGroups = [];

        if (user.role === 'ban_giam_hieu') {
            // Ban giám hiệu: copy tất cả
            allowedAgeGroups = [
                'Nhà trẻ 12-24 tháng',
                'Nhà trẻ 24-36 tháng',
                'Khối mầm 3-4 tuổi',
                'Khối chồi 4-5 tuổi',
                'Khối lá 5-6 tuổi',
            ];
        } else if (user.role === 'to_truong') {
            // Tổ trưởng: chỉ copy nhóm tuổi được quản lý
            const departments = await DepartmentModel.find({
                schoolId,
                academicYearId: toAcademicYearId, // ✅ Dùng năm đích để xác định quyền
                managers: user._id,
                _destroy: false,
            }).select('name');

            const mapping = {
                'Khối Nhà Trẻ': ['Nhà trẻ 12-24 tháng', 'Nhà trẻ 24-36 tháng'],
                'Khối Mầm': ['Khối mầm 3-4 tuổi'],
                'Khối Chồi': ['Khối chồi 4-5 tuổi'],
                'Khối Lá': ['Khối lá 5-6 tuổi'],
            };

            departments.forEach((dept) => {
                const groups = mapping[dept.name];
                if (groups) allowedAgeGroups.push(...groups);
            });

            allowedAgeGroups = [...new Set(allowedAgeGroups)];

            if (allowedAgeGroups.length === 0) {
                throw new ApiError(
                    StatusCodes.FORBIDDEN,
                    'Bạn không được phân công quản lý khối nào trong năm học đang hoạt động',
                );
            }

            console.log('📋 [Tổ trưởng] Allowed age groups to copy:', allowedAgeGroups);
        }

        // ✅ Lấy tất cả hoạt động từ năm cũ (chỉ lấy nhóm tuổi được phép)
        const sourceActivities = await SchoolEducationalActivityModel.find({
            schoolId,
            academicYearId: fromAcademicYearId,
            ageGroup: { $in: allowedAgeGroups },
            _destroy: false,
        });

        if (sourceActivities.length === 0) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'Năm học nguồn không có hoạt động giáo dục nào cho các nhóm tuổi bạn được phép quản lý',
            );
        }

        console.log(`📋 Found ${sourceActivities.length} activities to copy for allowed age groups`);

        // ✅ Xóa CỨNG các hoạt động hiện tại của năm đích (chỉ nhóm tuổi được phép)
        const deleteResult = await SchoolEducationalActivityModel.deleteMany({
            schoolId,
            academicYearId: toAcademicYearId,
            ageGroup: { $in: allowedAgeGroups },
            _destroy: false,
        });

        console.log(
            `🗑️ Hard deleted ${deleteResult.deletedCount} existing activities in destination year for allowed age groups`,
        );

        // ✅ Copy từng hoạt động
        const copiedActivities = [];
        for (const sourceActivity of sourceActivities) {
            // Tìm schoolYearTargetId tương ứng trong năm đích
            const targetYearTarget = await SchoolYearTargetModel.findOne({
                schoolId,
                academicYearId: toAcademicYearId,
                ageGroup: sourceActivity.ageGroup,
                _destroy: false,
            });

            if (!targetYearTarget) {
                console.log(`⚠️ Skipping: No target found for ageGroup ${sourceActivity.ageGroup} in destination year`);
                continue;
            }

            const newActivity = new SchoolEducationalActivityModel({
                schoolId,
                academicYearId: toAcademicYearId,
                ageGroup: sourceActivity.ageGroup,
                schoolYearTargetId: targetYearTarget._id,
                mainFieldCode: sourceActivity.mainFieldCode,
                subFieldCode: sourceActivity.subFieldCode,
                expectedResultCode: sourceActivity.expectedResultCode,
                targetCode: sourceActivity.targetCode,
                activityContent: sourceActivity.activityContent,
                createdBy: userId,
            });

            await newActivity.save();
            copiedActivities.push(newActivity);
        }

        const populatedActivities = await SchoolEducationalActivityModel.find({
            _id: { $in: copiedActivities.map((a) => a._id) },
        })
            .populate('createdBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        console.log('✅ [SchoolEducationalActivity copyFromYear] Copied successfully');
        return {
            count: populatedActivities.length,
            activities: populatedActivities,
            message:
                user.role === 'to_truong'
                    ? `Đã copy ${populatedActivities.length} hoạt động giáo dục cho ${allowedAgeGroups.length} nhóm tuổi bạn quản lý`
                    : `Đã copy ${populatedActivities.length} hoạt động giáo dục`,
        };
    } catch (error) {
        console.error('❌ [SchoolEducationalActivity copyFromYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi copy hoạt động giáo dục: ' + error.message);
    }
};

export const schoolEducationalActivityServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteActivity,
    copyFromYear,
};
