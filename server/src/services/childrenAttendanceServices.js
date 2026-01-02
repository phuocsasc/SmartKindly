import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { ChildrenAttendanceModel } from '~/models/childrenAttendanceModel.js';
import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';
import { ClassModel } from '~/models/classModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import { UserModel } from '~/models/userModel.js';
import dayjs from 'dayjs'; // ✅ Import dayjs

const ALLOWED_STATUSES = ['Có mặt', 'Vắng có phép', 'Vắng không phép'];

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
        throw new ApiError(StatusCodes.NOT_FOUND, 'Chưa khai báo thời khóa biểu năm học này');
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

const isMondayToFriday = (dateObj) => {
    const day = dateObj.getDay(); // 0 CN, 1 T2 ... 6 T7
    return day >= 1 && day <= 5;
};

const isHoliday = (dateObj, holidaysSet) => {
    // ✅ FIX: So sánh theo local date
    const key = dayjs(dateObj).format('YYYY-MM-DD');
    return holidaysSet.has(key);
};

const findWeekNumberByDate = (weeks, dateObj) => {
    const ts = dateObj.getTime();
    const week = weeks.find((w) => ts >= w.startDate.getTime() && ts <= w.endDate.getTime());
    return week ? week.weekNumber : null;
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
        .filter((r) => r.studentId) // loại record lỗi
        .map((r) => ({
            studentId: r.studentId._id.toString(),
            fullName: r.studentId.fullName,
            studentCode: r.studentId.studentCode,
            managementStatus: r.studentId.status, // "Đang học" / "Nghỉ học"
        }));
};

// Đếm vắng theo tuần (Mon-Fri, loại trừ holidays)
const countAbsentInWeek = async (schoolId, academicYearId, classId, studentId, weekNumber) => {
    const absentStatuses = ['Vắng có phép', 'Vắng không phép'];
    const records = await ChildrenAttendanceModel.find({
        schoolId,
        academicYearId,
        classId,
        studentId,
        weekNumber,
        status: { $in: absentStatuses },
        _destroy: false,
    }).select('date status');
    return records.length;
};

// Đếm vắng theo năm (loại trừ holidays – dữ liệu đã chặn tạo vào ngày nghỉ nên mặc định không có)
const countAbsentInYear = async (schoolId, academicYearId, classId, studentId) => {
    const absentStatuses = ['Vắng có phép', 'Vắng không phép'];
    const records = await ChildrenAttendanceModel.countDocuments({
        schoolId,
        academicYearId,
        classId,
        studentId,
        status: { $in: absentStatuses },
        _destroy: false,
    });
    return records;
};

/**
 * Bulk điểm danh 1 ngày cho 1 lớp
 */
const bulkAttendance = async (data, userId) => {
    const user = await ensureUserSchool(userId);
    const { academicYearId, classId, date, items } = data;

    const year = await getAcademicYearOrThrow(user.schoolId, academicYearId);
    if (year.status !== 'active') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được điểm danh trong năm học đang hoạt động');
    }

    const classData = await ClassModel.findOne({
        _id: classId,
        schoolId: user.schoolId,
        academicYearId,
        _destroy: false,
    }).select('_id name');
    if (!classData) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');

    const accessible = await getAccessibleClassIds(user, academicYearId);
    if (!accessible.includes(classId)) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền điểm danh lớp này');
    }

    const schedule = await getScheduleOrThrow(user.schoolId, academicYearId);
    const { weeks, holidays } = getWeeksFromSchedule(schedule);
    const holidaysSet = new Set(holidays);

    const dateObj = new Date(date);
    if (!isMondayToFriday(dateObj)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Chỉ điểm danh từ Thứ 2 đến Thứ 6');
    }
    if (isHoliday(dateObj, holidaysSet)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Không được điểm danh vào ngày nghỉ');
    }

    const weekNumber = findWeekNumberByDate(weeks, dateObj);
    if (!weekNumber && weekNumber !== 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Ngày điểm danh không thuộc bất kỳ tuần nào đã khai báo');
    }

    // Lấy danh sách trẻ trong lớp (bao gồm cả nghỉ học nhưng chỉ "Đang học" mới được điểm danh)
    const children = await getChildrenByClass(user.schoolId, academicYearId, classId);
    const activeStudentIds = new Set(children.filter((c) => c.managementStatus === 'Đang học').map((c) => c.studentId));

    // Lọc items chỉ còn học sinh đang học, và trạng thái hợp lệ
    const validPayload = (items || [])
        .filter((it) => activeStudentIds.has(it.studentId))
        .filter((it) => ALLOWED_STATUSES.includes(it.status));

    // Upsert từng bản ghi
    const ops = validPayload.map((it) =>
        ChildrenAttendanceModel.updateOne(
            {
                schoolId: user.schoolId,
                academicYearId,
                classId,
                studentId: it.studentId,
                date: dateObj,
                _destroy: false,
            },
            {
                $set: {
                    weekNumber,
                    status: it.status,
                    note: it.note || '',
                    lastUpdatedBy: user._id,
                },
                $setOnInsert: {
                    createdBy: user._id,
                },
            },
            { upsert: true },
        ),
    );
    await Promise.all(ops);

    return {
        message: 'Điểm danh hàng loạt thành công',
        date: dayjs(dateObj).format('YYYY-MM-DD'), // ✅ Format theo local
        classId,
        academicYearId,
        weekNumber,
        totalProcessed: validPayload.length,
    };
};

/**
 * Lấy dữ liệu điểm danh theo lớp theo tuần hoặc theo ngày
 * - Trả về danh sách học sinh (bao gồm Đang học & Nghỉ học)
 * - attendanceMap: { [studentId]: { [yyyy-mm-dd]: { _id, status, note } } }
 * - totals: vắng trong tuần/năm cho từng học sinh
 * - days: TẤT CẢ ngày Mon-Fri (không loại trừ holidays)
 */
const getAttendanceByClass = async (query, userId) => {
    const user = await ensureUserSchool(userId);
    const { academicYearId, classId, date, weekNumber } = query;

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

    let targetWeekNumber = weekNumber ? Number(weekNumber) : null;
    if (date) {
        const d = new Date(date);
        targetWeekNumber = findWeekNumberByDate(weeks, d);
        if (!targetWeekNumber && targetWeekNumber !== 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Ngày không thuộc tuần nào đã khai báo');
        }
    }
    if (targetWeekNumber == null) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cần truyền date hoặc weekNumber');
    }

    // Tạo danh sách ngày trong tuần (Thứ 2 -> Thứ 6, KHÔNG loại bỏ ngày nghỉ)
    const week = weeks.find((w) => w.weekNumber === targetWeekNumber);
    if (!week) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tuần đã khai báo');

    const cur = new Date(week.startDate);
    const daysInWeek = [];
    while (cur <= week.endDate) {
        if (isMondayToFriday(cur)) {
            const key = dayjs(cur).format('YYYY-MM-DD'); // ✅ Format theo local
            daysInWeek.push(key); // ✅ Thêm tất cả Mon-Fri, kể cả ngày nghỉ
        }
        cur.setDate(cur.getDate() + 1);
    }

    // Lấy danh sách trẻ trong lớp
    const children = await getChildrenByClass(user.schoolId, academicYearId, classId);

    // Lấy attendance trong tuần
    const attDocs = await ChildrenAttendanceModel.find({
        schoolId: user.schoolId,
        academicYearId,
        classId,
        weekNumber: targetWeekNumber,
        _destroy: false,
    })
        .select('_id studentId date status note')
        .lean();

    const attendanceMap = {};
    for (const stu of children) {
        attendanceMap[stu.studentId] = {};
    }
    for (const doc of attDocs) {
        const sId = doc.studentId.toString();
        const dayKey = dayjs(doc.date).format('YYYY-MM-DD'); // ✅ Format theo local
        if (!attendanceMap[sId]) attendanceMap[sId] = {};
        attendanceMap[sId][dayKey] = {
            _id: doc._id.toString(),
            status: doc.status,
            note: doc.note || '',
        };
    }

    // Tính tổng vắng tuần/năm
    const totals = {};
    for (const stu of children) {
        const [weekAbsent, yearAbsent] = await Promise.all([
            countAbsentInWeek(user.schoolId, academicYearId, classId, stu.studentId, targetWeekNumber),
            countAbsentInYear(user.schoolId, academicYearId, classId, stu.studentId),
        ]);
        totals[stu.studentId] = {
            absentInWeek: weekAbsent,
            absentInYear: yearAbsent,
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
        days: daysInWeek, // ✅ yyyy-MM-dd (Mon-Fri, bao gồm cả ngày nghỉ) - format theo local
        holidays, // mảng ngày nghỉ yyyy-MM-dd - format theo local
        students: children, // gồm "Đang học" & "Nghỉ học"
        attendanceMap, // chỉ học sinh "Đang học" mới được chỉnh sửa/ghi mới
        totals,
    };
};

/**
 * Cập nhật 1 bản ghi điểm danh
 */
const updateAttendance = async (id, data, userId) => {
    const user = await ensureUserSchool(userId);

    const doc = await ChildrenAttendanceModel.findOne({
        _id: id,
        schoolId: user.schoolId,
        _destroy: false,
    });
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bản ghi điểm danh');

    const year = await getAcademicYearOrThrow(user.schoolId, doc.academicYearId);
    if (year.status !== 'active') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được sửa điểm danh trong năm học đang hoạt động');
    }

    // Kiểm tra quyền theo lớp
    const accessible = await getAccessibleClassIds(user, doc.academicYearId.toString());
    if (!accessible.includes(doc.classId.toString())) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền sửa điểm danh lớp này');
    }

    // Không cho chỉnh sửa nếu là ngày nghỉ (an toàn)
    const schedule = await getScheduleOrThrow(user.schoolId, doc.academicYearId.toString());
    const { holidays } = getWeeksFromSchedule(schedule);
    const holidaysSet = new Set(holidays);
    const dayKey = dayjs(doc.date).format('YYYY-MM-DD'); // ✅ Format theo local
    if (holidaysSet.has(dayKey)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Không được sửa điểm danh vào ngày nghỉ');
    }

    if (data.status && !ALLOWED_STATUSES.includes(data.status)) {
        throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Trạng thái điểm danh không hợp lệ');
    }

    if (data.status) doc.status = data.status;
    if (data.note !== undefined) doc.note = data.note;
    doc.lastUpdatedBy = user._id;
    await doc.save();

    return doc.toObject();
};

/**
 * Xóa 1 bản ghi điểm danh
 */
const deleteAttendance = async (id, userId) => {
    const user = await ensureUserSchool(userId);

    const doc = await ChildrenAttendanceModel.findOne({
        _id: id,
        schoolId: user.schoolId,
        _destroy: false,
    });
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy bản ghi điểm danh');

    const year = await getAcademicYearOrThrow(user.schoolId, doc.academicYearId);
    if (year.status !== 'active') {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được xóa điểm danh trong năm học đang hoạt động');
    }

    const accessible = await getAccessibleClassIds(user, doc.academicYearId.toString());
    if (!accessible.includes(doc.classId.toString())) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xóa điểm danh lớp này');
    }

    await ChildrenAttendanceModel.deleteOne({ _id: id });
    return { message: 'Xóa điểm danh thành công' };
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
 * Danh sách tuần theo schedule (Mon-Fri) + holidays
 */
const getWeeksList = async (academicYearId, userId) => {
    const user = await ensureUserSchool(userId);
    await getAcademicYearOrThrow(user.schoolId, academicYearId);
    const schedule = await getScheduleOrThrow(user.schoolId, academicYearId);
    const { weeks, holidays } = getWeeksFromSchedule(schedule);
    return { weeks, holidays };
};

export const childrenAttendanceServices = {
    bulkAttendance,
    getAttendanceByClass,
    updateAttendance,
    deleteAttendance,
    getAccessibleClassesList,
    getWeeksList,
};
