// server/src/services/childrenProgramCompleteServices.js

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
import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';

// ===== HELPER FUNCTIONS =====

/**
 * ✅ Ensure user belongs to a school
 */
const ensureUserSchool = async (userId) => {
    const user = await UserModel.findById(userId).select('schoolId role _id');
    if (!user || !user.schoolId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
    }
    return user;
};

/**
 * ✅ Get academic year or throw error
 */
const getAcademicYearOrThrow = async (schoolId, academicYearId) => {
    const year = await AcademicYearModel.findOne({
        _id: academicYearId,
        schoolId,
        _destroy: false,
    });
    if (!year) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
    }
    return year;
};

/**
 * ✅ Map department name to grade
 */
const DEPT_TO_GRADE = {
    'Khối Nhà Trẻ': 'Nhà trẻ',
    'Khối Mầm': 'Mầm',
    'Khối Chồi': 'Chồi',
    'Khối Lá': 'Lá',
};

/**
 * ✅ Get accessible classes for user based on role
 */
const getAccessibleClassIds = async (user, academicYearId) => {
    // BGH: tất cả lớp
    if (user.role === 'ban_giam_hieu') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    // Tổ trưởng: các lớp trong khối quản lý
    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        }).select('name');

        const managedGrades = departments.map((dept) => DEPT_TO_GRADE[dept.name]).filter(Boolean);

        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            grade: { $in: managedGrades },
            _destroy: false,
        }).select('_id');

        return classes.map((c) => c._id.toString());
    }

    // Giáo viên: lớp chủ nhiệm
    if (user.role === 'giao_vien') {
        const classData = await ClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id,
            _destroy: false,
        }).select('_id');

        return classData ? [classData._id.toString()] : [];
    }

    return [];
};

/**
 * ✅ Map class ageGroup to config ageGroup
 */
const mapClassAgeGroupToConfigAgeGroup = (classAgeGroup) => {
    const mapping = {
        '12-24 tháng': 'Nhà trẻ 12-24 tháng',
        '24-36 tháng': 'Nhà trẻ 24-36 tháng',
        '3-4 tuổi': 'Khối mầm 3-4 tuổi',
        '4-5 tuổi': 'Khối chồi 4-5 tuổi',
        '5-6 tuổi': 'Khối lá 5-6 tuổi',
    };
    return mapping[classAgeGroup] || null;
};

// ===== CONFIG FUNCTIONS (BGH ONLY) =====

/**
 * ✅ CREATE/UPDATE Config: Cấu hình mục tiêu cho nhóm tuổi
 */
const upsertConfig = async (data, userId) => {
    try {
        console.log('📝 [ProgramComplete upsertConfig] Starting:', data);

        const user = await ensureUserSchool(userId);

        // Chỉ BGH được cấu hình
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu được phép cấu hình mục tiêu');
        }

        const { academicYearId, ageGroup, selectedTargetIds } = data;

        // Validate năm học active
        const year = await getAcademicYearOrThrow(user.schoolId, academicYearId);
        if (year.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được cấu hình trong năm học đang hoạt động');
        }

        // Validate selectedTargetIds (tối thiểu 5)
        if (!selectedTargetIds || selectedTargetIds.length < 5) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Phải chọn tối thiểu 5 mục tiêu');
        }

        // Verify targets exist in SchoolYearTarget
        const syTarget = await SchoolYearTargetModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            ageGroup,
            _destroy: false,
        }).lean();

        if (!syTarget) {
            throw new ApiError(StatusCodes.NOT_FOUND, `Không tìm thấy mục tiêu năm học cho nhóm tuổi "${ageGroup}"`);
        }

        // Extract all valid targetIds from SchoolYearTarget
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

        // Validate all selectedTargetIds are valid
        selectedTargetIds.forEach((id) => {
            if (!validTargetIds.has(String(id))) {
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    `Mục tiêu ID "${id}" không thuộc cấu trúc mục tiêu năm học`,
                );
            }
        });

        // Upsert config
        const config = await ChildrenProgramCompleteConfigModel.findOneAndUpdate(
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

        console.log('✅ [ProgramComplete upsertConfig] Success:', config._id);
        return config;
    } catch (error) {
        console.error('❌ [ProgramComplete upsertConfig] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cấu hình mục tiêu: ' + error.message);
    }
};

/**
 * ✅ GET Config by year
 */
const getConfigByYear = async (academicYearId, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'ID năm học không hợp lệ');
        }

        await getAcademicYearOrThrow(user.schoolId, academicYearId);

        const configs = await ChildrenProgramCompleteConfigModel.find({
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            _destroy: false,
        }).lean();

        return { configs };
    } catch (error) {
        console.error('❌ [ProgramComplete getConfigByYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy cấu hình: ' + error.message);
    }
};

/**
 * ✅ DELETE Config
 */
const deleteConfig = async (ageGroup, academicYearId, userId) => {
    try {
        console.log('🗑️ [ProgramComplete deleteConfig] Starting:', { ageGroup, academicYearId });

        const user = await ensureUserSchool(userId);

        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu được phép xóa cấu hình');
        }

        const year = await getAcademicYearOrThrow(user.schoolId, academicYearId);
        if (year.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được xóa cấu hình trong năm học đang hoạt động');
        }

        const config = await ChildrenProgramCompleteConfigModel.findOneAndDelete({
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(academicYearId),
            ageGroup,
            _destroy: false,
        });

        if (!config) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy cấu hình');
        }

        console.log('✅ [ProgramComplete deleteConfig] Deleted successfully');
        return { message: 'Xóa cấu hình thành công' };
    } catch (error) {
        console.error('❌ [ProgramComplete deleteConfig] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa cấu hình: ' + error.message);
    }
};

// ===== CRUD FUNCTIONS =====

/**
 * ✅ CREATE: Tạo đánh giá mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [ProgramComplete createNew] Starting:', data);

        const user = await ensureUserSchool(userId);
        const { academicYearId, classId, studentId, assessmentDetails, note = '' } = data;

        // Validate năm học active
        const year = await getAcademicYearOrThrow(user.schoolId, academicYearId);
        if (year.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được đánh giá trong năm học đang hoạt động');
        }

        // Validate class
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('name ageGroup');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, academicYearId);
        if (!accessibleClassIds.includes(classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền đánh giá lớp này');
        }

        // Validate student exists and is in class
        const studentInClass = await ChildrenByClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            _destroy: false,
        }).populate('studentId', 'fullName studentCode status');

        if (!studentInClass || !studentInClass.studentId) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Học sinh không thuộc lớp này');
        }

        // const student = studentInClass.studentId;

        // Check duplicate: 1 học sinh chỉ đánh giá 1 lần/năm
        const existing = await ChildrenProgramCompleteModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            studentId,
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, 'Học sinh này đã được đánh giá trong năm học này');
        }

        // Verify config exists for this age group
        const configAgeGroup = mapClassAgeGroupToConfigAgeGroup(classData.ageGroup);
        if (!configAgeGroup) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Nhóm tuổi "${classData.ageGroup}" chưa được hỗ trợ`);
        }

        const config = await ChildrenProgramCompleteConfigModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            ageGroup: configAgeGroup,
            _destroy: false,
        }).lean();

        if (!config) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `Chưa cấu hình mục tiêu cho nhóm tuổi "${configAgeGroup}". Vui lòng liên hệ Ban giám hiệu`,
            );
        }

        // Validate assessmentDetails match config
        const configSet = new Set(config.selectedTargetIds.map((id) => String(id)));
        if (assessmentDetails && assessmentDetails.length > 0) {
            assessmentDetails.forEach((detail) => {
                if (!configSet.has(String(detail.targetId))) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'Có mục tiêu không thuộc danh sách cấu hình');
                }
                // Validate score
                if (detail.score < 0 || detail.score > 10) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'Điểm số phải từ 0 đến 10');
                }
            });
        }

        // Create evaluation
        const evaluation = await ChildrenProgramCompleteModel.create({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            assessmentDetails: assessmentDetails || [],
            note,
            createdBy: user._id,
        });

        const populated = await ChildrenProgramCompleteModel.findById(evaluation._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name ageGroup')
            .populate('studentId', 'fullName studentCode status')
            .populate('createdBy', 'fullName')
            .lean();

        console.log('✅ [ProgramComplete createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [ProgramComplete createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo đánh giá: ' + error.message);
    }
};

/**
 * ✅ GET ALL: Lấy danh sách đánh giá theo lớp
 */
/**
 * ✅ GET ALL: Lấy danh sách học sinh trong lớp (có hoặc chưa có đánh giá)
 */
const getAll = async (query, userId) => {
    try {
        const user = await ensureUserSchool(userId);
        const { page = 1, limit = 10, academicYearId = '', classId = '', search = '' } = query;

        if (!academicYearId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Năm học là bắt buộc');
        }

        if (!classId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Lớp học là bắt buộc');
        }

        await getAcademicYearOrThrow(user.schoolId, academicYearId);

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, academicYearId);
        if (!accessibleClassIds.includes(classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem lớp này');
        }

        // ✅ 1. Lấy danh sách học sinh trong lớp từ ChildrenByClassModel
        let studentFilter = {
            schoolId: user.schoolId,
            academicYearId,
            classId,
            _destroy: false,
        };

        const studentsInClass = await ChildrenByClassModel.find(studentFilter)
            .populate('studentId', 'fullName studentCode status')
            .select('studentId')
            .lean();

        if (studentsInClass.length === 0) {
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

        // ✅ 2. Filter by search
        let filteredStudents = studentsInClass.filter((s) => s.studentId);

        if (search) {
            filteredStudents = filteredStudents.filter(
                (s) =>
                    s.studentId.fullName.toLowerCase().includes(search.toLowerCase()) ||
                    s.studentId.studentCode.toLowerCase().includes(search.toLowerCase()),
            );
        }

        const totalItems = filteredStudents.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedStudents = filteredStudents.slice(skip, skip + parseInt(limit));

        // ✅ 3. Lấy đánh giá cho từng học sinh (nếu có)
        const studentIds = paginatedStudents.map((s) => s.studentId._id);

        const evaluations = await ChildrenProgramCompleteModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId: { $in: studentIds },
            _destroy: false,
        })
            .populate('createdBy', 'fullName')
            .populate('lastUpdatedBy', 'fullName')
            .lean();

        // ✅ 4. Map kết quả (học sinh + đánh giá nếu có)
        const items = paginatedStudents.map((studentRecord) => {
            const student = studentRecord.studentId;
            const evaluation = evaluations.find((e) => e.studentId.toString() === student._id.toString());

            return {
                _id: evaluation?._id || null, // null nếu chưa có đánh giá
                studentId: {
                    _id: student._id,
                    fullName: student.fullName,
                    studentCode: student.studentCode,
                    status: student.status,
                },
                assessmentDetails: evaluation?.assessmentDetails || [],
                note: evaluation?.note || '',
                createdBy: evaluation?.createdBy || null,
                lastUpdatedBy: evaluation?.lastUpdatedBy || null,
                createdAt: evaluation?.createdAt || null,
                updatedAt: evaluation?.updatedAt || null,
            };
        });

        console.log('✅ [ProgramComplete getAll] Found items:', items.length);

        return {
            items,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                totalItems,
                itemsPerPage: parseInt(limit),
            },
        };
    } catch (error) {
        console.error('❌ [ProgramComplete getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách: ' + error.message);
    }
};

/**
 * ✅ GET DETAILS
 */
const getDetails = async (id, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const evaluation = await ChildrenProgramCompleteModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name ageGroup')
            .populate('studentId', 'fullName studentCode status')
            .populate('createdBy', 'fullName')
            .populate('lastUpdatedBy', 'fullName')
            .lean();

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, evaluation.academicYearId._id);
        if (!accessibleClassIds.includes(evaluation.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem đánh giá này');
        }

        return evaluation;
    } catch (error) {
        console.error('❌ [ProgramComplete getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết: ' + error.message);
    }
};

/**
 * ✅ UPDATE
 */
const update = async (id, data, userId) => {
    try {
        console.log('✏️ [ProgramComplete update] Starting:', { id, data });

        const user = await ensureUserSchool(userId);

        const evaluation = await ChildrenProgramCompleteModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status fromYear toYear');

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // Only update in active year
        if (evaluation.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật đánh giá trong năm học đang hoạt động');
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, evaluation.academicYearId._id);
        if (!accessibleClassIds.includes(evaluation.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật đánh giá này');
        }

        // Update fields
        if (data.assessmentDetails !== undefined) {
            // Validate scores
            data.assessmentDetails.forEach((detail) => {
                if (detail.score < 0 || detail.score > 10) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'Điểm số phải từ 0 đến 10');
                }
            });
            evaluation.assessmentDetails = data.assessmentDetails;
        }

        if (data.note !== undefined) {
            evaluation.note = data.note;
        }

        evaluation.lastUpdatedBy = user._id;
        await evaluation.save();

        const updated = await ChildrenProgramCompleteModel.findById(evaluation._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('classId', 'name ageGroup')
            .populate('studentId', 'fullName studentCode status')
            .populate('createdBy', 'fullName')
            .populate('lastUpdatedBy', 'fullName')
            .lean();

        console.log('✅ [ProgramComplete update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [ProgramComplete update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật đánh giá: ' + error.message);
    }
};

/**
 * ✅ DELETE
 */
const deleteEvaluation = async (id, userId) => {
    try {
        console.log('🗑️ [ProgramComplete delete] Starting:', id);

        const user = await ensureUserSchool(userId);

        const evaluation = await ChildrenProgramCompleteModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status fromYear toYear');

        if (!evaluation) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // Only delete in active year
        if (evaluation.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa đánh giá trong năm học đang hoạt động');
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, evaluation.academicYearId._id);
        if (!accessibleClassIds.includes(evaluation.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa đánh giá này');
        }

        // ✅ HARD DELETE - Xóa cứng khỏi database
        await ChildrenProgramCompleteModel.deleteOne({ _id: id });

        console.log('✅ [ProgramComplete delete] Hard deleted successfully');
        return { message: 'Xóa đánh giá thành công' };
    } catch (error) {
        console.error('❌ [ProgramComplete delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa đánh giá: ' + error.message);
    }
};

/**
 * ✅ GET ACCESSIBLE CLASSES
 */
const getAccessibleClassesList = async (academicYearId, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        await getAcademicYearOrThrow(user.schoolId, academicYearId);

        const classIds = await getAccessibleClassIds(user, academicYearId);

        const classes = await ClassModel.find({
            _id: { $in: classIds.map((id) => new mongoose.Types.ObjectId(id)) },
            _destroy: false,
        })
            .select('name grade ageGroup')
            .lean();

        return { classes };
    } catch (error) {
        console.error('❌ [ProgramComplete getAccessibleClassesList] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp: ' + error.message);
    }
};

export const childrenProgramCompleteServices = {
    // Config
    upsertConfig,
    getConfigByYear,
    deleteConfig,
    // CRUD
    createNew,
    getAll,
    getDetails,
    update,
    deleteEvaluation,
    getAccessibleClassesList,
};
