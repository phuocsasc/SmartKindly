import mongoose from 'mongoose';
import { SchoolYearTargetModel } from '~/models/schoolYearTargetModel.js';
import { SchoolEducationalActivityModel } from '~/models/schoolEducationalActivityModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { UserModel } from '~/models/userModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ClassModel } from '~/models/classModel.js';
import {
    ChildrenProgramCompleteModel,
    ChildrenProgramCompleteConfigModel,
} from '~/models/childrenProgramCompleteConfigModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { getNurseryDefaultData, getKindergartenDefaultData } from '~/utils/schoolYearTargetDefaultData.js';

/**
 * ✅ Helper: Xóa cascade dữ liệu liên quan khi thay đổi mục tiêu
 */
const deleteCascadeRelatedData = async (schoolId, academicYearId, ageGroup = null) => {
    try {
        console.log('🗑️ [deleteCascadeRelatedData] Starting cleanup:', { schoolId, academicYearId, ageGroup });

        // ✅ BƯỚC 1: Xóa cứng các bản đánh giá học sinh
        const evaluationFilter = {
            schoolId,
            academicYearId,
            _destroy: false,
        };

        // Nếu có ageGroup cụ thể, lọc theo classId thuộc ageGroup đó
        if (ageGroup) {
            const classes = await ClassModel.find({
                schoolId,
                academicYearId,
                ageGroup: getClassAgeGroupFromTarget(ageGroup),
                _destroy: false,
            }).select('_id');

            evaluationFilter.classId = { $in: classes.map((c) => c._id) };
        }

        const deletedEvaluations = await ChildrenProgramCompleteModel.deleteMany(evaluationFilter);
        console.log(`✅ Deleted ${deletedEvaluations.deletedCount} evaluations`);

        // ✅ BƯỚC 2: Xóa cứng các cấu hình mục tiêu
        const configFilter = {
            schoolId,
            academicYearId,
            _destroy: false,
        };

        if (ageGroup) {
            configFilter.ageGroup = ageGroup;
        }

        const deletedConfigs = await ChildrenProgramCompleteConfigModel.deleteMany(configFilter);
        console.log(`✅ Deleted ${deletedConfigs.deletedCount} configs`);

        return {
            evaluationsDeleted: deletedEvaluations.deletedCount,
            configsDeleted: deletedConfigs.deletedCount,
        };
    } catch (error) {
        console.error('❌ [deleteCascadeRelatedData] Error:', error);
        throw error;
    }
};

/**
 * ✅ Helper: Map target ageGroup sang class ageGroup
 */
const getClassAgeGroupFromTarget = (targetAgeGroup) => {
    const mapping = {
        'Nhà trẻ 12-24 tháng': '12-24 tháng',
        'Nhà trẻ 24-36 tháng': '24-36 tháng',
        'Khối mầm 3-4 tuổi': '3-4 tuổi',
        'Khối chồi 4-5 tuổi': '4-5 tuổi',
        'Khối lá 5-6 tuổi': '5-6 tuổi',
    };
    return mapping[targetAgeGroup] || null;
};

/**
 * ✅ Helper: Map department name to age groups
 */
const getDepartmentAgeGroups = (departmentName) => {
    const mapping = {
        'Khối Nhà Trẻ': ['Nhà trẻ 12-24 tháng', 'Nhà trẻ 24-36 tháng'],
        'Khối Mầm': ['Khối mầm 3-4 tuổi'],
        'Khối Chồi': ['Khối chồi 4-5 tuổi'],
        'Khối Lá': ['Khối lá 5-6 tuổi'],
    };
    return mapping[departmentName] || [];
};

/**
 * ✅ Helper: Map class ageGroup to corresponding year target groups
 * Class ageGroup format: "12-24 tháng", "24-36 tháng", "3-4 tuổi", "4-5 tuổi", "5-6 tuổi"
 * Year Target format: "Nhà trẻ 12-24 tháng", "Nhà trẻ 24-36 tháng", "Khối mầm 3-4 tuổi", "Khối chồi 4-5 tuổi", "Khối lá 5-6 tuổi"
 */
const getClassAgeGroups = (classAgeGroup) => {
    const mapping = {
        '12-24 tháng': ['Nhà trẻ 12-24 tháng'],
        '24-36 tháng': ['Nhà trẻ 24-36 tháng'],
        '3-4 tuổi': ['Khối mầm 3-4 tuổi'],
        '4-5 tuổi': ['Khối chồi 4-5 tuổi'],
        '5-6 tuổi': ['Khối lá 5-6 tuổi'],
    };
    return mapping[classAgeGroup] || [];
};

/**
 * ✅ Helper: Get accessible age groups for user
 */
const getAccessibleAgeGroups = async (user, academicYearId) => {
    console.log('🔍 [getAccessibleAgeGroups] Checking for user:', user._id, 'role:', user.role);

    // ✅ Ban giám hiệu: full quyền tất cả các nhóm tuổi
    if (user.role === 'ban_giam_hieu') {
        console.log('✅ Ban giám hiệu - Full access');
        return [
            'Nhà trẻ 12-24 tháng',
            'Nhà trẻ 24-36 tháng',
            'Khối mầm 3-4 tuổi',
            'Khối chồi 4-5 tuổi',
            'Khối lá 5-6 tuổi',
        ];
    }

    // ✅ Tổ trưởng: xem theo tổ bộ môn được phân công
    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        }).select('name');

        console.log('📋 [getAccessibleAgeGroups] Departments found:', departments.length);

        const ageGroups = [];
        departments.forEach((dept) => {
            console.log('🏢 Department:', dept.name);
            const groups = getDepartmentAgeGroups(dept.name);
            console.log('  → Age groups:', groups);
            ageGroups.push(...groups);
        });

        const uniqueAgeGroups = [...new Set(ageGroups)];
        console.log('✅ Tổ trưởng accessible age groups:', uniqueAgeGroups);
        return uniqueAgeGroups;
    }

    // ✅ Giáo viên: xem theo lớp được phân công chủ nhiệm
    if (user.role === 'giao_vien') {
        const classData = await ClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id,
            _destroy: false,
        }).select('ageGroup');

        console.log('🎒 [getAccessibleAgeGroups] Class found:', classData?.ageGroup || 'None');

        if (classData) {
            const ageGroups = getClassAgeGroups(classData.ageGroup);
            console.log('✅ Giáo viên accessible age groups:', ageGroups);
            return ageGroups;
        }
    }

    console.log('❌ No accessible age groups found');
    return [];
};

/**
 * ✅ Tạo mới School Year Target
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [SchoolYearTarget createNew] Starting with data:', data);

        // ✅ Lấy user info
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được tạo
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền tạo mục tiêu năm học');
        }

        const schoolId = user.schoolId;

        // ✅ Lấy năm học đang active
        const activeYear = await AcademicYearModel.findOne({
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không có năm học đang hoạt động');
        }

        // ✅ Kiểm tra đã tồn tại chưa
        const existing = await SchoolYearTargetModel.findOne({
            schoolId,
            academicYearId: activeYear._id,
            ageGroup: data.ageGroup,
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, `Nhóm tuổi "${data.ageGroup}" đã có mục tiêu trong năm học này`);
        }

        // ✅ Xóa cascade dữ liệu liên quan cho ageGroup này
        await deleteCascadeRelatedData(schoolId, activeYear._id, data.ageGroup);

        // ✅ Tạo mới
        const newTarget = new SchoolYearTargetModel({
            schoolId,
            academicYearId: activeYear._id,
            ageGroup: data.ageGroup,
            mainFields: data.mainFields,
            createdBy: userId,
        });

        await newTarget.save();

        const populated = await SchoolYearTargetModel.findById(newTarget._id)
            .populate('createdBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        console.log('✅ [SchoolYearTarget createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [SchoolYearTarget createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo mục tiêu năm học: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách School Year Targets
 */
const getAll = async (query, userId) => {
    try {
        console.log('📥 [SchoolYearTarget getAll] Starting with query:', query);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        console.log('👤 User:', user._id, 'Role:', user.role, 'SchoolId:', user.schoolId);

        const { page = 1, limit = 10, academicYearId = '', ageGroup = '' } = query;
        const skip = (page - 1) * limit;

        // ✅ Xác định năm học
        let targetAcademicYearId = academicYearId;
        if (!targetAcademicYearId) {
            const activeYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                status: 'active',
                _destroy: false,
            }).select('_id');

            console.log('📅 Active year:', activeYear);

            if (!activeYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không có năm học đang hoạt động');
            }
            targetAcademicYearId = activeYear._id;
        }

        console.log('📅 Target Academic Year ID:', targetAcademicYearId);

        // ✅ Kiểm tra quyền truy cập
        const accessibleAgeGroups = await getAccessibleAgeGroups(user, targetAcademicYearId);

        console.log('🔓 Accessible age groups:', accessibleAgeGroups);

        if (accessibleAgeGroups.length === 0) {
            console.log('❌ No accessible age groups - returning empty');
            return {
                targets: [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    totalItems: 0,
                    totalPages: 0,
                },
            };
        }

        // ✅ Build filter
        const filter = {
            schoolId: user.schoolId,
            academicYearId: targetAcademicYearId,
            ageGroup: { $in: accessibleAgeGroups },
            _destroy: false,
        };

        // ✅ Nếu có filter ageGroup cụ thể, kiểm tra quyền truy cập
        if (ageGroup) {
            if (!accessibleAgeGroups.includes(ageGroup)) {
                console.log('❌ Requested age group not accessible:', ageGroup);
                return {
                    targets: [],
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        totalItems: 0,
                        totalPages: 0,
                    },
                };
            }
            filter.ageGroup = ageGroup;
        }

        console.log('🔍 Filter:', JSON.stringify(filter, null, 2));

        const [targets, total] = await Promise.all([
            SchoolYearTargetModel.find(filter)
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .populate('academicYearId', 'fromYear toYear status')
                .sort({ ageGroup: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            SchoolYearTargetModel.countDocuments(filter),
        ]);

        console.log('✅ Found targets:', targets.length);

        return {
            targets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [SchoolYearTarget getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách mục tiêu năm học');
    }
};

/**
 * ✅ Lấy chi tiết School Year Target
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const target = await SchoolYearTargetModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        if (!target) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        // ✅ Kiểm tra quyền truy cập
        const accessibleAgeGroups = await getAccessibleAgeGroups(user, target.academicYearId._id);
        if (!accessibleAgeGroups.includes(target.ageGroup)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem mục tiêu này');
        }

        return target;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin mục tiêu năm học');
    }
};

/**
 * ✅ Cập nhật School Year Target
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [SchoolYearTarget update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được cập nhật
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền cập nhật mục tiêu năm học');
        }

        const target = await SchoolYearTargetModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!target) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        // ✅ Chỉ được cập nhật năm học đang active
        if (target.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật mục tiêu trong năm học đang hoạt động');
        }

        // ✅ Xóa cascade dữ liệu liên quan cho ageGroup này
        await deleteCascadeRelatedData(user.schoolId, target.academicYearId._id, target.ageGroup);
        // ✅ Update
        const updateData = { ...data, lastUpdatedBy: userId };
        const updated = await SchoolYearTargetModel.findByIdAndUpdate(id, updateData, { new: true })
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        console.log('✅ [SchoolYearTarget update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [SchoolYearTarget update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật mục tiêu năm học');
    }
};

/**
 * ✅ Xóa School Year Target
 */
const deleteTarget = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được xóa
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền xóa mục tiêu năm học');
        }

        const target = await SchoolYearTargetModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!target) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học');
        }

        // ✅ Chỉ được xóa năm học đang active
        if (target.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa mục tiêu trong năm học đang hoạt động');
        }

        // ✅ Lưu thông tin trước khi xóa
        const targetInfo = {
            ageGroup: target.ageGroup,
            academicYear: `${target.academicYearId.fromYear}-${target.academicYearId.toYear}`,
        };

        // ✅ Xóa cascade dữ liệu liên quan cho ageGroup này
        await deleteCascadeRelatedData(user.schoolId, target.academicYearId._id, target.ageGroup);

        // Soft delete
        await SchoolYearTargetModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa mục tiêu năm học thành công', targetInfo };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa mục tiêu năm học');
    }
};

/**
 * ✅ Copy từ năm học cũ
 */
const copyFromYear = async (data, userId) => {
    try {
        console.log('📋 [SchoolYearTarget copyFromYear] Starting with data:', data);
        const { fromAcademicYearId, toAcademicYearId } = data;

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được copy
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền copy mục tiêu năm học');
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

        // ✅ Lấy tất cả mục tiêu từ năm cũ
        const sourceTargets = await SchoolYearTargetModel.find({
            schoolId,
            academicYearId: fromAcademicYearId,
            _destroy: false,
        });

        if (sourceTargets.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Năm học nguồn không có mục tiêu nào');
        }

        console.log(`📋 Found ${sourceTargets.length} targets to copy`);

        // ✅ Xóa cascade TẤT CẢ dữ liệu liên quan (tất cả ageGroups)
        await deleteCascadeRelatedData(schoolId, toAcademicYearId);

        // ✅ BƯỚC 1: Xóa CỨNG tất cả mục tiêu hiện tại của năm học đang active
        const deleteTargetsResult = await SchoolYearTargetModel.deleteMany({
            schoolId,
            academicYearId: toAcademicYearId,
            _destroy: false,
        });

        console.log(`🗑️ Hard deleted ${deleteTargetsResult.deletedCount} existing targets in destination year`);

        // ✅ BƯỚC 2: Xóa CỨNG tất cả hoạt động giáo dục hiện tại của năm học đang active
        const deleteActivitiesResult = await SchoolEducationalActivityModel.deleteMany({
            schoolId,
            academicYearId: toAcademicYearId,
            _destroy: false,
        });

        console.log(`🗑️ Hard deleted ${deleteActivitiesResult.deletedCount} existing activities in destination year`);

        // ✅ BƯỚC 3: Copy từng mục tiêu và tạo mapping cho targetId
        const copiedTargets = [];
        const oldToNewSchoolYearTargetIdMap = new Map(); // Map: oldSchoolYearTargetId -> newSchoolYearTargetId
        const oldToNewTargetIdMap = new Map(); // Map: oldTargetId (_id trong targets array) -> newTargetId

        for (const sourceTarget of sourceTargets) {
            // Clone mainFields để tạo ObjectId mới cho tất cả targets
            const newMainFields = JSON.parse(JSON.stringify(sourceTarget.mainFields));

            // ✅ Duyệt qua structure để tạo mapping targetId cũ -> mới
            newMainFields.forEach((mainField) => {
                if (mainField.subFields && mainField.subFields.length > 0) {
                    mainField.subFields.forEach((subField) => {
                        subField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                const oldTargetId = target._id; // _id cũ (string)
                                const newTargetId = new mongoose.Types.ObjectId(); // Tạo _id mới
                                target._id = newTargetId; // Gán _id mới

                                // Lưu mapping
                                oldToNewTargetIdMap.set(oldTargetId.toString(), newTargetId.toString());
                            });
                        });
                    });
                } else {
                    mainField.expectedResults?.forEach((expectedResult) => {
                        expectedResult.targets?.forEach((target) => {
                            const oldTargetId = target._id;
                            const newTargetId = new mongoose.Types.ObjectId();
                            target._id = newTargetId;

                            oldToNewTargetIdMap.set(oldTargetId.toString(), newTargetId.toString());
                        });
                    });
                }
            });

            // Tạo SchoolYearTarget mới với mainFields đã có _id mới
            const newTarget = new SchoolYearTargetModel({
                schoolId,
                academicYearId: toAcademicYearId,
                ageGroup: sourceTarget.ageGroup,
                mainFields: newMainFields,
                createdBy: userId,
            });

            await newTarget.save();
            copiedTargets.push(newTarget);

            // Lưu mapping: oldSchoolYearTargetId -> newSchoolYearTargetId
            oldToNewSchoolYearTargetIdMap.set(sourceTarget._id.toString(), newTarget._id);
        }

        console.log(`✅ Copied ${copiedTargets.length} year targets successfully`);
        console.log(`📊 Created mapping for ${oldToNewTargetIdMap.size} targets`);

        // ✅ BƯỚC 4: Copy hoạt động giáo dục với targetId mapping chính xác
        const sourceActivities = await SchoolEducationalActivityModel.find({
            schoolId,
            academicYearId: fromAcademicYearId,
            _destroy: false,
        });

        console.log(`📋 Found ${sourceActivities.length} activities to copy`);

        const copiedActivities = [];

        for (const sourceActivity of sourceActivities) {
            // ✅ Map schoolYearTargetId
            const oldSchoolYearTargetId = sourceActivity.schoolYearTargetId.toString();
            const newSchoolYearTargetId = oldToNewSchoolYearTargetIdMap.get(oldSchoolYearTargetId);

            if (!newSchoolYearTargetId) {
                console.log(
                    `⚠️ Skipping activity: No corresponding schoolYearTarget found for ${oldSchoolYearTargetId}`,
                );
                continue;
            }

            // ✅ Map targetId (từ _id trong targets array)
            const oldTargetId = sourceActivity.targetId.toString();
            const newTargetId = oldToNewTargetIdMap.get(oldTargetId);

            if (!newTargetId) {
                console.log(`⚠️ Skipping activity: No corresponding targetId found for ${oldTargetId}`);
                continue;
            }

            const newActivity = new SchoolEducationalActivityModel({
                schoolId,
                academicYearId: toAcademicYearId,
                ageGroup: sourceActivity.ageGroup,
                schoolYearTargetId: newSchoolYearTargetId, // ✅ Sử dụng ID mới của SchoolYearTarget
                targetId: newTargetId, // ✅ Sử dụng _id mới của target
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

        console.log(`✅ Copied ${copiedActivities.length} activities successfully`);

        // ✅ Đánh dấu năm học đích đã cấu hình
        if (!toYear.isConfig) {
            toYear.isConfig = true;
            await toYear.save();
            console.log('✅ [SchoolYearTarget copyFromYear] Academic year marked as configured');
        }

        const populatedTargets = await SchoolYearTargetModel.find({
            _id: { $in: copiedTargets.map((t) => t._id) },
        })
            .populate('createdBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        console.log('✅ [SchoolYearTarget copyFromYear] Completed successfully');

        return {
            count: populatedTargets.length,
            targets: populatedTargets,
            activitiesCount: copiedActivities.length,
        };
    } catch (error) {
        console.error('❌ [SchoolYearTarget copyFromYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi copy mục tiêu năm học: ' + error.message);
    }
};

/**
 * ✅ Initialize default targets cho năm học mới
 */
const initializeDefaultTargets = async (academicYearId, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const ageGroups = [
            'Nhà trẻ 12-24 tháng',
            'Nhà trẻ 24-36 tháng',
            'Khối mầm 3-4 tuổi',
            'Khối chồi 4-5 tuổi',
            'Khối lá 5-6 tuổi',
        ];

        const targets = [];
        for (const ageGroup of ageGroups) {
            const defaultData = ageGroup.startsWith('Nhà trẻ') ? getNurseryDefaultData() : getKindergartenDefaultData();

            const newTarget = new SchoolYearTargetModel({
                schoolId: user.schoolId,
                academicYearId,
                ageGroup,
                mainFields: defaultData,
                createdBy: userId,
            });

            await newTarget.save();
            targets.push(newTarget);
        }

        return targets;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi khởi tạo mục tiêu mặc định');
    }
};

/**
 * ✅ Copy từ hệ thống (YearTarget)
 */
const copyFromSystem = async (academicYearId, userId) => {
    try {
        console.log('📋 [SchoolYearTarget copyFromSystem] Starting with academicYearId:', academicYearId);

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được copy
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền copy mục tiêu từ hệ thống');
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra năm học đích (phải là active)
        const toYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!toYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Năm học đích không hợp lệ hoặc không đang hoạt động');
        }

        // ✅ Import YearTargetModel để lấy mục tiêu từ hệ thống
        const { YearTargetModel } = await import('~/models/yearTargetModel.js');

        // ✅ Lấy tất cả mục tiêu từ hệ thống (YearTarget collection)
        const systemTargets = await YearTargetModel.find({ _destroy: false });

        if (systemTargets.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Hệ thống chưa có mục tiêu mẫu nào');
        }

        // ✅ Xóa cascade TẤT CẢ dữ liệu liên quan
        await deleteCascadeRelatedData(schoolId, academicYearId);

        console.log(`📋 Found ${systemTargets.length} system targets to copy`);

        // ✅ Xóa CỨNG tất cả mục tiêu hiện tại của năm học đang active
        const deleteResult = await SchoolYearTargetModel.deleteMany({
            schoolId,
            academicYearId,
            _destroy: false,
        });

        console.log(`🗑️ Hard deleted ${deleteResult.deletedCount} existing targets in destination year`);

        // ✅ Copy từng mục tiêu từ hệ thống
        const copiedTargets = [];
        for (const systemTarget of systemTargets) {
            const newTarget = new SchoolYearTargetModel({
                schoolId,
                academicYearId,
                ageGroup: systemTarget.ageGroup,
                mainFields: systemTarget.mainFields, // Copy toàn bộ structure
                createdBy: userId,
            });

            await newTarget.save();
            copiedTargets.push(newTarget);
        }

        // ✅ Đánh dấu năm học đích đã cấu hình
        if (!toYear.isConfig) {
            toYear.isConfig = true;
            await toYear.save();
            console.log('✅ [SchoolYearTarget copyFromSystem] Academic year marked as configured');
        }

        const populatedTargets = await SchoolYearTargetModel.find({
            _id: { $in: copiedTargets.map((t) => t._id) },
        })
            .populate('createdBy', 'fullName username')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        console.log('✅ [SchoolYearTarget copyFromSystem] Copied successfully');
        return {
            count: populatedTargets.length,
            targets: populatedTargets,
        };
    } catch (error) {
        console.error('❌ [SchoolYearTarget copyFromSystem] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi copy mục tiêu từ hệ thống: ' + error.message);
    }
};

/**
 * ✅ Get system preview cho dialog copy
 */
const getSystemPreview = async (userId) => {
    try {
        console.log('📋 [SchoolYearTarget getSystemPreview] Starting');

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được xem preview
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền xem mục tiêu mẫu từ hệ thống');
        }

        // ✅ Import YearTargetModel để lấy mục tiêu từ hệ thống
        const { YearTargetModel } = await import('~/models/yearTargetModel.js');

        // ✅ Lấy tất cả mục tiêu từ hệ thống (YearTarget collection)
        const systemTargets = await YearTargetModel.find({ _destroy: false }).lean();

        console.log(`📋 Found ${systemTargets.length} system targets for preview`);

        return {
            count: systemTargets.length,
            targets: systemTargets,
        };
    } catch (error) {
        console.error('❌ [SchoolYearTarget getSystemPreview] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Lỗi khi lấy thông tin xem trước từ hệ thống: ' + error.message,
        );
    }
};

export const schoolYearTargetServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteTarget,
    copyFromYear,
    copyFromSystem, // ✅ Add new function
    getSystemPreview,
    initializeDefaultTargets,
};
