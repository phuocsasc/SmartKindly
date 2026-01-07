// server/src/services/childrenDailyAssessmentServices.js

import { ChildrenDailyAssessmentModel } from '~/models/childrenDailyAssessmentModel.js';
import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';
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

// ===== HELPER FUNCTIONS =====
// Map tên tổ -> tên khối (Class.grade)
const DEPT_TO_GRADE = {
    'Khối Nhà Trẻ': 'Nhà trẻ',
    'Khối Mầm': 'Mầm',
    'Khối Chồi': 'Chồi',
    'Khối Lá': 'Lá',
};

const ensureUserSchool = async (userId) => {
    const user = await UserModel.findById(userId).select('schoolId role _id');
    if (!user || !user.schoolId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
    }
    return user;
};

const getAcademicYearOrThrow = async (schoolId, academicYearId) => {
    const year = await AcademicYearModel.findOne({ _id: academicYearId, schoolId, _destroy: false });
    if (!year) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
    return year;
};

// ✅ Lấy accessible classes theo role (giống childrenAttendanceServices)
const getAccessibleClassIds = async (user, academicYearId) => {
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
        const managedGrades = departments.map((d) => DEPT_TO_GRADE[d.name] || d.name);
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            grade: { $in: managedGrades },
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    if (user.role === 'giao_vien') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id,
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    // Vai trò khác: không có quyền
    return [];
};
const getScheduleOrThrow = async (schoolId, academicYearId) => {
    const schedule = await ScheduleModel.findOne({
        schoolId,
        academicYearId,
        _destroy: false,
    }).lean();

    if (!schedule) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Chưa có lịch học cho năm học này');
    }
    return schedule;
};

// ✅ FIX: Lấy danh sách tuần (thứ 2 - thứ 6), holidays (mảng date ISO) từ schedule - normalize đúng timezone
const getWeeksFromSchedule = (schedule) => {
    const weeks = (schedule.weeks || []).map((w) => ({
        weekNumber: w.weekNumber,
        startDate: new Date(w.startDate),
        endDate: new Date(w.endDate),
    }));

    // ✅ FIX: Normalize holidays về yyyy-MM-dd theo LOCAL DATE (không dùng UTC)
    const holidays = (schedule.holidays || []).map((h) => {
        const d = h.date ? new Date(h.date) : new Date(h);
        // Dùng dayjs để format theo timezone local thay vì UTC
        return dayjs(d).format('YYYY-MM-DD');
    });

    return { weeks, holidays };
};

// ✅ Check ngày có phải Mon-Fri không
const isMondayToFriday = (date) => {
    const day = dayjs(date).day();
    return day >= 1 && day <= 5;
};

// Lấy danh sách trẻ theo lớp từ ChildrenByClassModel (bao gồm "Đang học" và "Nghỉ học")
const getChildrenByClass = async (schoolId, academicYearId, classId) => {
    const list = await ChildrenByClassModel.find({
        schoolId,
        academicYearId,
        classId,
        _destroy: false,
    })
        .populate('studentId', 'fullName studentCode status')
        .select('studentId')
        .lean();

    return list
        .filter((r) => r.studentId)
        .map((r) => ({
            studentId: r.studentId._id.toString(),
            fullName: r.studentId.fullName,
            studentCode: r.studentId.studentCode,
            managementStatus: r.studentId.status, // "Đang học" / "Nghỉ học"
        }));
};

// ===== CRUD FUNCTIONS =====

/**
 * ✅ Tạo đánh giá mới (chỉ cho trẻ đã điểm danh "Có mặt")
 */
const createNew = async (data, userId) => {
    try {
        const user = await ensureUserSchool(userId);
        const { academicYearId, classId, studentId, date, healthStatus, emotionalBehavior, skillsKnowledge, notes } =
            data;

        // ✅ Validate năm học active
        const year = await getAcademicYearOrThrow(user.schoolId, academicYearId);
        if (year.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được đánh giá trong năm học đang hoạt động');
        }

        // ✅ Validate lớp
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('_id name');
        if (!classData) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');

        // ✅ Check quyền
        const accessible = await getAccessibleClassIds(user, academicYearId);
        if (!accessible.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền đánh giá lớp này');
        }

        // ✅ Validate học sinh
        const student = await ChildrenManagementModel.findOne({
            _id: studentId,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .select('fullName studentCode status')
            .lean();

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy học sinh');
        }

        // ✅ Check học sinh đã có trong lớp chưa
        const inClass = await ChildrenByClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            _destroy: false,
        });

        if (!inClass) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Học sinh không thuộc lớp này');
        }

        // ✅ FIX: Parse date và validate Mon-Fri
        const targetDate = dayjs(date);
        const dayOfWeek = targetDate.day();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được đánh giá từ thứ 2 đến thứ 6');
        }

        // ✅ So sánh ngày theo format YYYY-MM-DD (không có timezone)
        const targetDateStr = targetDate.format('YYYY-MM-DD');

        // ✅ Find attendance - lấy tất cả attendance của học sinh
        const attendanceList = await ChildrenAttendanceModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            status: 'Có mặt',
            _destroy: false,
        }).lean();

        console.log('📋 [Attendance list found]:', attendanceList.length);

        // ✅ Filter theo ngày (so sánh string)
        const attendance = attendanceList.find((att) => {
            const attDateStr = dayjs(att.date).format('YYYY-MM-DD');
            console.log('  - Compare:', attDateStr, '===', targetDateStr, '?', attDateStr === targetDateStr);
            return attDateStr === targetDateStr;
        });

        console.log('✅ [Attendance matched]:', attendance ? 'Found' : 'Not found');

        if (!attendance) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Chỉ được đánh giá học sinh đã điểm danh [Có mặt] trong ngày này',
            );
        }

        // ✅ Check duplicate
        const existing = await ChildrenDailyAssessmentModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            studentId,
            date: targetDate.toDate(),
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, 'Đã có đánh giá cho học sinh này trong ngày hôm nay');
        }

        // ✅ FIX: Lấy weekNumber từ Schedule - SO SÁNH THEO STRING
        const schedule = await getScheduleOrThrow(user.schoolId, academicYearId);
        const { weeks } = getWeeksFromSchedule(schedule);

        console.log('📅 [Find week] Target date:', targetDateStr);
        console.log('📅 [Find week] Total weeks:', weeks.length);

        // ✅ FIX: So sánh theo string thay vì Date object
        const week = weeks.find((w) => {
            const startStr = dayjs(w.startDate).format('YYYY-MM-DD');
            const endStr = dayjs(w.endDate).format('YYYY-MM-DD');
            const inRange = targetDateStr >= startStr && targetDateStr <= endStr;

            console.log(`  Week ${w.weekNumber}:`, {
                start: startStr,
                end: endStr,
                target: targetDateStr,
                inRange,
            });

            return inRange;
        });

        if (!week) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Ngày đánh giá không thuộc tuần nào đã khai báo');
        }

        console.log('✅ [Week found]:', week.weekNumber);

        // ✅ Create assessment - Dùng startOf('day') để tránh timezone issue
        const newAssessment = new ChildrenDailyAssessmentModel({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            date: targetDate.startOf('day').toDate(), // ✅ Set về 00:00:00 local time
            weekNumber: week.weekNumber,
            healthStatus,
            emotionalBehavior,
            skillsKnowledge,
            notes: notes || '',
            createdBy: userId,
        });

        await newAssessment.save();

        const populated = await ChildrenDailyAssessmentModel.findById(newAssessment._id)
            .populate('studentId', 'fullName studentCode')
            .populate('classId', 'name ageGroup')
            .populate('academicYearId', 'fromYear toYear')
            .populate('createdBy', 'fullName username')
            .lean();

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
            `Thêm đánh giá học sinh "${student.fullName}" - ${dayNames[dayOfWeek]} - Tuần ${week.weekNumber} - Lớp "${classData.name}" - Năm học ${year.fromYear}-${year.toYear}`,
            {
                classId,
                className: classData.name,
                studentId,
                studentName: student.fullName,
                studentCode: student.studentCode,
                date: targetDate.format('DD/MM/YYYY'),
                dayName: dayNames[dayOfWeek],
                weekNumber: week.weekNumber,
                academicYearId,
                academicYear: `${year.fromYear}-${year.toYear}`,
            },
        );

        console.log('✅ [DailyAssessment createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [DailyAssessment createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo đánh giá: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách đánh giá theo lớp và tuần (CÓ PHÂN TRANG)
 */
const getAssessmentsByClass = async (query, userId) => {
    try {
        const user = await ensureUserSchool(userId);
        const { academicYearId, classId, weekNumber, page = 1, limit = 10, search = '' } = query;

        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('_id name grade ageGroup academicYearId')
            .populate('academicYearId', 'fromYear toYear status')
            .lean();

        if (!classData) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');

        const accessible = await getAccessibleClassIds(user, academicYearId);
        if (!accessible.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem lớp này');
        }

        const schedule = await getScheduleOrThrow(user.schoolId, academicYearId);
        const { weeks, holidays } = getWeeksFromSchedule(schedule);

        const targetWeekNumber = weekNumber ? Number(weekNumber) : null;
        if (targetWeekNumber == null) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Cần truyền weekNumber');
        }

        // Tạo danh sách ngày trong tuần (Thứ 2 -> Thứ 6)
        const week = weeks.find((w) => w.weekNumber === targetWeekNumber);
        if (!week) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tuần đã khai báo');

        const cur = new Date(week.startDate);
        const daysInWeek = [];
        while (cur <= week.endDate) {
            if (isMondayToFriday(cur)) {
                const key = dayjs(cur).format('YYYY-MM-DD');
                daysInWeek.push(key);
            }
            cur.setDate(cur.getDate() + 1);
        }

        // ✅ Lấy danh sách học sinh trong lớp
        let children = await getChildrenByClass(user.schoolId, academicYearId, classId);

        // ✅ Filter theo search
        if (search && search.trim()) {
            const searchLower = search.toLowerCase();
            children = children.filter(
                (c) =>
                    c.fullName.toLowerCase().includes(searchLower) || c.studentCode.toLowerCase().includes(searchLower),
            );
        }

        const total = children.length;

        // ✅ Phân trang
        const skip = (Number(page) - 1) * Number(limit);
        const paginatedChildren = children.slice(skip, skip + Number(limit));

        // ✅ Lấy assessment data cho học sinh trong trang hiện tại
        const studentIds = paginatedChildren.map((c) => c.studentId);
        const assessmentDocs = await ChildrenDailyAssessmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            weekNumber: targetWeekNumber,
            studentId: { $in: studentIds },
            _destroy: false,
        })
            .select('_id studentId date healthStatus emotionalBehavior skillsKnowledge notes')
            .lean();

        const assessmentMap = {};
        for (const stu of paginatedChildren) {
            assessmentMap[stu.studentId] = {};
        }

        for (const doc of assessmentDocs) {
            const sId = doc.studentId.toString();
            const dayKey = dayjs(doc.date).format('YYYY-MM-DD');
            if (!assessmentMap[sId]) assessmentMap[sId] = {};
            assessmentMap[sId][dayKey] = {
                _id: doc._id.toString(),
                healthStatus: doc.healthStatus,
                emotionalBehavior: doc.emotionalBehavior,
                skillsKnowledge: doc.skillsKnowledge,
                notes: doc.notes || '',
            };
        }

        return {
            classInfo: {
                _id: classData._id.toString(),
                name: classData.name,
                grade: classData.grade,
                ageGroup: classData.ageGroup,
                academicYear: `${classData.academicYearId.fromYear}-${classData.academicYearId.toYear}`,
                yearStatus: classData.academicYearId.status,
            },
            weekNumber: targetWeekNumber,
            days: daysInWeek, // ✅ Array of "YYYY-MM-DD" strings
            holidays,
            students: paginatedChildren,
            assessmentMap,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalItems: total,
                itemsPerPage: Number(limit),
            },
        };
    } catch (error) {
        console.error('❌ [DailyAssessment getAssessmentsByClass] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách đánh giá');
    }
};

/**
 * ✅ Cập nhật đánh giá (chỉ năm active)
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [DailyAssessment update] Starting');

        const user = await ensureUserSchool(userId);

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

        if (assessment.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật đánh giá trong năm học đang hoạt động');
        }

        const accessible = await getAccessibleClassIds(user, assessment.academicYearId._id);
        if (!accessible.includes(assessment.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật đánh giá này');
        }

        if (data.healthStatus) assessment.healthStatus = data.healthStatus;
        if (data.emotionalBehavior) assessment.emotionalBehavior = data.emotionalBehavior;
        if (data.skillsKnowledge) assessment.skillsKnowledge = data.skillsKnowledge;
        if (data.notes !== undefined) assessment.notes = data.notes;

        assessment.lastUpdatedBy = userId;
        await assessment.save();

        const targetDate = dayjs(assessment.date);
        const dayOfWeek = targetDate.day();
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
            `Cập nhật đánh giá học sinh "${assessment.studentId.fullName}" - ${dayNames[dayOfWeek]} - Tuần ${assessment.weekNumber} - Lớp "${assessment.classId.name}" - Năm học ${assessment.academicYearId.fromYear}-${assessment.academicYearId.toYear}`,
            {
                assessmentId: id,
                classId: assessment.classId._id,
                className: assessment.classId.name,
                studentId: assessment.studentId._id,
                studentName: assessment.studentId.fullName,
                studentCode: assessment.studentId.studentCode,
                date: targetDate.format('DD/MM/YYYY'),
                dayName: dayNames[dayOfWeek],
                weekNumber: assessment.weekNumber,
                academicYearId: assessment.academicYearId._id,
                academicYear: `${assessment.academicYearId.fromYear}-${assessment.academicYearId.toYear}`,
            },
        );

        console.log('✅ [DailyAssessment update] Updated successfully');

        const updated = await ChildrenDailyAssessmentModel.findById(id)
            .populate('studentId', 'fullName studentCode')
            .populate('classId', 'name ageGroup')
            .populate('academicYearId', 'fromYear toYear')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        return updated;
    } catch (error) {
        console.error('❌ [DailyAssessment update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật đánh giá');
    }
};

/**
 * ✅ Xóa đánh giá (chỉ năm active)
 */
const deleteAssessment = async (id, userId) => {
    try {
        console.log('🗑️ [DailyAssessment delete] Starting');

        const user = await ensureUserSchool(userId);

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

        if (assessment.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa đánh giá trong năm học đang hoạt động');
        }

        const accessible = await getAccessibleClassIds(user, assessment.academicYearId._id);
        if (!accessible.includes(assessment.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa đánh giá này');
        }

        // assessment._destroy = true;
        // await assessment.save();

        const targetDate = dayjs(assessment.date);
        const dayOfWeek = targetDate.day();
        const dayNames = {
            1: 'Thứ 2',
            2: 'Thứ 3',
            3: 'Thứ 4',
            4: 'Thứ 5',
            5: 'Thứ 6',
        };

        const messageAudit = `Xóa đánh giá học sinh "${assessment.studentId.fullName}" - ${dayNames[dayOfWeek]} - Tuần ${assessment.weekNumber} - Lớp "${assessment.classId.name}" - Năm học ${assessment.academicYearId.fromYear}-${assessment.academicYearId.toYear}`;

        // 2. Xóa cứng khỏi DB
        await ChildrenDailyAssessmentModel.deleteOne({
            _id: id,
            schoolId: user.schoolId,
        });

        await logAction(
            userId,
            user.schoolId,
            AUDIT_LOG_ACTIONS.DELETE,
            AUDIT_LOG_RESOURCES.CHILDREN_ASSESSMENT,
            messageAudit,
            {
                assessmentId: id,
                classId: assessment.classId._id,
                className: assessment.classId.name,
                studentId: assessment.studentId._id,
                studentName: assessment.studentId.fullName,
                studentCode: assessment.studentId.studentCode,
                date: targetDate.format('DD/MM/YYYY'),
                dayName: dayNames[dayOfWeek],
                weekNumber: assessment.weekNumber,
                academicYearId: assessment.academicYearId._id,
                academicYear: `${assessment.academicYearId.fromYear}-${assessment.academicYearId.toYear}`,
            },
        );

        console.log('✅ [DailyAssessment delete] Deleted successfully');
        return { message: 'Xóa đánh giá thành công' };
    } catch (error) {
        console.error('❌ [DailyAssessment delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa đánh giá');
    }
};

/**
 * Danh sách lớp accessible theo quyền (BGH/Tổ trưởng/Giáo viên chủ nhiệm)
 */
const getAccessibleClassesList = async (academicYearId, userId) => {
    const user = await ensureUserSchool(userId);
    const year = await getAcademicYearOrThrow(user.schoolId, academicYearId);
    const accessibleClassIds = await getAccessibleClassIds(user, academicYearId);

    const classes = await ClassModel.find({
        _id: { $in: accessibleClassIds },
        schoolId: user.schoolId,
        academicYearId,
        _destroy: false,
    })
        .select('name grade ageGroup')
        .sort({ grade: 1, name: 1 })
        .lean();

    return {
        yearStatus: year.status,
        classes,
    };
};

/**
 * ✅ Lấy chi tiết đánh giá
 */
const getDetails = async (id, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const assessment = await ChildrenDailyAssessmentModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('studentId', 'fullName studentCode status')
            .populate('classId', 'name grade ageGroup')
            .populate('academicYearId', 'fromYear toYear status')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!assessment) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy đánh giá');
        }

        // ✅ Check permission
        const accessible = await getAccessibleClassIds(user, assessment.academicYearId._id);
        if (!accessible.includes(assessment.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem đánh giá này');
        }

        return assessment;
    } catch (error) {
        console.error('❌ [DailyAssessment getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết đánh giá');
    }
};

export const childrenDailyAssessmentServices = {
    createNew,
    getAssessmentsByClass,
    update,
    deleteAssessment,
    getAccessibleClassesList,
    getDetails,
};
