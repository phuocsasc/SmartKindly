// server/src/services/dashboardServices.js

import { UserModel } from '~/models/userModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { ClassModel } from '~/models/classModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';
import { ChildrenAttendanceModel } from '~/models/childrenAttendanceModel.js';
import { ChildrenDailyAssessmentModel } from '~/models/childrenDailyAssessmentModel.js';
import { ChildrenCertificateModel } from '~/models/childrenCertificateModel.js';
import { SchoolMealModel } from '~/models/schoolMealModel.js';
import { SchoolMenuModel } from '~/models/schoolMenuModel.js';
import { SchoolYearTargetModel } from '~/models/schoolYearTargetModel.js';
import { SchoolEducationalActivityModel } from '~/models/schoolEducationalActivityModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';

// ✅ Map Department name → Class grade
const DEPT_TO_GRADE = {
    'Khối Nhà Trẻ': 'Nhà trẻ',
    'Khối Mầm': 'Mầm',
    'Khối Chồi': 'Chồi',
    'Khối Lá': 'Lá',
};

/**
 * ✅ Helper: Ensure user belongs to a school
 */
const ensureUserSchool = async (userId) => {
    const user = await UserModel.findById(userId).select('schoolId role _id');
    if (!user || !user.schoolId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
    }
    return user;
};

/**
 * ✅ Helper: Get accessible class IDs based on role
 */
const getAccessibleClassIds = async (user, academicYearId) => {
    // Ban giám hiệu: All classes
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

    // Giáo viên: Only homeroom class
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
 * ✅ Helper: Get week days (Mon-Fri) excluding holidays
 */
const getWeekDays = (schedule, weekNumber) => {
    const week = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
    if (!week) return [];

    const holidays = schedule.holidays || [];
    const startDate = dayjs(week.startDate);
    const endDate = dayjs(week.endDate);

    const weekDays = [];
    let current = startDate;

    while (current.isSameOrBefore(endDate, 'day')) {
        const dayOfWeek = current.day();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Mon-Fri
            const dateStr = current.format('YYYY-MM-DD');
            const isHoliday = holidays.some((h) => dayjs(h).format('YYYY-MM-DD') === dateStr);
            if (!isHoliday) {
                weekDays.push(dateStr);
            }
        }
        current = current.add(1, 'day');
    }

    return weekDays;
};

/**
 * ✅ Helper: Check if week is fully holiday (Mon-Fri all holidays)
 */
const isWeekFullyHoliday = (week, holidays) => {
    const startDate = dayjs(week.startDate);
    const endDate = dayjs(week.endDate);
    let current = startDate;
    let weekDaysCount = 0;
    let holidayCount = 0;

    while (current.isSameOrBefore(endDate, 'day')) {
        const dayOfWeek = current.day();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            weekDaysCount++;
            const dateStr = current.format('YYYY-MM-DD');
            if (holidays.some((h) => dayjs(h).format('YYYY-MM-DD') === dateStr)) {
                holidayCount++;
            }
        }
        current = current.add(1, 'day');
    }

    return weekDaysCount > 0 && weekDaysCount === holidayCount;
};

/**
 * ✅ Helper: Count all targets in mainFields structure
 */
const countTargetsInMainFields = (mainFields) => {
    let count = 0;

    if (!mainFields || !Array.isArray(mainFields)) return 0;

    mainFields.forEach((mainField) => {
        // Case 1: Has subFields (like "I. Giáo dục phát triển thể chất")
        if (mainField.subFields && Array.isArray(mainField.subFields)) {
            mainField.subFields.forEach((subField) => {
                if (subField.expectedResults && Array.isArray(subField.expectedResults)) {
                    subField.expectedResults.forEach((expectedResult) => {
                        if (expectedResult.targets && Array.isArray(expectedResult.targets)) {
                            count += expectedResult.targets.length;
                        }
                    });
                }
            });
        }

        // Case 2: Has expectedResults directly (like "III. Giáo dục phát triển ngôn ngữ")
        if (mainField.expectedResults && Array.isArray(mainField.expectedResults)) {
            mainField.expectedResults.forEach((expectedResult) => {
                if (expectedResult.targets && Array.isArray(expectedResult.targets)) {
                    count += expectedResult.targets.length;
                }
            });
        }
    });

    return count;
};

/**
 * ✅ GET DASHBOARD STATISTICS
 */
const getDashboardStats = async (query, userId) => {
    try {
        console.log('📊 [Dashboard getDashboardStats] Starting with query:', query);

        const user = await ensureUserSchool(userId);
        const { academicYearId, classId, weekNumber } = query;

        console.log('📊 Extracted params:', { academicYearId, classId, weekNumber });

        // ✅ STEP 1: Get academic year
        let academicYear;
        if (academicYearId) {
            academicYear = await AcademicYearModel.findOne({
                _id: academicYearId,
                schoolId: user.schoolId,
                _destroy: false,
            }).select('fromYear toYear status');

            if (!academicYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
            }
        } else {
            // Default: active academic year
            academicYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                status: 'active',
                _destroy: false,
            }).select('fromYear toYear status');

            if (!academicYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học đang hoạt động');
            }
        }

        console.log('✅ Academic year:', academicYear.fromYear + '-' + academicYear.toYear);

        // ✅ STEP 2: Validate classId
        if (!classId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Lớp học là bắt buộc');
        }

        console.log('✅ classId validated:', classId);

        // Check if user has permission to view this class
        const accessibleClassIds = await getAccessibleClassIds(user, academicYear._id);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem dữ liệu lớp này');
        }

        // ✅ STEP 3: Get class info
        const classInfo = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            _destroy: false,
        })
            .select('name ageGroup homeRoomTeacher')
            .populate('homeRoomTeacher', 'fullName')
            .lean();

        if (!classInfo) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ STEP 4: Get schedule for week calculation
        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            _destroy: false,
        }).lean();

        let currentWeekNumber = 1;
        let weekDays = [];

        if (schedule) {
            if (weekNumber) {
                currentWeekNumber = parseInt(weekNumber);
                weekDays = getWeekDays(schedule, currentWeekNumber);
            } else {
                // Auto-detect current week
                const today = dayjs();
                const currentWeek = schedule.weeks.find((w) => {
                    const start = dayjs(w.startDate);
                    const end = dayjs(w.endDate);
                    return today.isSameOrAfter(start, 'day') && today.isSameOrBefore(end, 'day');
                });

                if (currentWeek) {
                    currentWeekNumber = currentWeek.weekNumber;
                    weekDays = getWeekDays(schedule, currentWeekNumber);
                }
            }
        }

        console.log('📅 Week:', currentWeekNumber, 'Days:', weekDays.length);

        // ============================================
        // ✅ STATISTICS: COMMON DATA (All roles can view)
        // ============================================

        // 1. Total children by gender (Đang học) - unchanged
        const totalChildrenByGender = await ChildrenManagementModel.aggregate([
            {
                $match: {
                    schoolId: user.schoolId,
                    status: 'Đang học',
                    _destroy: false,
                },
            },
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 },
                },
            },
        ]);

        const totalMale = totalChildrenByGender.find((g) => g._id === 'Nam')?.count || 0;
        const totalFemale = totalChildrenByGender.find((g) => g._id === 'Nữ')?.count || 0;

        // 2. Total classes in year - unchanged
        const totalClasses = await ClassModel.countDocuments({
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            _destroy: false,
        });

        const classesList = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            _destroy: false,
        })
            .select('name ageGroup homeRoomTeacher')
            .populate('homeRoomTeacher', 'fullName')
            .lean();

        // 3. Total meals - unchanged
        const totalMeals = await SchoolMealModel.countDocuments({
            schoolId: user.schoolId,
            _destroy: false,
        });

        // 4. Total menus by age group - unchanged
        const totalMenusByAgeGroup = await SchoolMenuModel.aggregate([
            {
                $match: {
                    schoolId: user.schoolId,
                    _destroy: false,
                },
            },
            {
                $group: {
                    _id: '$ageGroup',
                    count: { $sum: 1 },
                },
            },
        ]);

        // ============================================
        // ✅ NEW STATS: SELECTED CLASS ONLY
        // ============================================

        // ✅ 5. Students in selected class by gender
        const studentsInClass = await ChildrenByClassModel.find({
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            classId: classId,
            managementStatus: { $in: ['Đang học', 'Nghỉ học'] },
            _destroy: false,
        })
            .populate('studentId', 'gender')
            .lean();

        const classStudentsMale = studentsInClass.filter((s) => s.studentId?.gender === 'Nam').length;
        const classStudentsFemale = studentsInClass.filter((s) => s.studentId?.gender === 'Nữ').length;
        const classStudentsTotal = studentsInClass.length;

        // ✅ 6. Attendance stats by day (Mon-Fri)
        let attendanceStatsByDay = [];
        if (weekDays.length > 0) {
            const startDate = dayjs(weekDays[0]).startOf('day').toDate();
            const endDate = dayjs(weekDays[weekDays.length - 1])
                .add(1, 'day')
                .startOf('day')
                .toDate();

            const attendanceRecords = await ChildrenAttendanceModel.find({
                schoolId: user.schoolId,
                academicYearId: academicYear._id,
                classId: classId,
                date: { $gte: startDate, $lt: endDate },
                _destroy: false,
            })
                .select('date status')
                .lean();

            // Group by date
            const attendanceByDate = {};
            attendanceRecords.forEach((record) => {
                const dateKey = dayjs(record.date).format('YYYY-MM-DD');
                if (!attendanceByDate[dateKey]) {
                    attendanceByDate[dateKey] = {
                        present: 0,
                        absentWithPermission: 0,
                        absentWithoutPermission: 0,
                        total: 0,
                    };
                }

                if (record.status === 'Có mặt') {
                    attendanceByDate[dateKey].present++;
                } else if (record.status === 'Vắng có phép') {
                    attendanceByDate[dateKey].absentWithPermission++;
                } else if (record.status === 'Vắng không phép') {
                    attendanceByDate[dateKey].absentWithoutPermission++;
                }
                attendanceByDate[dateKey].total++;
            });

            // Map to result array
            attendanceStatsByDay = weekDays.map((dateStr) => {
                const data = attendanceByDate[dateStr] || {
                    present: 0,
                    absentWithPermission: 0,
                    absentWithoutPermission: 0,
                    total: 0,
                };
                const notMarked = classStudentsTotal - data.total;

                return {
                    date: dateStr,
                    dayOfWeek: dayjs(dateStr).format('dddd'), // Thứ Hai, Thứ Ba...
                    present: data.present,
                    absentWithPermission: data.absentWithPermission,
                    absentWithoutPermission: data.absentWithoutPermission,
                    notMarked: notMarked,
                };
            });
        }

        // ✅ 7. Assessment stats by day (Mon-Fri)
        let assessmentStatsByDay = [];
        if (weekDays.length > 0) {
            const startDate = dayjs(weekDays[0]).startOf('day').toDate();
            const endDate = dayjs(weekDays[weekDays.length - 1])
                .add(1, 'day')
                .startOf('day')
                .toDate();

            const assessmentRecords = await ChildrenDailyAssessmentModel.find({
                schoolId: user.schoolId,
                academicYearId: academicYear._id,
                classId: classId,
                date: { $gte: startDate, $lt: endDate },
                _destroy: false,
            })
                .select('date')
                .lean();

            // Group by date
            const assessmentByDate = {};
            assessmentRecords.forEach((record) => {
                const dateKey = dayjs(record.date).format('YYYY-MM-DD');
                if (!assessmentByDate[dateKey]) {
                    assessmentByDate[dateKey] = 0;
                }
                assessmentByDate[dateKey]++;
            });

            // Map to result array
            assessmentStatsByDay = weekDays.map((dateStr) => {
                const assessed = assessmentByDate[dateStr] || 0;
                const notAssessed = classStudentsTotal - assessed;

                return {
                    date: dateStr,
                    dayOfWeek: dayjs(dateStr).format('dddd'),
                    assessed: assessed,
                    notAssessed: notAssessed,
                };
            });
        }

        // ✅ 8. Certificate stats (week-based)
        let certificateStats = {
            assessed: 0,
            notAssessed: classStudentsTotal,
        };

        if (schedule) {
            const validWeeks = schedule.weeks.filter((w) => !isWeekFullyHoliday(w, schedule.holidays || []));
            const targetWeek = validWeeks.find((w) => w.weekNumber === currentWeekNumber);

            if (targetWeek) {
                const certificateCount = await ChildrenCertificateModel.countDocuments({
                    schoolId: user.schoolId,
                    academicYearId: academicYear._id,
                    classId: classId,
                    weekNumber: currentWeekNumber,
                    _destroy: false,
                });

                certificateStats.assessed = certificateCount;
                certificateStats.notAssessed = classStudentsTotal - certificateCount;
            }
        }

        // ✅ 9. Year targets by age group (ALL age groups)
        console.log('📊 [Dashboard] Calculating year targets...');

        const schoolYearTargets = await SchoolYearTargetModel.find({
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            _destroy: false,
        })
            .select('ageGroup mainFields')
            .lean();

        console.log('📊 Found year targets:', schoolYearTargets.length);

        const yearTargetsByAgeGroup = schoolYearTargets.map((target) => {
            const count = countTargetsInMainFields(target.mainFields);
            console.log(`  - ${target.ageGroup}: ${count} targets`);

            return {
                ageGroup: target.ageGroup,
                count: count,
            };
        });

        // ✅ 10. Educational activities by age group (ALL age groups)
        console.log('📊 [Dashboard] Calculating activities...');

        const activitiesCountByAgeGroup = await SchoolEducationalActivityModel.aggregate([
            {
                $match: {
                    schoolId: user.schoolId,
                    academicYearId: academicYear._id,
                    _destroy: false,
                },
            },
            {
                $group: {
                    _id: '$ageGroup',
                    count: { $sum: 1 },
                },
            },
        ]);

        console.log('📊 Activities by age group:', activitiesCountByAgeGroup);

        const activitiesByAgeGroup = activitiesCountByAgeGroup.map((item) => ({
            ageGroup: item._id,
            count: item.count,
        }));

        // ============================================
        // ✅ FINAL RESPONSE
        // ============================================

        console.log('✅ [Dashboard getDashboardStats] Completed');

        return {
            academicYear: {
                _id: academicYear._id,
                fromYear: academicYear.fromYear,
                toYear: academicYear.toYear,
                status: academicYear.status,
            },
            classInfo: {
                _id: classInfo._id,
                name: classInfo.name,
                ageGroup: classInfo.ageGroup,
                homeRoomTeacher: classInfo.homeRoomTeacher?.fullName || 'Chưa phân công',
            },
            weekNumber: currentWeekNumber,
            weekDays: weekDays.length,
            // Common stats (school-wide)
            totalChildren: {
                total: totalMale + totalFemale,
                male: totalMale,
                female: totalFemale,
            },
            totalClasses,
            classesList: classesList.map((cls) => ({
                _id: cls._id,
                name: cls.name,
                ageGroup: cls.ageGroup,
                homeRoomTeacher: cls.homeRoomTeacher?.fullName || 'Chưa phân công',
            })),
            totalMeals,
            totalMenusByAgeGroup: totalMenusByAgeGroup.map((item) => ({
                ageGroup: item._id,
                count: item.count,
            })),
            // ✅ NEW: Class-specific stats
            classStudents: {
                total: classStudentsTotal,
                male: classStudentsMale,
                female: classStudentsFemale,
            },
            attendanceStatsByDay,
            assessmentStatsByDay,
            certificateStats,
            // ✅ FIXED: School-wide stats
            yearTargetsByAgeGroup,
            activitiesByAgeGroup,
        };
    } catch (error) {
        console.error('❌ [Dashboard getDashboardStats] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thống kê dashboard');
    }
};

/**
 * ✅ GET AVAILABLE ACADEMIC YEARS (for year selector)
 */
const getAvailableYears = async (userId) => {
    try {
        const user = await ensureUserSchool(userId);

        const years = await AcademicYearModel.find({
            schoolId: user.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .sort({ fromYear: -1 })
            .lean();

        return { years };
    } catch (error) {
        console.error('❌ [Dashboard getAvailableYears] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách năm học');
    }
};

/**
 * ✅ GET AVAILABLE WEEKS (for week selector)
 */
const getAvailableWeeks = async (query, userId) => {
    try {
        const user = await ensureUserSchool(userId);
        const { academicYearId } = query;

        let academicYear;
        if (academicYearId) {
            academicYear = await AcademicYearModel.findOne({
                _id: academicYearId,
                schoolId: user.schoolId,
                _destroy: false,
            }).select('_id');

            if (!academicYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
            }
        } else {
            academicYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                status: 'active',
                _destroy: false,
            }).select('_id');

            if (!academicYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học đang hoạt động');
            }
        }

        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            _destroy: false,
        }).lean();

        if (!schedule) {
            return { weeks: [] };
        }

        const holidays = schedule.holidays || [];

        const validWeeks = schedule.weeks
            .filter((w) => !isWeekFullyHoliday(w, holidays))
            .map((w) => ({
                weekNumber: w.weekNumber,
                startDate: w.startDate,
                endDate: w.endDate,
            }));

        return { weeks: validWeeks };
    } catch (error) {
        console.error('❌ [Dashboard getAvailableWeeks] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách tuần');
    }
};

/**
 * ✅ GET ACCESSIBLE CLASSES (for class selector)
 */
const getAccessibleClasses = async (query, userId) => {
    try {
        const user = await ensureUserSchool(userId);
        const { academicYearId } = query;

        let academicYear;
        if (academicYearId) {
            academicYear = await AcademicYearModel.findOne({
                _id: academicYearId,
                schoolId: user.schoolId,
                _destroy: false,
            }).select('_id');

            if (!academicYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
            }
        } else {
            academicYear = await AcademicYearModel.findOne({
                schoolId: user.schoolId,
                status: 'active',
                _destroy: false,
            }).select('_id');

            if (!academicYear) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học đang hoạt động');
            }
        }

        // ✅ Get accessible class IDs
        const accessibleClassIds = await getAccessibleClassIds(user, academicYear._id);

        if (accessibleClassIds.length === 0) {
            return { classes: [] };
        }

        // ✅ Get class details
        const classes = await ClassModel.find({
            _id: { $in: accessibleClassIds },
            schoolId: user.schoolId,
            academicYearId: academicYear._id,
            _destroy: false,
        })
            .select('name grade ageGroup')
            .sort({ grade: 1, name: 1 })
            .lean();

        return { classes };
    } catch (error) {
        console.error('❌ [Dashboard getAccessibleClasses] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp học');
    }
};

export const dashboardServices = {
    getDashboardStats,
    getAvailableYears,
    getAvailableWeeks,
    getAccessibleClasses,
};
