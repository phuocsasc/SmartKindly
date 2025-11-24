import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { ChildrenAttendanceModel } from '~/models/childrenAttendanceModel';
import { ChildrenProfileModel } from '~/models/childrenProfileModel';
import { ClassModel } from '~/models/classModel';
import { AcademicYearModel } from '~/models/academicYearModel';
import { DepartmentModel } from '~/models/departmentModel';
import { ScheduleModel } from '~/models/scheduleModel';
import { UserModel } from '~/models/userModel';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

/**
 * ✅ Helper: Normalize department name to grade
 */
const normalizeDepartmentToGrade = (departmentName) => {
    const mapping = {
        'Khối Nhà Trẻ': 'Nhà trẻ',
        'Khối Mầm': 'Mầm',
        'Khối Chồi': 'Chồi',
        'Khối Lá': 'Lá',
    };
    return mapping[departmentName] || departmentName;
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
 * ✅ Lấy danh sách tuần từ schedule (Thứ 2-6) - FIX: Generate days từ startDate/endDate
 */
const getWeeksFromSchedule = async (schoolId, academicYearId) => {
    try {
        const schedule = await ScheduleModel.findOne({
            schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule || !schedule.weeks) {
            return [];
        }

        // ✅ Generate days array (Mon-Fri) từ startDate và endDate của mỗi tuần
        return schedule.weeks.map((week) => {
            const days = [];
            const startDate = dayjs(week.startDate);
            const endDate = dayjs(week.endDate);

            let currentDate = startDate;
            const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

            // Generate days từ startDate đến endDate
            while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
                const dayOfWeek = currentDate.day(); // 0=Sunday, 1=Monday, ..., 6=Saturday

                // Chỉ lấy thứ 2-6 (Monday=1 to Friday=5)
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    days.push({
                        dayOfWeek: dayNames[dayOfWeek],
                        date: currentDate.toDate(),
                    });
                }

                currentDate = currentDate.add(1, 'day');
            }

            return {
                weekNumber: week.weekNumber,
                startDate: week.startDate,
                endDate: week.endDate,
                days,
            };
        });
    } catch (error) {
        console.error('❌ [getWeeksFromSchedule] Error:', error);
        return [];
    }
};

/**
 * ✅ Điểm danh hàng loạt trong ngày
 */
const bulkAttendance = async (data, userId) => {
    try {
        console.log('📋 [bulkAttendance] Starting with data:', data);

        const { classId, date, attendances } = data;

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Verify active year
        const activeYear = await AcademicYearModel.findOne({
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Không có năm học đang hoạt động');
        }

        // ✅ Verify class exists
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            _destroy: false,
        });

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, activeYear._id);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền điểm danh lớp này');
        }

        // ✅ Validate date (must be Monday-Friday)
        const targetDate = dayjs(date);
        const dayOfWeek = targetDate.day(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được điểm danh từ thứ 2 đến thứ 6');
        }

        // ✅ Get week number
        const weekNumber = targetDate.isoWeek();

        // ✅ Map day of week
        const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayName = dayNames[dayOfWeek];

        // ✅ Bulk operations
        const bulkOps = attendances.map((item) => ({
            updateOne: {
                filter: {
                    schoolId: user.schoolId,
                    academicYearId: activeYear._id,
                    classId,
                    studentId: item.studentId,
                    date: targetDate.toDate(),
                    _destroy: false,
                },
                update: {
                    $set: {
                        status: item.status,
                        note: item.note || '',
                        weekNumber,
                        dayOfWeek: dayName,
                        lastUpdatedBy: user._id,
                    },
                    $setOnInsert: {
                        schoolId: user.schoolId,
                        academicYearId: activeYear._id,
                        classId,
                        studentId: item.studentId,
                        date: targetDate.toDate(),
                        createdBy: user._id,
                    },
                },
                upsert: true,
            },
        }));

        const result = await ChildrenAttendanceModel.bulkWrite(bulkOps);

        console.log('✅ [bulkAttendance] Success:', {
            inserted: result.upsertedCount,
            updated: result.modifiedCount,
        });

        return {
            message: 'Điểm danh thành công',
            inserted: result.upsertedCount,
            updated: result.modifiedCount,
        };
    } catch (error) {
        console.error('❌ [bulkAttendance] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi điểm danh: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách điểm danh theo lớp và ngày/tuần
 */
const getAttendanceByClass = async (query, userId) => {
    try {
        console.log('📋 [getAttendanceByClass] Query:', query);

        const { classId, date, weekNumber, academicYearId } = query;

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Verify academic year
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ Verify class
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        });

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, academicYearId);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem điểm danh lớp này');
        }

        // ✅ Build filter
        let filter = {
            schoolId: user.schoolId,
            academicYearId,
            classId,
            _destroy: false,
        };

        // ✅ FIX: Query theo date range của tuần thay vì chỉ weekNumber
        if (weekNumber) {
            // Lấy thông tin tuần từ Schedule
            const schedule = await ScheduleModel.findOne({
                schoolId: user.schoolId,
                academicYearId,
                _destroy: false,
            }).lean();

            if (schedule) {
                const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));

                if (weekData) {
                    // Query theo date range của tuần
                    filter.date = {
                        $gte: dayjs(weekData.startDate).startOf('day').toDate(),
                        $lte: dayjs(weekData.endDate).endOf('day').toDate(),
                    };

                    console.log('🔍 [getAttendanceByClass] Week date range:', {
                        weekNumber,
                        startDate: dayjs(weekData.startDate).format('YYYY-MM-DD'),
                        endDate: dayjs(weekData.endDate).format('YYYY-MM-DD'),
                    });
                } else {
                    console.log('⚠️ [getAttendanceByClass] Week not found in schedule');
                }
            }
        } else if (date) {
            const targetDate = dayjs(date).startOf('day');
            filter.date = {
                $gte: targetDate.toDate(),
                $lt: targetDate.add(1, 'day').toDate(),
            };
        }

        console.log('🔍 [getAttendanceByClass] Filter:', JSON.stringify(filter, null, 2));

        // ✅ Get attendances - KHÔNG populate studentId để giữ nguyên ObjectId
        const attendances = await ChildrenAttendanceModel.find(filter).sort({ date: 1 }).lean();

        console.log('📊 [getAttendanceByClass] Found attendances:', attendances.length);

        if (attendances.length > 0) {
            console.log('📄 Sample attendance:', {
                studentId: attendances[0].studentId,
                date: attendances[0].date,
                status: attendances[0].status,
                weekNumber: attendances[0].weekNumber,
            });
        }

        // ✅ Get all students in class
        const allStudents = await ChildrenProfileModel.find({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            status: 'Đang học',
            _destroy: false,
        })
            .select('fullName studentCode')
            .sort({ fullName: 1 })
            .lean();

        console.log('📊 [getAttendanceByClass] Found students:', allStudents.length);

        // ✅ Tạo attendanceMap với key chính xác
        const attendanceMap = {};

        attendances.forEach((att) => {
            const studentIdStr = att.studentId.toString();
            const dateStr = dayjs(att.date).format('YYYY-MM-DD');
            const key = `${studentIdStr}-${dateStr}`;

            attendanceMap[key] = {
                _id: att._id,
                status: att.status,
                note: att.note || '',
                date: att.date,
                studentId: att.studentId,
                weekNumber: att.weekNumber,
                dayOfWeek: att.dayOfWeek,
            };

            console.log(`✅ [attendanceMap] Key: ${key} | Status: ${att.status}`);
        });

        console.log('📊 [getAttendanceByClass] Summary:', {
            totalStudents: allStudents.length,
            totalAttendances: attendances.length,
            attendanceMapKeys: Object.keys(attendanceMap).length,
            sampleKeys: Object.keys(attendanceMap).slice(0, 3),
        });

        return {
            classInfo: {
                _id: classData._id,
                name: classData.name,
                grade: classData.grade,
                ageGroup: classData.ageGroup,
            },
            students: allStudents,
            attendances,
            attendanceMap,
        };
    } catch (error) {
        console.error('❌ [getAttendanceByClass] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy dữ liệu điểm danh: ' + error.message);
    }
};

/**
 * ✅ Cập nhật điểm danh 1 học sinh
 */
const updateAttendance = async (id, data, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const attendance = await ChildrenAttendanceModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!attendance) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bản ghi điểm danh');
        }

        // ✅ Verify active year
        const activeYear = await AcademicYearModel.findOne({
            _id: attendance.academicYearId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được sửa điểm danh trong năm học đang hoạt động');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, activeYear._id);
        if (!accessibleClassIds.includes(attendance.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền sửa điểm danh lớp này');
        }

        // ✅ Update
        attendance.status = data.status || attendance.status;
        attendance.note = data.note !== undefined ? data.note : attendance.note;
        attendance.lastUpdatedBy = user._id;

        await attendance.save();

        const populated = await ChildrenAttendanceModel.findById(attendance._id)
            .populate('studentId', 'fullName studentCode')
            .populate('classId', 'name')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        return populated;
    } catch (error) {
        console.error('❌ [updateAttendance] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật điểm danh: ' + error.message);
    }
};

/**
 * ✅ Xóa điểm danh
 */
const deleteAttendance = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const attendance = await ChildrenAttendanceModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!attendance) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bản ghi điểm danh');
        }

        // ✅ Verify active year
        const activeYear = await AcademicYearModel.findOne({
            _id: attendance.academicYearId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ được xóa điểm danh trong năm học đang hoạt động');
        }

        // ✅ Check permission
        const accessibleClassIds = await getAccessibleClasses(user, activeYear._id);
        if (!accessibleClassIds.includes(attendance.classId.toString())) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa điểm danh lớp này');
        }

        // ✅ Soft delete
        await ChildrenAttendanceModel.findByIdAndUpdate(id, { _destroy: true });

        return { message: 'Xóa điểm danh thành công' };
    } catch (error) {
        console.error('❌ [deleteAttendance] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa điểm danh: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách lớp accessible theo năm học
 */
const getAccessibleClassesList = async (academicYearId, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Verify academic year exists
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            console.log('❌ Academic year not found');
            return { classes: [] };
        }

        // ✅ Get accessible classes for this academic year
        const classIds = await getAccessibleClasses(user, academicYearId);

        const classes = await ClassModel.find({
            _id: { $in: classIds },
            academicYearId: academicYearId, // ✅ Filter by selected academic year
            _destroy: false,
        })
            .select('name grade ageGroup')
            .sort({ grade: 1, name: 1 })
            .lean();

        return { classes };
    } catch (error) {
        console.error('❌ [getAccessibleClassesList] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách tuần trong năm học
 */
const getWeeksList = async (academicYearId, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const weeks = await getWeeksFromSchedule(user.schoolId, academicYearId);

        return { weeks };
    } catch (error) {
        console.error('❌ [getWeeksList] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách tuần: ' + error.message);
    }
};

export const childrenAttendanceServices = {
    bulkAttendance,
    getAttendanceByClass,
    updateAttendance,
    deleteAttendance,
    getAccessibleClassesList,
    getWeeksList,
};
