// server/src/services/childrenCertificateServices.js

import { ChildrenCertificateModel } from '~/models/childrenCertificateModel.js';
import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';
import { ChildrenAttendanceModel } from '~/models/childrenAttendanceModel.js';
import { ChildrenDailyAssessmentModel } from '~/models/childrenDailyAssessmentModel.js';
import { ClassModel } from '~/models/classModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';

dayjs.extend(isSameOrBefore);

// ===== HELPER FUNCTIONS =====

const ensureUserSchool = async (userId) => {
    const user = await UserModel.findById(userId).select('schoolId role _id');
    if (!user || !user.schoolId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
    }
    return user;
};

const getAcademicYearOrThrow = async (schoolId, academicYearId) => {
    const year = await AcademicYearModel.findOne({ _id: academicYearId, schoolId, _destroy: false }).select(
        'fromYear toYear status',
    );
    if (!year) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
    return year;
};

/**
 * ✅ Get accessible class IDs based on user role
 */
const getAccessibleClassIds = async (user, academicYearId) => {
    // BGH: All classes
    if (user.role === 'ban_giam_hieu') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).select('_id');
        return classes.map((c) => c._id.toString());
    }

    // Tổ trưởng: Classes in managed departments
    if (user.role === 'to_truong') {
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        }).select('name');

        const DEPT_TO_GRADE = {
            'Khối Nhà Trẻ': 'Nhà trẻ',
            'Khối Mầm': 'Mầm',
            'Khối Chồi': 'Chồi',
            'Khối Lá': 'Lá',
        };

        const grades = departments.map((d) => DEPT_TO_GRADE[d.name]).filter(Boolean);

        if (grades.length === 0) return [];

        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            grade: { $in: grades },
            _destroy: false,
        }).select('_id');

        return classes.map((c) => c._id.toString());
    }

    // Giáo viên: Assigned homeroom class only
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
 * ✅ Check if week is fully holiday (Mon-Fri)
 */
const isWeekFullyHoliday = (weekData, holidays) => {
    const startDate = dayjs(weekData.startDate);
    const endDate = dayjs(weekData.endDate);

    // Get Mon-Fri of the week
    const weekDays = [];
    let cur = startDate;
    while (cur.isSameOrBefore(endDate, 'day')) {
        const dayOfWeek = cur.day();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Mon=1 to Fri=5
            weekDays.push(cur.format('YYYY-MM-DD'));
        }
        cur = cur.add(1, 'day');
    }

    // Check if ALL Mon-Fri are holidays
    const allHolidays = weekDays.every((dateStr) => {
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    });

    return allHolidays;
};

// ===== CRUD FUNCTIONS =====

/**
 * ✅ CREATE: Tạo phiếu bé ngoan mới
 */
const createNew = async (data, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        // Validate active year
        const activeYear = await AcademicYearModel.findOne({
            _id: data.academicYearId,
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        }).select('fromYear toYear');

        if (!activeYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được tạo phiếu bé ngoan trong năm học đang hoạt động');
        }

        // Validate class
        const classData = await ClassModel.findOne({
            _id: data.classId,
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            _destroy: false,
        }).select('name grade ageGroup');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, data.academicYearId);
        if (!accessibleClassIds.includes(data.classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền tạo phiếu bé ngoan cho lớp này');
        }

        // Validate student
        const student = await ChildrenManagementModel.findOne({
            _id: data.studentId,
            schoolId: user.schoolId,
            _destroy: false,
        }).select('fullName studentCode status');

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy học sinh');
        }

        // Check if student is in class
        const inClass = await ChildrenByClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            classId: data.classId,
            studentId: data.studentId,
            _destroy: false,
        });

        if (!inClass) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Học sinh không thuộc lớp này');
        }

        // Validate week
        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu');
        }

        const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(data.weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Tuần không hợp lệ');
        }

        // Check if week is fully holiday
        const holidays = schedule.holidays || [];
        if (isWeekFullyHoliday(weekData, holidays)) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Không thể tạo phiếu bé ngoan cho tuần nghỉ hoàn toàn (thứ 2-6)',
            );
        }

        // Validate comment required
        if (!data.comment || !data.comment.trim()) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Nhận xét là bắt buộc');
        }

        // Check duplicate
        const existing = await ChildrenCertificateModel.findOne({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            studentId: data.studentId,
            weekNumber: data.weekNumber,
            _destroy: false,
        });

        if (existing) {
            throw new ApiError(StatusCodes.CONFLICT, 'Đã có phiếu bé ngoan cho học sinh này trong tuần này');
        }

        // Create certificate
        const newCertificate = new ChildrenCertificateModel({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            classId: data.classId,
            studentId: data.studentId,
            weekNumber: data.weekNumber,
            isGoodChild: data.isGoodChild || false,
            comment: data.comment.trim(),
            createdBy: userId,
        });

        await newCertificate.save();

        const populated = await ChildrenCertificateModel.findById(newCertificate._id)
            .populate('studentId', 'fullName studentCode status')
            .populate('classId', 'name grade ageGroup')
            .populate('createdBy', 'fullName username')
            .lean();

        console.log('✅ [ChildrenCertificate createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [ChildrenCertificate createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo phiếu bé ngoan: ' + error.message);
    }
};

/**
 * ✅ GET ALL: Lấy danh sách phiếu bé ngoan theo lớp
 */
const getAll = async (query, userId) => {
    try {
        const user = await ensureUserSchool(userId);
        const { page = 1, limit = 10, academicYearId = '', classId = '', weekNumber = '', search = '' } = query;

        if (!academicYearId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Năm học là bắt buộc');
        }

        if (!classId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Lớp học là bắt buộc');
        }

        // Validate year
        await getAcademicYearOrThrow(user.schoolId, academicYearId);

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, academicYearId);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem phiếu bé ngoan của lớp này');
        }

        const filter = {
            schoolId: user.schoolId,
            academicYearId,
            classId,
            _destroy: false,
        };

        if (weekNumber) filter.weekNumber = parseInt(weekNumber);

        // Search by student name/code
        if (search) {
            const students = await ChildrenManagementModel.find({
                schoolId: user.schoolId,
                $or: [
                    { fullName: { $regex: search, $options: 'i' } },
                    { studentCode: { $regex: search, $options: 'i' } },
                ],
                _destroy: false,
            }).select('_id');

            filter.studentId = { $in: students.map((s) => s._id) };
        }

        const skip = (page - 1) * limit;

        const [certificates, total] = await Promise.all([
            ChildrenCertificateModel.find(filter)
                .populate('studentId', 'fullName studentCode status')
                .populate('classId', 'name grade ageGroup')
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ weekNumber: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChildrenCertificateModel.countDocuments(filter),
        ]);

        return {
            certificates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('❌ [ChildrenCertificate getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách phiếu bé ngoan');
    }
};

/**
 * ✅ GET DETAILS: Lấy chi tiết phiếu bé ngoan
 */
const getDetails = async (id, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const certificate = await ChildrenCertificateModel.findOne({
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

        if (!certificate) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu bé ngoan');
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, certificate.academicYearId._id);
        if (!accessibleClassIds.includes(certificate.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem phiếu bé ngoan này');
        }

        return certificate;
    } catch (error) {
        console.error('❌ [ChildrenCertificate getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết phiếu bé ngoan');
    }
};

/**
 * ✅ UPDATE: Cập nhật phiếu bé ngoan
 */
const update = async (id, data, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const certificate = await ChildrenCertificateModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status fromYear toYear');

        if (!certificate) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu bé ngoan');
        }

        // Only update in active year
        if (certificate.academicYearId.status !== 'active') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Chỉ có thể cập nhật phiếu bé ngoan trong năm học đang hoạt động',
            );
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, certificate.academicYearId._id);
        if (!accessibleClassIds.includes(certificate.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật phiếu bé ngoan này');
        }

        // Validate comment required
        if (data.comment !== undefined && (!data.comment || !data.comment.trim())) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Nhận xét là bắt buộc');
        }

        // Update fields
        if (data.isGoodChild !== undefined) certificate.isGoodChild = data.isGoodChild;
        if (data.comment !== undefined) certificate.comment = data.comment.trim();
        certificate.lastUpdatedBy = userId;

        await certificate.save();

        const updated = await ChildrenCertificateModel.findById(certificate._id)
            .populate('studentId', 'fullName studentCode status')
            .populate('classId', 'name grade ageGroup')
            .populate('academicYearId', 'fromYear toYear status')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [ChildrenCertificate update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [ChildrenCertificate update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật phiếu bé ngoan');
    }
};

/**
 * ✅ DELETE: Xóa phiếu bé ngoan
 */
const deleteCertificate = async (id, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const certificate = await ChildrenCertificateModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status fromYear toYear');

        if (!certificate) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu bé ngoan');
        }

        // Only delete in active year
        if (certificate.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa phiếu bé ngoan trong năm học đang hoạt động');
        }

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, certificate.academicYearId._id);
        if (!accessibleClassIds.includes(certificate.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa phiếu bé ngoan này');
        }

        // Soft delete
        // certificate._destroy = true;
        // await certificate.save();

        await ChildrenCertificateModel.deleteOne({
            _id: certificate._id,
        });

        console.log('✅ [ChildrenCertificate delete] Deleted successfully');
        return { message: 'Xóa phiếu bé ngoan thành công' };
    } catch (error) {
        console.error('❌ [ChildrenCertificate delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa phiếu bé ngoan');
    }
};

/**
 * ✅ GET ACCESSIBLE CLASSES: Lấy danh sách lớp accessible
 */
const getAccessibleClassesList = async (academicYearId, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            return { classes: [] };
        }

        const accessibleClassIds = await getAccessibleClassIds(user, academicYearId);

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
        console.error('❌ [ChildrenCertificate getAccessibleClassesList] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp');
    }
};

/**
 * ✅ GET VALID WEEKS: Lấy danh sách tuần hợp lệ (không nghỉ hoàn toàn Mon-Fri)
 */
const getValidWeeks = async (academicYearId, userId) => {
    try {
        const user = await ensureUserSchool(userId);

        await getAcademicYearOrThrow(user.schoolId, academicYearId);

        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu');
        }

        const holidays = schedule.holidays || [];

        // Filter out fully holiday weeks
        const validWeeks = schedule.weeks
            .filter((week) => !isWeekFullyHoliday(week, holidays))
            .map((week) => ({
                weekNumber: week.weekNumber,
                startDate: week.startDate,
                endDate: week.endDate,
            }));

        console.log('✅ [ChildrenCertificate getValidWeeks] Valid weeks:', validWeeks.length);
        return { weeks: validWeeks };
    } catch (error) {
        console.error('❌ [ChildrenCertificate getValidWeeks] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách tuần');
    }
};

/**
 * ✅ GET PREVIEW DATA: Lấy preview data cho dialog
 */
const getPreviewData = async (query, userId) => {
    try {
        const { academicYearId, classId, studentId, weekNumber } = query;

        if (!academicYearId || !classId || !studentId || !weekNumber) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Thiếu thông tin bắt buộc');
        }

        const user = await ensureUserSchool(userId);

        // Check permission
        const accessibleClassIds = await getAccessibleClassIds(user, academicYearId);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem dữ liệu lớp này');
        }

        // Get schedule
        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu');
        }

        const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Tuần không hợp lệ');
        }

        const holidays = schedule.holidays || [];
        const startDate = dayjs(weekData.startDate);
        const endDate = dayjs(weekData.endDate);

        // ✅ Get Mon-Fri dates
        const weekDays = [];
        let cur = startDate;
        while (cur.isSameOrBefore(endDate, 'day')) {
            const dayOfWeek = cur.day();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const dateStr = cur.format('YYYY-MM-DD');
                const isHoliday = holidays.some((h) => dayjs(h).format('YYYY-MM-DD') === dateStr);
                weekDays.push({
                    date: dateStr,
                    dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dayOfWeek],
                    isHoliday,
                });
            }
            cur = cur.add(1, 'day');
        }

        // ✅ Get attendance dates (exclude holidays)
        const attendanceDates = weekDays.filter((d) => !d.isHoliday).map((d) => d.date);

        console.log('📅 [getPreviewData] Week days:', {
            weekNumber,
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            attendanceDates,
            holidays: holidays.map((h) => dayjs(h).format('YYYY-MM-DD')),
        });

        // ✅ FIX: Get attendance summary - Query bằng $gte/$lt để match cả ngày
        const attendances = await ChildrenAttendanceModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            date: {
                $gte: startDate.startOf('day').toDate(), // ✅ Từ 00:00:00 ngày đầu tuần
                $lt: endDate.add(1, 'day').startOf('day').toDate(), // ✅ Đến 00:00:00 ngày sau cuối tuần
            },
            _destroy: false,
        })
            .select('date status')
            .lean();

        console.log('✅ [getPreviewData] Attendances found:', attendances.length);

        const attendanceMap = {};
        attendances.forEach((att) => {
            const dateKey = dayjs(att.date).format('YYYY-MM-DD');
            attendanceMap[dateKey] = att.status;
        });

        const attendanceSummary = {
            present: attendances.filter((a) => a.status === 'Có mặt').length,
            absentWithPermission: attendances.filter((a) => a.status === 'Vắng có phép').length,
            absentWithoutPermission: attendances.filter((a) => a.status === 'Vắng không phép').length,
            totalDays: attendanceDates.length,
        };

        // ✅ FIX: Get daily assessments - Query bằng $gte/$lt để match cả ngày
        const assessments = await ChildrenDailyAssessmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            weekNumber: parseInt(weekNumber),
            date: {
                $gte: startDate.startOf('day').toDate(), // ✅ Từ 00:00:00 ngày đầu tuần
                $lt: endDate.add(1, 'day').startOf('day').toDate(), // ✅ Đến 00:00:00 ngày sau cuối tuần
            },
            _destroy: false,
        })
            .select('date healthStatus emotionalBehavior skillsKnowledge notes')
            .lean();

        console.log('✅ [getPreviewData] Assessments found:', assessments.length);
        console.log(
            '📝 [getPreviewData] Assessment dates:',
            assessments.map((a) => ({
                dbDate: a.date,
                formatted: dayjs(a.date).format('YYYY-MM-DD HH:mm:ss'),
                local: dayjs(a.date).format('YYYY-MM-DD'),
            })),
        );

        const assessmentMap = {};
        assessments.forEach((ass) => {
            const dateKey = dayjs(ass.date).format('YYYY-MM-DD');
            assessmentMap[dateKey] = ass;
            console.log(`📌 Mapped assessment for ${dateKey}:`, {
                healthStatus: ass.healthStatus?.substring(0, 30) + '...',
                emotionalBehavior: ass.emotionalBehavior?.substring(0, 30) + '...',
            });
        });

        // ✅ Map data to weekDays
        const weekDaysWithData = weekDays.map((day) => {
            const attendance = day.isHoliday ? 'Ngày nghỉ' : attendanceMap[day.date] || 'Chưa điểm danh';
            const assessment = day.isHoliday ? null : assessmentMap[day.date] || null;

            return {
                ...day,
                attendance,
                assessment,
            };
        });

        console.log('✅ [getPreviewData] Final data:', {
            weekDaysCount: weekDaysWithData.length,
            daysWithAssessment: weekDaysWithData.filter((d) => d.assessment !== null).length,
            attendanceSummary,
        });

        return {
            weekDays: weekDaysWithData,
            attendanceSummary,
        };
    } catch (error) {
        console.error('❌ [ChildrenCertificate getPreviewData] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy preview data');
    }
};

// ===== EXPORTS =====

export const childrenCertificateServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteCertificate,
    getAccessibleClassesList,
    getValidWeeks,
    getPreviewData,
};
