// server/src/services/childrenDailyAssessmentServices.js

import { ChildrenDailyAssessmentModel } from '~/models/childrenDailyAssessmentModel.js';
import { ChildrenProfileModel } from '~/models/childrenProfileModel.js';
import { ChildrenAttendanceModel } from '~/models/childrenAttendanceModel.js';
import { ClassModel } from '~/models/classModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { UserModel } from '~/models/userModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';
import { logAction } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

/**
 * ✅ Helper: Normalize department name to grade
 */
const normalizeDepartmentToGrade = (deptName) => {
    const mapping = {
        'Khối Nhà Trẻ': 'Nhà Trẻ',
        'Khối Mầm': 'Mầm',
        'Khối Chồi': 'Chồi',
        'Khối Lá': 'Lá',
    };
    return mapping[deptName] || deptName;
};

/**
 * ✅ Helper: Get accessible classes for user
 */
const getAccessibleClasses = async (user, academicYearId) => {
    if (user.role === 'ban_giam_hieu') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        }).select('name');

        const grades = departments.map((dept) => normalizeDepartmentToGrade(dept.name));
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            grade: { $in: grades.map((g) => new RegExp(`^${g}$`, 'i')) },
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    if (user.role === 'giao_vien') {
        const assignedClass = await ClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id,
            _destroy: false,
        }).select('_id');
        return assignedClass ? [assignedClass._id.toString()] : [];
    }

    return [];
};

/**
 * ✅ Tạo đánh giá mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [DailyAssessment createNew] Starting with data:', data);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Verify active year
        const activeYear = await AcademicYearModel.findOne({
            _id: data.academicYearId,
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được đánh giá trong năm học đang hoạt động');
        }

        // ✅ Verify class exists
        const classData = await ClassModel.findOne({
            _id: data.classId,
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            _destroy: false,
        }).populate('academicYearId', 'fromYear toYear');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, data.academicYearId);
        if (!accessibleClassIds.includes(data.classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền đánh giá lớp này');
        }

        // ✅ Verify student exists
        const student = await ChildrenProfileModel.findOne({
            _id: data.studentId,
            schoolId: user.schoolId,
            classId: data.classId,
            academicYearId: data.academicYearId,
            status: 'Đang học',
            _destroy: false,
        });

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy học sinh hoặc học sinh không còn đang học');
        }

        // ✅ Validate date (must be Monday-Friday)
        const targetDate = dayjs(data.date);
        const dayOfWeek = targetDate.day();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được đánh giá từ thứ 2 đến thứ 6');
        }

        // ✅ Check if student attended (Có mặt or Đi trễ)
        const attendance = await ChildrenAttendanceModel.findOne({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            classId: data.classId,
            studentId: data.studentId,
            date: targetDate.toDate(),
            status: { $in: ['Có mặt', 'Đi trễ'] },
            _destroy: false,
        });

        if (!attendance) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Chỉ được đánh giá học sinh đã điểm danh [Có mặt] hoặc [Đi trễ] trong ngày này',
            );
        }

        // ✅ Check duplicate
        const existing = await ChildrenDailyAssessmentModel.findOne({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            studentId: data.studentId,
            date: targetDate.toDate(),
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, 'Đã có đánh giá cho học sinh này trong ngày hôm nay');
        }

        // ✅ Get week number từ Schedule (KHÔNG dùng isoWeek)
        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            _destroy: false,
        }).lean();

        let weekNumber = null;
        if (schedule && schedule.weeks) {
            const targetDateObj = targetDate.toDate();
            const week = schedule.weeks.find((w) => {
                return targetDateObj >= w.startDate && targetDateObj <= w.endDate;
            });
            weekNumber = week ? week.weekNumber : null;
        }

        if (!weekNumber) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Không tìm thấy tuần học phù hợp với ngày đánh giá');
        }

        // ✅ Create assessment
        const newAssessment = new ChildrenDailyAssessmentModel({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            classId: data.classId,
            studentId: data.studentId,
            date: targetDate.toDate(),
            healthStatus: data.healthStatus,
            emotionalBehavior: data.emotionalBehavior,
            skillsKnowledge: data.skillsKnowledge,
            notes: data.notes || '',
            createdBy: userId,
        });

        await newAssessment.save();

        const populated = await ChildrenDailyAssessmentModel.findById(newAssessment._id)
            .populate('studentId', 'fullName studentCode')
            .populate('classId', 'name grade ageGroup')
            .populate('academicYearId', 'fromYear toYear')
            .populate('createdBy', 'fullName username')
            .lean();

        console.log('✅ [DailyAssessment createNew] Created successfully');

        const dayNames = {
            1: 'Thứ 2',
            2: 'Thứ 3',
            3: 'Thứ 4',
            4: 'Thứ 5',
            5: 'Thứ 6',
        };

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.CREATE,
            AUDIT_LOG_RESOURCES.CHILDREN_ASSESSMENT,
            `Thêm đánh giá học sinh "${student.fullName}" - ${dayNames[dayOfWeek]} - Tuần ${weekNumber} - Lớp "${classData.name}" - Năm học ${classData.academicYearId.fromYear}-${classData.academicYearId.toYear}`,
            {
                classId: data.classId,
                className: classData.name,
                studentId: data.studentId,
                studentName: student.fullName,
                studentCode: student.studentCode,
                date: targetDate.format('DD/MM/YYYY'),
                dayName: dayNames[dayOfWeek],
                weekNumber,
                academicYearId: data.academicYearId,
                academicYear: `${classData.academicYearId.fromYear}-${classData.academicYearId.toYear}`,
            },
        );

        return populated;
    } catch (error) {
        console.error('❌ [DailyAssessment createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo đánh giá: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách đánh giá
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 10, academicYearId = '', classId = '', weekNumber = '', search = '' } = query;

        let filter = {
            schoolId: user.schoolId,
            _destroy: false,
        };

        if (academicYearId) filter.academicYearId = academicYearId;

        // ✅ Filter by week date range
        if (weekNumber && academicYearId) {
            const schedule = await ScheduleModel.findOne({
                schoolId: user.schoolId,
                academicYearId,
                _destroy: false,
            }).lean();

            if (schedule) {
                const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
                if (weekData) {
                    filter.date = {
                        $gte: new Date(weekData.startDate),
                        $lte: new Date(weekData.endDate),
                    };
                }
            }
        }

        // ✅ Permission filter
        if (classId) {
            filter.classId = classId;
        } else {
            const accessibleClassIds = await getAccessibleClasses(user, academicYearId || undefined);
            filter.classId = { $in: accessibleClassIds };
        }

        const skip = (page - 1) * limit;

        // ✅ Get student IDs if search
        let studentIds = null;
        if (search) {
            const students = await ChildrenProfileModel.find({
                schoolId: user.schoolId,
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { studentCode: { $regex: search, $options: 'i' } },
                ],
                _destroy: false,
            }).select('_id');
            studentIds = students.map((s) => s._id);
            filter.studentId = { $in: studentIds };
        }

        const [assessments, total] = await Promise.all([
            ChildrenDailyAssessmentModel.find(filter)
                .populate('studentId', 'fullName studentCode dateOfBirth gender')
                .populate('classId', 'name grade ageGroup')
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChildrenDailyAssessmentModel.countDocuments(filter),
        ]);

        return {
            assessments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [DailyAssessment getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách đánh giá');
    }
};

/**
 * ✅ Lấy chi tiết đánh giá
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const assessment = await ChildrenDailyAssessmentModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('studentId', 'fullName studentCode dateOfBirth gender')
            .populate('classId', 'name grade ageGroup')
            .populate('academicYearId', 'fromYear toYear status')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!assessment) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, assessment.academicYearId._id);
        if (!accessibleClassIds.includes(assessment.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem đánh giá này');
        }

        return assessment;
    } catch (error) {
        console.error('❌ [DailyAssessment getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin đánh giá');
    }
};

/**
 * ✅ Cập nhật đánh giá
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [DailyAssessment update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const assessment = await ChildrenDailyAssessmentModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'status fromYear toYear')
            .populate('classId', 'name')
            .populate('studentId', 'fullName studentCode');

        if (!assessment) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Only update in active year
        if (assessment.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật đánh giá trong năm học đang hoạt động');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, assessment.academicYearId._id);
        if (!accessibleClassIds.includes(assessment.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật đánh giá này');
        }

        // ✅ Get week number từ Schedule (KHÔNG dùng isoWeek)
        const targetDate = dayjs(assessment.date);
        const dayOfWeek = targetDate.day();

        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId: assessment.academicYearId._id,
            _destroy: false,
        }).lean();

        let weekNumber = null;
        if (schedule && schedule.weeks) {
            const targetDateObj = targetDate.toDate();
            const week = schedule.weeks.find((w) => {
                return targetDateObj >= w.startDate && targetDateObj <= w.endDate;
            });
            weekNumber = week ? week.weekNumber : null;
        }

        // ✅ Update fields
        if (data.healthStatus !== undefined) assessment.healthStatus = data.healthStatus;
        if (data.emotionalBehavior !== undefined) assessment.emotionalBehavior = data.emotionalBehavior;
        if (data.skillsKnowledge !== undefined) assessment.skillsKnowledge = data.skillsKnowledge;
        if (data.notes !== undefined) assessment.notes = data.notes;

        assessment.lastUpdatedBy = userId;
        await assessment.save();

        const updated = await ChildrenDailyAssessmentModel.findById(assessment._id)
            .populate('studentId', 'fullName studentCode')
            .populate('classId', 'name grade ageGroup')
            .populate('academicYearId', 'fromYear toYear')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [DailyAssessment update] Updated successfully');

        const dayNames = {
            1: 'Thứ 2',
            2: 'Thứ 3',
            3: 'Thứ 4',
            4: 'Thứ 5',
            5: 'Thứ 6',
        };

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.UPDATE,
            AUDIT_LOG_RESOURCES.CHILDREN_ASSESSMENT,
            `Cập nhật đánh giá học sinh "${assessment.studentId.fullName}" - ${dayNames[dayOfWeek]} - Tuần ${weekNumber || 'N/A'} - Lớp "${assessment.classId.name}" - Năm học ${assessment.academicYearId.fromYear}-${assessment.academicYearId.toYear}`,
            {
                classId: assessment.classId._id,
                className: assessment.classId.name,
                studentId: assessment.studentId._id,
                studentName: assessment.studentId.fullName,
                studentCode: assessment.studentId.studentCode,
                date: targetDate.format('DD/MM/YYYY'),
                dayName: dayNames[dayOfWeek],
                weekNumber: weekNumber || null,
                academicYearId: assessment.academicYearId._id,
                academicYear: `${assessment.academicYearId.fromYear}-${assessment.academicYearId.toYear}`,
            },
        );

        return updated;
    } catch (error) {
        console.error('❌ [DailyAssessment update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật đánh giá');
    }
};

/**
 * ✅ Xóa đánh giá
 */
const deleteAssessment = async (id, userId) => {
    try {
        console.log('🔍 [DailyAssessment delete] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const assessment = await ChildrenDailyAssessmentModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'status fromYear toYear')
            .populate('classId', 'name')
            .populate('studentId', 'fullName studentCode');

        if (!assessment) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Only delete in active year
        if (assessment.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa đánh giá trong năm học đang hoạt động');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, assessment.academicYearId._id);
        if (!accessibleClassIds.includes(assessment.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa đánh giá này');
        }

        // ✅ Get week number từ Schedule (KHÔNG dùng isoWeek)
        const targetDate = dayjs(assessment.date);
        const dayOfWeek = targetDate.day();

        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId: assessment.academicYearId._id,
            _destroy: false,
        }).lean();

        let weekNumber = null;
        if (schedule && schedule.weeks) {
            const targetDateObj = targetDate.toDate();
            const week = schedule.weeks.find((w) => {
                return targetDateObj >= w.startDate && targetDateObj <= w.endDate;
            });
            weekNumber = week ? week.weekNumber : null;
        }

        // ✅ Lưa thông tin trước khi xóa
        const assessmentInfo = {
            studentName: assessment.studentId.fullName,
            studentCode: assessment.studentId.studentCode,
            className: assessment.classId.name,
            academicYear: `${assessment.academicYearId.fromYear}-${assessment.academicYearId.toYear}`,
            date: targetDate.format('DD/MM/YYYY'),
            weekNumber: weekNumber || null,
            dayOfWeek,
        };

        // ✅ Soft delete
        assessment._destroy = true;
        await assessment.save();

        console.log('✅ [DailyAssessment delete] Deleted successfully');

        const dayNames = {
            1: 'Thứ 2',
            2: 'Thứ 3',
            3: 'Thứ 4',
            4: 'Thứ 5',
            5: 'Thứ 6',
        };

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.DELETE,
            AUDIT_LOG_RESOURCES.CHILDREN_ASSESSMENT,
            `Xóa đánh giá học sinh "${assessmentInfo.studentName}" - ${dayNames[dayOfWeek]} - Tuần ${weekNumber || 'N/A'} - Lớp "${assessmentInfo.className}" - Năm học ${assessmentInfo.academicYear}`,
            {
                studentName: assessmentInfo.studentName,
                studentCode: assessmentInfo.studentCode,
                className: assessmentInfo.className,
                academicYear: assessmentInfo.academicYear,
                date: assessmentInfo.date,
                dayName: dayNames[dayOfWeek],
                weekNumber: assessmentInfo.weekNumber,
            },
        );

        return { message: 'Xóa đánh giá thành công' };
    } catch (error) {
        console.error('❌ [DailyAssessment delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa đánh giá');
    }
};

/**
 * ✅ Lấy danh sách lớp accessible
 */
const getAccessibleClassesList = async (academicYearId, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            return { classes: [] };
        }

        const accessibleClassIds = await getAccessibleClasses(user, academicYearId);

        const classes = await ClassModel.find({
            _id: { $in: accessibleClassIds },
            academicYearId: academicYearId,
            _destroy: false,
        })
            .select('name grade ageGroup')
            .sort({ grade: 1, name: 1 })
            .lean();

        return { classes };
    } catch (error) {
        console.error('❌ [DailyAssessment getAccessibleClassesList] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp');
    }
};

export const childrenDailyAssessmentServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteAssessment,
    getAccessibleClassesList,
};
