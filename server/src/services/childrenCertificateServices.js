// server/src/services/childrenCertificateServices.js

import { ChildrenCertificateModel } from '~/models/childrenCertificateModel.js';
import { ChildrenProfileModel } from '~/models/childrenProfileModel.js';
import { ClassModel } from '~/models/classModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'; // ✅ Import plugin

// ✅ Extend dayjs with plugin
dayjs.extend(isSameOrBefore);

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
 * ✅ Helper: Check if week is fully holiday (Mon-Fri all holidays)
 */
const isWeekFullyHoliday = (weekData, holidays) => {
    // ✅ Validate weekData
    if (!weekData || !weekData.startDate || !weekData.endDate) {
        console.log('⚠️  [isWeekFullyHoliday] Invalid week data');
        return true;
    }

    // ✅ Convert to dayjs objects
    const startDate = dayjs(weekData.startDate);
    const endDate = dayjs(weekData.endDate);

    // ✅ Generate Mon-Fri dates
    const weekDays = [];
    let currentDate = startDate; // ✅ Already a dayjs object

    while (currentDate.isSameOrBefore(endDate, 'day')) {
        const dayOfWeek = currentDate.day(); // 0=Sun, 1=Mon, ..., 6=Sat
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Mon-Fri
            weekDays.push(currentDate.format('YYYY-MM-DD'));
        }
        currentDate = currentDate.add(1, 'day'); // ✅ dayjs object
    }

    if (weekDays.length === 0) {
        console.log('⚠️  [isWeekFullyHoliday] No weekdays in this week');
        return true;
    }

    // ✅ Check if ALL Mon-Fri are holidays
    const allHolidays = weekDays.every((dateStr) => {
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    });

    console.log('🔍 [isWeekFullyHoliday] Week:', weekData.weekNumber, {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        weekDaysCount: weekDays.length,
        weekDays,
        holidaysInWeek: weekDays.filter((dateStr) =>
            holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr),
        ),
        allHolidays,
    });

    return allHolidays;
};

/**
 * ✅ Tạo phiếu bé ngoan mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [ChildrenCertificate createNew] Starting with data:', data);

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
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được tạo phiếu bé ngoan trong năm học đang hoạt động');
        }

        // ✅ Verify class exists
        const classData = await ClassModel.findOne({
            _id: data.classId,
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            _destroy: false,
        });

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, data.academicYearId);
        if (!accessibleClassIds.includes(data.classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền tạo phiếu bé ngoan cho lớp này');
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

        // ✅ Verify week exists in schedule
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

        // ✅ Check if week is fully holiday (Mon-Fri)
        const holidays = schedule.holidays || [];
        if (isWeekFullyHoliday(weekData, holidays)) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Không thể tạo phiếu bé ngoan cho tuần nghỉ hoàn toàn (thứ 2-6)',
            );
        }

        // ✅ Check duplicate
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

        // ✅ Create certificate
        const newCertificate = new ChildrenCertificateModel({
            schoolId: user.schoolId,
            academicYearId: data.academicYearId,
            classId: data.classId,
            studentId: data.studentId,
            weekNumber: data.weekNumber,
            isGoodChild: data.isGoodChild || false,
            comment: data.comment,
            createdBy: userId,
        });

        await newCertificate.save();

        const populated = await ChildrenCertificateModel.findById(newCertificate._id)
            .populate('studentId', 'fullName studentCode')
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
 * ✅ Lấy danh sách phiếu bé ngoan
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
        if (weekNumber) filter.weekNumber = parseInt(weekNumber);

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

        const [certificates, total] = await Promise.all([
            ChildrenCertificateModel.find(filter)
                .populate('studentId', 'fullName studentCode dateOfBirth gender')
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
 * ✅ Lấy chi tiết phiếu bé ngoan
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const certificate = await ChildrenCertificateModel.findOne({
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

        if (!certificate) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu bé ngoan');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, certificate.academicYearId._id);
        if (!accessibleClassIds.includes(certificate.classId._id.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem phiếu bé ngoan này');
        }

        return certificate;
    } catch (error) {
        console.error('❌ [ChildrenCertificate getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin phiếu bé ngoan');
    }
};

/**
 * ✅ Cập nhật phiếu bé ngoan
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [ChildrenCertificate update] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const certificate = await ChildrenCertificateModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!certificate) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu bé ngoan');
        }

        // ✅ Only update in active year
        if (certificate.academicYearId.status !== 'active') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Chỉ có thể cập nhật phiếu bé ngoan trong năm học đang hoạt động',
            );
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, certificate.academicYearId._id);
        if (!accessibleClassIds.includes(certificate.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật phiếu bé ngoan này');
        }

        // ✅ Update fields
        if (data.isGoodChild !== undefined) certificate.isGoodChild = data.isGoodChild;
        if (data.comment !== undefined) certificate.comment = data.comment;

        certificate.lastUpdatedBy = userId;
        await certificate.save();

        const updated = await ChildrenCertificateModel.findById(certificate._id)
            .populate('studentId', 'fullName studentCode')
            .populate('classId', 'name grade ageGroup')
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
 * ✅ Xóa phiếu bé ngoan
 */
const deleteCertificate = async (id, userId) => {
    try {
        console.log('🔍 [ChildrenCertificate delete] Starting with id:', id);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const certificate = await ChildrenCertificateModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!certificate) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phiếu bé ngoan');
        }

        // ✅ Only delete in active year
        if (certificate.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa phiếu bé ngoan trong năm học đang hoạt động');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, certificate.academicYearId._id);
        if (!accessibleClassIds.includes(certificate.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa phiếu bé ngoan này');
        }

        // ✅ Soft delete
        certificate._destroy = true;
        await certificate.save();

        console.log('✅ [ChildrenCertificate delete] Deleted successfully');
        return { message: 'Xóa phiếu bé ngoan thành công' };
    } catch (error) {
        console.error('❌ [ChildrenCertificate delete] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa phiếu bé ngoan');
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
        console.error('❌ [ChildrenCertificate getAccessibleClassesList] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp');
    }
};

/**
 * ✅ Lấy danh sách tuần hợp lệ (không phải nghỉ hoàn toàn Mon-Fri)
 */
const getValidWeeks = async (academicYearId, userId) => {
    try {
        console.log('📋 [ChildrenCertificate getValidWeeks] Starting with academicYearId:', academicYearId);

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule || !schedule.weeks) {
            console.log('⚠️  [ChildrenCertificate getValidWeeks] No schedule found');
            return { weeks: [] };
        }

        const holidays = schedule.holidays || [];
        console.log('📅 Total weeks:', schedule.weeks.length);
        console.log('🎉 Total holidays:', holidays.length);

        // ✅ Filter out weeks that are fully holiday (Mon-Fri)
        const validWeeks = schedule.weeks
            .filter((week) => {
                const isFullyHoliday = isWeekFullyHoliday(week, holidays);
                if (isFullyHoliday) {
                    console.log(`❌ Week ${week.weekNumber} is fully holiday - filtered out`);
                } else {
                    console.log(`✅ Week ${week.weekNumber} is valid`);
                }
                return !isFullyHoliday;
            })
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
 * ✅ Lấy preview data cho dialog phiếu bé ngoan
 */
const getPreviewData = async (query, userId) => {
    try {
        console.log('📋 [ChildrenCertificate getPreviewData] Starting with query:', query);

        const { academicYearId, classId, studentId, weekNumber } = query;

        // Validate required params
        if (!academicYearId || !classId || !studentId || !weekNumber) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Thiếu thông tin bắt buộc');
        }

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, academicYearId);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem dữ liệu lớp này');
        }

        // ✅ Get schedule to find week dates
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

        // ✅ Get all weekdays (Mon-Fri) excluding holidays
        const startDate = dayjs(weekData.startDate);
        const endDate = dayjs(weekData.endDate);
        const weekDays = [];

        // ✅ Map Vietnamese day names
        const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

        let currentDate = startDate;
        while (currentDate.isSameOrBefore(endDate)) {
            const dayOfWeek = currentDate.day();
            // Monday = 1, Friday = 5
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const dateStr = currentDate.format('YYYY-MM-DD');
                const isHoliday = holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
                if (!isHoliday) {
                    weekDays.push({
                        date: dateStr,
                        dayOfWeek: dayNames[dayOfWeek], // ✅ Use Vietnamese name
                        dayLabel: dayNames[dayOfWeek], // ✅ Use same Vietnamese name
                    });
                }
            }
            currentDate = currentDate.add(1, 'day');
        }

        console.log('📅 Week days (Mon-Fri, excluding holidays):', weekDays.length);
        console.log('📅 Week days detail:', weekDays); // ✅ Debug log

        // ✅ Import models at top if not already imported
        const { ChildrenAttendanceModel } = await import('~/models/childrenAttendanceModel.js');
        const { ChildrenDailyAssessmentModel } = await import('~/models/childrenDailyAssessmentModel.js');

        // ✅ Get attendance data for this student in this week
        const attendanceDates = weekDays.map((day) => day.date);
        const attendanceRecords = await ChildrenAttendanceModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            date: { $in: attendanceDates },
            _destroy: false,
        })
            .select('date status')
            .lean();

        // ✅ Get assessment data for this student in this week
        const assessmentRecords = await ChildrenDailyAssessmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            studentId,
            date: { $in: attendanceDates },
            _destroy: false,
        })
            .select('date healthStatus emotionalBehavior skillsKnowledge notes')
            .lean();

        // ✅ Map attendance by date
        const attendanceMap = {};
        attendanceRecords.forEach((record) => {
            attendanceMap[dayjs(record.date).format('YYYY-MM-DD')] = record.status;
        });

        // ✅ Map assessment by date
        const assessmentMap = {};
        assessmentRecords.forEach((record) => {
            assessmentMap[dayjs(record.date).format('YYYY-MM-DD')] = {
                healthStatus: record.healthStatus,
                emotionalBehavior: record.emotionalBehavior,
                skillsKnowledge: record.skillsKnowledge,
                notes: record.notes || '',
            };
        });

        // ✅ Calculate attendance summary
        const totalDays = weekDays.length;
        let presentCount = 0;
        let lateCount = 0;
        let absentWithPermissionCount = 0;
        let absentWithoutPermissionCount = 0;

        weekDays.forEach((day) => {
            const status = attendanceMap[day.date];
            if (status === 'Có mặt') presentCount++;
            else if (status === 'Đi trễ') lateCount++;
            else if (status === 'Vắng có phép') absentWithPermissionCount++;
            else if (status === 'Vắng không phép') absentWithoutPermissionCount++;
        });

        const attendanceSummary = {
            totalDays,
            present: presentCount,
            late: lateCount,
            absentWithPermission: absentWithPermissionCount,
            absentWithoutPermission: absentWithoutPermissionCount,
        };

        // ✅ Build assessment grid
        const assessmentGrid = [
            {
                criteria: 'Tình trạng sức khỏe',
                field: 'healthStatus',
                days: weekDays.map((day) => ({
                    date: day.date,
                    dayLabel: day.dayLabel,
                    content: assessmentMap[day.date]?.healthStatus || '',
                })),
            },
            {
                criteria: 'Trạng thái cảm xúc, thái độ hành vi',
                field: 'emotionalBehavior',
                days: weekDays.map((day) => ({
                    date: day.date,
                    dayLabel: day.dayLabel,
                    content: assessmentMap[day.date]?.emotionalBehavior || '',
                })),
            },
            {
                criteria: 'Kiến thức kỹ năng',
                field: 'skillsKnowledge',
                days: weekDays.map((day) => ({
                    date: day.date,
                    dayLabel: day.dayLabel,
                    content: assessmentMap[day.date]?.skillsKnowledge || '',
                })),
            },
            {
                criteria: 'Lưu ý',
                field: 'notes',
                days: weekDays.map((day) => ({
                    date: day.date,
                    dayLabel: day.dayLabel,
                    content: assessmentMap[day.date]?.notes || '',
                })),
            },
        ];

        console.log('✅ [ChildrenCertificate getPreviewData] Preview data generated');

        return {
            weekNumber: parseInt(weekNumber),
            weekDays,
            attendanceSummary,
            assessmentGrid,
        };
    } catch (error) {
        console.error('❌ [ChildrenCertificate getPreviewData] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy preview data');
    }
};

export const childrenCertificateServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteCertificate,
    getAccessibleClassesList,
    getValidWeeks,
    getPreviewData, // ✅ Add new service
};
