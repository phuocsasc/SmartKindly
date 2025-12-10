import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import {
    ChildrenProgramCompleteModel,
    ChildrenProgramCompleteConfigModel,
} from '~/models/childrenProgramCompleteConfigModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { SchoolYearTargetModel } from '~/models/schoolYearTargetModel.js';
import { UserModel } from '~/models/userModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ClassModel } from '~/models/classModel.js';
import { ChildrenProfileModel } from '~/models/childrenProfileModel.js';
import { logAction } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

// ✅ Helper: Check if user can access a class
const canAccessClass = async (user, classId) => {
    const classData = await ClassModel.findById(classId).select('schoolId ageGroup mainTeacher').lean();
    if (!classData) return false;
    if (String(classData.schoolId) !== String(user.schoolId)) return false;

    if (user.role === 'ban_giam_hieu') return true;

    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            managers: user._id,
            _destroy: false,
        })
            .select('name')
            .lean();

        const managedDeptNames = departments.map((d) => d.name);
        // Map department to grade (khối)
        const gradeMapping = {
            'Khối Nhà Trẻ': ['12-24 tháng', '24-36 tháng'],
            'Khối Mầm': ['mầm'],
            'Khối Chồi': ['chồi'],
            'Khối Lá': ['lá'],
        };

        for (const deptName of managedDeptNames) {
            const grades = gradeMapping[deptName] || [];
            for (const grade of grades) {
                if (classData.ageGroup.includes(grade)) return true;
            }
        }
        return false;
    }

    if (user.role === 'giao_vien') {
        return classData.mainTeacher && String(classData.mainTeacher) === String(user._id);
    }

    return false;
};

// ✅ Helper: Get accessible classes for user
const getAccessibleClassesByUser = async (user, academicYearId) => {
    // Ban giám hiệu: full access
    if (user.role === 'ban_giam_hieu') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('_id');

        return classes.map((c) => String(c._id));
    }

    // Tổ trưởng
    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        }).select('name');

        const DEPARTMENT_TO_AGE_GROUP = {
            'Khối Nhà Trẻ': ['12-24 tháng', '24-36 tháng'],
            'Khối Mầm': ['3-4 tuổi'],
            'Khối Chồi': ['4-5 tuổi'],
            'Khối Lá': ['5-6 tuổi'],
        };

        let allowedAgeGroups = [];
        departments.forEach((d) => {
            const list = DEPARTMENT_TO_AGE_GROUP[d.name];
            if (list) allowedAgeGroups.push(...list);
        });

        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            ageGroup: { $in: allowedAgeGroups },
            _destroy: false,
        }).select('_id');

        return classes.map((c) => String(c._id));
    }

    // Giáo viên chủ nhiệm
    if (user.role === 'giao_vien') {
        const classData = await ClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id, // FIXED
            _destroy: false,
        }).select('_id');

        return classData ? [String(classData._id)] : [];
    }

    return [];
};

// ✅ Config: Upsert selected targets (BGH only)
const upsertConfig = async (data, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu được cấu hình mục tiêu');
        }

        const { academicYearId, ageGroup, selectedTargetIds } = data;

        // ✅ Validate academicYearId
        if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'ID năm học không hợp lệ');
        }

        // Verify active year
        const academicYear = await AcademicYearModel.findOne({
            _id: new mongoose.Types.ObjectId(academicYearId),
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        }).select('fromYear toYear');

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được cấu hình trong năm học đang hoạt động');
        }

        // Verify targets exist in SchoolYearTarget
        const syTarget = await SchoolYearTargetModel.findOne({
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            ageGroup,
            _destroy: false,
        }).lean();

        if (!syTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy mục tiêu năm học cho nhóm tuổi này');
        }

        // Validate that all selected target IDs exist in the target structure
        const validTargetIds = new Set();
        const extractTargetIds = (mainFields) => {
            mainFields.forEach((mainField) => {
                // Sub-fields
                if (mainField.subFields) {
                    mainField.subFields.forEach((subField) => {
                        subField.expectedResults?.forEach((er) => {
                            er.targets?.forEach((t) => validTargetIds.add(String(t._id)));
                        });
                    });
                }
                // Direct expected results
                mainField.expectedResults?.forEach((er) => {
                    er.targets?.forEach((t) => validTargetIds.add(String(t._id)));
                });
            });
        };

        if (syTarget.mainFields) extractTargetIds(syTarget.mainFields);

        selectedTargetIds.forEach((id) => {
            if (!validTargetIds.has(String(id))) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    'Một số targetId không thuộc cấu trúc mục tiêu năm học hiện tại',
                );
            }
        });

        const updated = await ChildrenProgramCompleteConfigModel.findOneAndUpdate(
            {
                schoolId: user.schoolId,
                academicYearId: new mongoose.Types.ObjectId(academicYearId),
                ageGroup,
                _destroy: false,
            },
            {
                schoolId: user.schoolId,
                academicYearId: new mongoose.Types.ObjectId(academicYearId),
                ageGroup,
                selectedTargetIds,
                lastUpdatedBy: user._id,
                $setOnInsert: { createdBy: user._id },
            },
            { upsert: true, new: true },
        );

        console.log('✅ [upsertConfig] Success:', updated._id);

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.UPDATE,
            AUDIT_LOG_RESOURCES.CHILDREN_PROGRAM_COMPLETE,
            `Cấu hình ${selectedTargetIds.length} mục tiêu đánh giá cho nhóm tuổi "${ageGroup}" - Năm học ${academicYear.fromYear}-${academicYear.toYear}`,
            {
                ageGroup,
                academicYearId,
                academicYear: `${academicYear.fromYear}-${academicYear.toYear}`,
                selectedTargetIds,
                targetsCount: selectedTargetIds.length,
            },
        );

        return updated;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cấu hình mục tiêu: ' + error.message);
    }
};

// ✅ Config: Get all configs for a year
const getConfigByYear = async (academicYearId, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Validate academicYearId
        if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'ID năm học không hợp lệ');
        }

        // ✅ FIX: So sánh schoolId với string, không ObjectId
        const configs = await ChildrenProgramCompleteConfigModel.find({
            schoolId: user.schoolId, // ✅ So sánh string với string
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            _destroy: false,
        }).lean();

        return { configs };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy cấu hình: ' + error.message);
    }
};

// ✅ CRUD: Create evaluation
const createNew = async (data, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id').lean();
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { academicYearId, classId, studentId, assessmentDetails, note = '' } = data;

        // ✅ Validate IDs
        if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'ID năm học không hợp lệ');
        }

        // Verify active year
        const academicYear = await AcademicYearModel.findOne({
            _id: new mongoose.Types.ObjectId(academicYearId),
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        })
            .select('fromYear toYear')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được đánh giá trong năm học đang hoạt động');
        }

        // Verify class
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            _destroy: false,
        })
            .select('name ageGroup')
            .lean();

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // Permission check
        const canAccess = await canAccessClass(user, classId);
        if (!canAccess) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thao tác với lớp này');
        }

        // Verify student
        const student = await ChildrenProfileModel.findOne({
            _id: studentId,
            schoolId: user.schoolId,
            classId,
            status: 'Đang học',
            _destroy: false,
        })
            .select('fullName studentCode')
            .lean();

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy học sinh hoặc học sinh không đang học');
        }

        // Check duplicate
        const existing = await ChildrenProgramCompleteModel.findOne({
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            studentId,
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, 'Đã có đánh giá cho học sinh này trong năm học này');
        }

        // Verify config exists for this age group
        const ageGroupMapping = {
            '12-24 tháng': 'Nhà trẻ 12-24 tháng',
            '24-36 tháng': 'Nhà trẻ 24-36 tháng',
            mầm: 'Khối mầm 3-4 tuổi',
            chồi: 'Khối chồi 4-5 tuổi',
            lá: 'Khối lá 5-6 tuổi',
        };

        const mappedAgeGroup = ageGroupMapping[classData.ageGroup];
        const config = await ChildrenProgramCompleteConfigModel.findOne({
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            ageGroup: mappedAgeGroup,
            _destroy: false,
        }).lean();

        if (!config) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Chưa cấu hình mục tiêu cho nhóm tuổi "${mappedAgeGroup}"`);
        }

        // Validate assessment details match config
        const configSet = new Set(config.selectedTargetIds.map((id) => String(id)));
        if (assessmentDetails && assessmentDetails.length > 0) {
            assessmentDetails.forEach((detail) => {
                if (!configSet.has(String(detail.targetId))) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'Có mục tiêu không thuộc danh sách cấu hình');
                }
            });
        }

        // ✅ Create evaluation
        const created = await ChildrenProgramCompleteModel.create({
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            classId,
            studentId,
            assessmentDetails: assessmentDetails || [],
            note: note || '',
            createdBy: user._id,
        });

        console.log('✅ [createNew] Created successfully:', created._id);

        const populated = await ChildrenProgramCompleteModel.findById(created._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name ageGroup')
            .populate('studentId', 'fullName studentCode')
            .lean();

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.CREATE,
            AUDIT_LOG_RESOURCES.CHILDREN_PROGRAM_COMPLETE,
            `Tạo đánh giá hoàn thành chương trình cho "${student.fullName}" - Lớp "${classData.name}" - Năm học ${academicYear.fromYear}-${academicYear.toYear}`,
            {
                classId,
                className: classData.name,
                studentId,
                studentName: student.fullName,
                studentCode: student.studentCode,
                academicYearId,
                academicYear: `${academicYear.fromYear}-${academicYear.toYear}`,
                targetsCount: assessmentDetails?.length || 0,
            },
        );

        return populated;
    } catch (error) {
        console.error('❌ [createNew] Error:', error.message);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo đánh giá: ' + error.message);
    }
};

// ✅ CRUD: Get all evaluations
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', classId = '', search = '' } = query;

        // ✅ Verify academic year
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ FIX: Luôn lấy accessible classes theo năm học được chọn
        const accessibleClassIds = await getAccessibleClassesByUser(user, academicYearId);
        console.log('📋 [getAll] Accessible class IDs:', accessibleClassIds);

        // ✅ FIX: Kiểm tra classId có thuộc năm học được chọn không
        if (classId) {
            // Verify class belongs to selected academic year
            const classData = await ClassModel.findOne({
                _id: classId,
                academicYearId,
                _destroy: false,
            });

            if (!classData) {
                console.log('❌ [getAll] Class not found in selected year');
                return {
                    items: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: parseInt(limit),
                    },
                };
            }

            // Check permission
            if (!accessibleClassIds.includes(classId)) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem lớp này');
            }
        }

        // ✅ Build filter
        let filter = {
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        };

        if (classId) {
            filter.classId = classId;
        } else {
            // If no classId specified, show all accessible classes
            filter.classId = { $in: accessibleClassIds };
        }

        if (search) {
            filter.$or = [
                { 'studentId.fullName': { $regex: search, $options: 'i' } },
                { 'studentId.studentCode': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [items, total] = await Promise.all([
            ChildrenProgramCompleteModel.find(filter)
                .populate('studentId', 'fullName studentCode')
                .populate('classId', 'name')
                .populate('academicYearId', 'fromYear toYear')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            ChildrenProgramCompleteModel.countDocuments(filter),
        ]);

        console.log('✅ [getAll] Found items:', items.length);

        return {
            items,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        console.error('❌ [getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách: ' + error.message);
    }
};

// ✅ CRUD: Get details
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id').lean();
        if (!user || !user.schoolId) throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');

        const doc = await ChildrenProgramCompleteModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name ageGroup')
            .populate('studentId', 'fullName studentCode')
            .lean();

        if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');

        // Permission check
        const canAccess = await canAccessClass(user, doc.classId._id);
        if (!canAccess) throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem');

        return doc;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết: ' + error.message);
    }
};

// ✅ CRUD: Update evaluation
const update = async (id, data, userId) => {
    try {
        console.log('📝 [ChildrenProgramComplete update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const evaluation = await ChildrenProgramCompleteModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'status fromYear toYear')
            .populate('classId', 'name')
            .populate('studentId', 'fullName studentCode');

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Only update in active year
        if (evaluation.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật đánh giá trong năm học đang hoạt động');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClassesByUser(user, evaluation.academicYearId._id);
        if (!accessibleClassIds.includes(evaluation.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thao tác');
        }

        // ✅ Update fields
        if (data.assessmentDetails !== undefined) evaluation.assessmentDetails = data.assessmentDetails;
        if (data.note !== undefined) evaluation.note = data.note;

        evaluation.lastUpdatedBy = userId;
        await evaluation.save();

        console.log('✅ [ChildrenProgramComplete update] Updated successfully');

        const updated = await ChildrenProgramCompleteModel.findById(evaluation._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name ageGroup')
            .populate('studentId', 'fullName studentCode')
            .lean();

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.UPDATE,
            AUDIT_LOG_RESOURCES.CHILDREN_PROGRAM_COMPLETE,
            `Cập nhật đánh giá hoàn thành chương trình cho "${evaluation.studentId.fullName}" - Lớp "${evaluation.classId.name}" - Năm học ${evaluation.academicYearId.fromYear}-${evaluation.academicYearId.toYear}`,
            {
                classId: evaluation.classId._id,
                className: evaluation.classId.name,
                studentId: evaluation.studentId._id,
                studentName: evaluation.studentId.fullName,
                studentCode: evaluation.studentId.studentCode,
                academicYearId: evaluation.academicYearId._id,
                academicYear: `${evaluation.academicYearId.fromYear}-${evaluation.academicYearId.toYear}`,
                targetsCount: evaluation.assessmentDetails?.length || 0,
            },
        );

        return { message: 'Cập nhật đánh giá thành công' };
    } catch (error) {
        console.error('❌ [ChildrenProgramComplete update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật đánh giá: ' + error.message);
    }
};

// ✅ CRUD: Delete evaluation
const deleteEvaluation = async (id, userId) => {
    try {
        console.log('🗑️ [ChildrenProgramComplete delete] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const evaluation = await ChildrenProgramCompleteModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'status fromYear toYear')
            .populate('classId', 'name')
            .populate('studentId', 'fullName studentCode');

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Only delete in active year
        if (evaluation.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa đánh giá trong năm học đang hoạt động');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClassesByUser(user, evaluation.academicYearId._id);
        if (!accessibleClassIds.includes(evaluation.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thao tác');
        }

        // ✅ Lưu thông tin trước khi xóa
        const evaluationInfo = {
            studentName: evaluation.studentId.fullName,
            studentCode: evaluation.studentId.studentCode,
            className: evaluation.classId.name,
            academicYear: `${evaluation.academicYearId.fromYear}-${evaluation.academicYearId.toYear}`,
        };

        // ✅ Soft delete
        evaluation._destroy = true;
        await evaluation.save();

        console.log('✅ [ChildrenProgramComplete delete] Deleted successfully');

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.DELETE,
            AUDIT_LOG_RESOURCES.CHILDREN_PROGRAM_COMPLETE,
            `Xóa đánh giá hoàn thành chương trình cho "${evaluationInfo.studentName}" - Lớp "${evaluationInfo.className}" - Năm học ${evaluationInfo.academicYear}`,
            {
                studentName: evaluationInfo.studentName,
                studentCode: evaluationInfo.studentCode,
                className: evaluationInfo.className,
                academicYear: evaluationInfo.academicYear,
            },
        );

        return { message: 'Xóa đánh giá thành công' };
    } catch (error) {
        console.error('❌ [ChildrenProgramComplete delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa đánh giá: ' + error.message);
    }
};

export const childrenProgramCompleteServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteEvaluation,
    upsertConfig,
    getConfigByYear,
};
