// server/src/services/parentChildrenServices.js

import { UserModel } from '~/models/userModel.js';
import { SchoolModel } from '~/models/schoolModel.js';
import { ChildrenManagementModel } from '~/models/childrenManagementModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { ChildrenByClassModel } from '~/models/childrenByClassModel.js';
import { ClassModel } from '~/models/classModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import { WeeklyPlanModel } from '~/models/weeklyPlanModel.js';
import ApiError from '~/utils/ApiError.js';
import dayjs from 'dayjs';
import { StatusCodes } from 'http-status-codes';
import { SchoolMenuApplyModel } from '~/models/schoolMenuApplyModel.js';
import { ChildrenAttendanceModel } from '~/models/childrenAttendanceModel.js';
import { ChildrenDailyAssessmentModel } from '~/models/childrenDailyAssessmentModel.js';
import { ChildrenCertificateModel } from '~/models/childrenCertificateModel.js';
import { ChildrenProgramCompleteModel } from '~/models/childrenProgramCompleteConfigModel.js';
import { SchoolYearTargetModel } from '~/models/schoolYearTargetModel.js'; // ✅ ADD

/**
 * ✅ GET SCHOOL INFO - Phụ huynh xem thông tin trường học của con
 */
const getSchoolInfo = async (userId) => {
    try {
        console.log('📋 [ParentChildren getSchoolInfo] Starting for userId:', userId);

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn chưa được gán vào trường học nào');
        }

        // ✅ 2. Lấy thông tin trường học
        const school = await SchoolModel.findOne({
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('schoolId name abbreviation address phone email website manager establishmentDate status')
            .lean();

        if (!school) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin trường học');
        }

        console.log('✅ [ParentChildren getSchoolInfo] Success:', {
            schoolName: school.name,
        });

        return school;
    } catch (error) {
        console.error('❌ [ParentChildren getSchoolInfo] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin trường học');
    }
};

/**
 * ✅ GET CHILDREN INFO - Phụ huynh xem thông tin con
 */
const getChildrenInfo = async (userId) => {
    try {
        console.log('📋 [ParentChildren getChildrenInfo] Starting for userId:', userId);

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Lấy thông tin học sinh từ ChildrenManagementModel
        const student = await ChildrenManagementModel.findOne({
            _id: parent.studentId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select(
                'fullName nickname birthDate gender ethnicity studentCode enrollmentDate currentAgeGroup status ' +
                    'motherName motherBirthYear motherPhone motherEmail ' +
                    'fatherName fatherBirthYear fatherPhone fatherEmail ' +
                    'permanentAddress currentAddress hasClass',
            )
            .lean();

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin học sinh');
        }

        // ✅ 3. Lấy thông tin lớp học hiện tại (năm học active)
        let currentClass = null;
        let currentAcademicYear = null;

        const activeYear = await AcademicYearModel.findOne({
            schoolId: parent.schoolId,
            status: 'active',
            _destroy: false,
        })
            .select('_id fromYear toYear status')
            .lean();

        if (activeYear && student.hasClass) {
            currentAcademicYear = {
                _id: activeYear._id,
                fromYear: activeYear.fromYear,
                toYear: activeYear.toYear,
                status: activeYear.status,
            };

            const classRecord = await ChildrenByClassModel.findOne({
                schoolId: parent.schoolId,
                academicYearId: activeYear._id,
                studentId: parent.studentId,
                _destroy: false,
            })
                .populate({
                    path: 'classId',
                    select: 'name grade ageGroup',
                    populate: {
                        path: 'homeRoomTeacher',
                        select: 'fullName phone email',
                    },
                })
                .lean();

            if (classRecord && classRecord.classId) {
                currentClass = {
                    _id: classRecord.classId._id,
                    name: classRecord.classId.name,
                    grade: classRecord.classId.grade,
                    ageGroup: classRecord.classId.ageGroup,
                    homeRoomTeacher: classRecord.classId.homeRoomTeacher
                        ? {
                              fullName: classRecord.classId.homeRoomTeacher.fullName,
                              phone: classRecord.classId.homeRoomTeacher.phone,
                              email: classRecord.classId.homeRoomTeacher.email,
                          }
                        : null,
                };
            }
        }

        console.log('✅ [ParentChildren getChildrenInfo] Success:', {
            studentName: student.fullName,
            studentCode: student.studentCode,
            className: currentClass?.name || 'Chưa có lớp',
        });

        return {
            student,
            currentAcademicYear,
            currentClass,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getChildrenInfo] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin học sinh');
    }
};

/**
 * ✅ UPDATE CHILDREN INFO - Phụ huynh cập nhật thông tin con (chỉ thông tin gia đình + địa chỉ)
 */
const updateChildrenInfo = async (userId, data) => {
    try {
        console.log('📝 [ParentChildren updateChildrenInfo] Starting for userId:', userId);

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Lấy thông tin học sinh
        const student = await ChildrenManagementModel.findOne({
            _id: parent.studentId,
            schoolId: parent.schoolId,
            _destroy: false,
        });

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin học sinh');
        }

        // ✅ 3. Chỉ cho phép cập nhật các field được phép
        const allowedFields = [
            'motherName',
            'motherBirthYear',
            'motherPhone',
            'motherEmail',
            'fatherName',
            'fatherBirthYear',
            'fatherPhone',
            'fatherEmail',
            'permanentAddress',
            'currentAddress',
        ];

        const updateData = {};
        let hasChanges = false;

        allowedFields.forEach((field) => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
                hasChanges = true;
            }
        });

        if (!hasChanges) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Không có thông tin nào được cập nhật');
        }

        // ✅ 4. Cập nhật vào database
        Object.assign(student, updateData);
        student.lastUpdatedBy = userId;
        await student.save();

        // ✅ 5. Lấy lại thông tin sau khi update
        const updatedStudent = await ChildrenManagementModel.findById(student._id)
            .select(
                'fullName nickname birthDate gender ethnicity studentCode enrollmentDate currentAgeGroup status ' +
                    'motherName motherBirthYear motherPhone motherEmail ' +
                    'fatherName fatherBirthYear fatherPhone fatherEmail ' +
                    'permanentAddress currentAddress hasClass',
            )
            .lean();

        console.log('✅ [ParentChildren updateChildrenInfo] Success:', {
            studentName: updatedStudent.fullName,
            studentCode: updatedStudent.studentCode,
            updatedFields: Object.keys(updateData),
        });

        return updatedStudent;
    } catch (error) {
        console.error('❌ [ParentChildren updateChildrenInfo] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật thông tin học sinh');
    }
};

/**
 * ✅ GET ACADEMIC YEARS - Lấy danh sách năm học của trường (phụ huynh có thể xem)
 */
const getAcademicYears = async (userId) => {
    try {
        console.log('📅 [ParentChildren getAcademicYears] Starting for userId:', userId);

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn chưa được gán vào trường học nào');
        }

        // ✅ 2. Lấy danh sách năm học của trường
        const academicYears = await AcademicYearModel.find({
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('_id fromYear toYear status')
            .sort({ fromYear: -1 }) // Sắp xếp năm gần nhất trước
            .lean();

        console.log('✅ [ParentChildren getAcademicYears] Found years:', academicYears.length);

        return {
            academicYears,
            activeYearId: academicYears.find((y) => y.status === 'active')?._id || null,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getAcademicYears] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách năm học');
    }
};

/**
 * ✅ GET STUDENT CLASSES BY YEAR - Lấy danh sách lớp học sinh đã/đang học theo năm học
 */
const getStudentClassesByYear = async (academicYearId, userId) => {
    try {
        console.log('📋 [ParentChildren getStudentClassesByYear] Starting:', { academicYearId, userId });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Lấy danh sách lớp học sinh đã học trong năm học này
        const classRecords = await ChildrenByClassModel.find({
            schoolId: parent.schoolId,
            academicYearId,
            studentId: parent.studentId,
            _destroy: false,
        })
            .populate({
                path: 'classId',
                select: 'name grade ageGroup homeRoomTeacher',
                populate: {
                    path: 'homeRoomTeacher',
                    select: 'fullName',
                },
            })
            .lean();

        const classes = classRecords
            .filter((record) => record.classId) // Loại bỏ record lỗi
            .map((record) => ({
                _id: record.classId._id,
                name: record.classId.name,
                grade: record.classId.grade,
                ageGroup: record.classId.ageGroup,
                homeRoomTeacher: record.classId.homeRoomTeacher?.fullName || null,
            }));

        console.log('✅ [ParentChildren getStudentClassesByYear] Found classes:', classes.length);

        return {
            academicYear,
            classes,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getStudentClassesByYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp học');
    }
};

/**
 * ✅ GET WEEKLY PLAN - Phụ huynh xem kế hoạch giáo dục chi tiết theo tuần của con
 */
const getWeeklyPlan = async (academicYearId, classId, weekNumber, userId) => {
    try {
        console.log('📋 [ParentChildren getWeeklyPlan] Starting:', {
            academicYearId,
            classId,
            weekNumber,
            userId,
        });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Kiểm tra lớp học có thuộc về học sinh không
        const classRecord = await ChildrenByClassModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        }).lean();

        if (!classRecord) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Học sinh không thuộc lớp này trong năm học được chọn');
        }

        // ✅ 4. Lấy thông tin lớp
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('name grade ageGroup homeRoomTeacher')
            .populate('homeRoomTeacher', 'fullName')
            .lean();

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ 5. Lấy thời khóa biểu để validate tuần
        const schedule = await ScheduleModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Chưa có thời khóa biểu cho năm học này');
        }

        const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tuần này trong thời khóa biểu');
        }

        if (weekData.activityPeriods.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Tuần này chưa có mốc hoạt động nào');
        }

        // ✅ 6. Lấy kế hoạch chi tiết theo tuần
        let weeklyPlan = await WeeklyPlanModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        })
            .populate('classId', 'name grade ageGroup')
            .lean();

        // ✅ 7. Nếu chưa có kế hoạch chi tiết, trả về template từ schedule
        if (!weeklyPlan) {
            const templateActivities = weekData.activityPeriods.map((period) => ({
                activityPeriodId: period._id,
                startTime: period.startTime,
                endTime: period.endTime,
                description: period.description,
                detailedContent: '',
            }));

            weeklyPlan = {
                classId: classData,
                weekNumber: parseInt(weekNumber),
                monday: templateActivities,
                tuesday: templateActivities,
                wednesday: templateActivities,
                thursday: templateActivities,
                friday: templateActivities,
            };
        }

        console.log('✅ [ParentChildren getWeeklyPlan] Success:', {
            className: classData.name,
            weekNumber,
            hasPlan: !!weeklyPlan._id,
        });

        return {
            academicYear,
            classData,
            weekData,
            weeklyPlan,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getWeeklyPlan] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy kế hoạch giáo dục');
    }
};

/**
 * ✅ GET SCHEDULE WEEKS - Phụ huynh lấy danh sách tuần trong năm học
 */
const getScheduleWeeks = async (academicYearId, userId) => {
    try {
        console.log('📅 [ParentChildren getScheduleWeeks] Starting:', { academicYearId, userId });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn chưa được gán vào trường học nào');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Lấy schedule
        const schedule = await ScheduleModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('weeks')
            .lean();

        if (!schedule) {
            return { weeks: [] };
        }

        console.log('✅ [ParentChildren getScheduleWeeks] Success:', {
            weeksCount: schedule.weeks?.length || 0,
        });

        return {
            weeks: schedule.weeks || [],
        };
    } catch (error) {
        console.error('❌ [ParentChildren getScheduleWeeks] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách tuần');
    }
};

/**
 * ✅ GET WEEKLY MENU - Phụ huynh xem thực đơn hằng tuần theo lớp và tuần
 */
const getWeeklyMenu = async (academicYearId, classId, weekNumber, userId) => {
    try {
        console.log('🍽️ [ParentChildren getWeeklyMenu] Starting:', {
            academicYearId,
            classId,
            weekNumber,
            userId,
        });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Kiểm tra lớp học có thuộc về học sinh không
        const classRecord = await ChildrenByClassModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        }).lean();

        if (!classRecord) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Học sinh không thuộc lớp này trong năm học được chọn');
        }

        // ✅ 4. Lấy thông tin lớp và xác định nhóm tuổi thực đơn
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('name grade ageGroup homeRoomTeacher')
            .populate('homeRoomTeacher', 'fullName')
            .lean();

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ 5. Map ageGroup của lớp sang ageGroup của thực đơn
        let menuAgeGroup = '';
        if (['12-24 tháng', '24-36 tháng'].includes(classData.ageGroup)) {
            menuAgeGroup = 'Nhóm nhà trẻ (12 - 36 tháng tuổi)';
        } else if (['3-4 tuổi', '4-5 tuổi', '5-6 tuổi'].includes(classData.ageGroup)) {
            menuAgeGroup = 'Nhóm mẫu giáo (3 - 6 tuổi)';
        } else {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Nhóm tuổi của lớp không hợp lệ');
        }

        console.log('📊 [ParentChildren getWeeklyMenu] Mapped ageGroup:', {
            classAgeGroup: classData.ageGroup,
            menuAgeGroup,
        });

        // ✅ 6. Lấy thời khóa biểu để validate tuần và lấy holidays
        const schedule = await ScheduleModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Chưa có thời khóa biểu cho năm học này');
        }

        const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tuần này trong thời khóa biểu');
        }

        // ✅ 7. Lấy thực đơn áp dụng của tuần này
        const menuApplies = await SchoolMenuApplyModel.find({
            schoolId: parent.schoolId,
            academicYearId,
            ageGroup: menuAgeGroup,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        })
            .select('dayOfWeek date menuSnapshot')
            .sort({ date: 1 })
            .lean();

        console.log('✅ [ParentChildren getWeeklyMenu] Success:', {
            className: classData.name,
            weekNumber,
            menuAgeGroup,
            menuAppliesCount: menuApplies.length,
        });

        return {
            academicYear,
            classData,
            menuAgeGroup,
            weekData: {
                weekNumber: weekData.weekNumber,
                startDate: weekData.startDate,
                endDate: weekData.endDate,
            },
            holidays: schedule.holidays || [],
            menuApplies,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getWeeklyMenu] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thực đơn hằng tuần');
    }
};

/**
 * ✅ GET ATTENDANCE - Phụ huynh xem điểm danh hằng tuần của con
 */
const getAttendance = async (academicYearId, classId, weekNumber, userId) => {
    try {
        console.log('📋 [ParentChildren getAttendance] Starting:', {
            academicYearId,
            classId,
            weekNumber,
            userId,
        });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Kiểm tra học sinh có thuộc lớp không
        const classRecord = await ChildrenByClassModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        }).lean();

        if (!classRecord) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Học sinh không thuộc lớp này trong năm học được chọn');
        }

        // ✅ 4. Lấy thông tin lớp
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('name grade ageGroup homeRoomTeacher')
            .populate('homeRoomTeacher', 'fullName')
            .lean();

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ 5. Lấy thời khóa biểu để validate tuần và lấy holidays
        const schedule = await ScheduleModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Chưa có thời khóa biểu cho năm học này');
        }

        const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tuần này trong thời khóa biểu');
        }

        // ✅ 6. Tạo danh sách ngày trong tuần (Thứ 2 - Thứ 6)
        const isMondayToFriday = (date) => {
            const day = date.getDay();
            return day >= 1 && day <= 5;
        };

        const daysInWeek = [];
        const cur = new Date(weekData.startDate);
        while (cur <= new Date(weekData.endDate)) {
            if (isMondayToFriday(cur)) {
                daysInWeek.push(new Date(cur).toISOString().split('T')[0]);
            }
            cur.setDate(cur.getDate() + 1);
        }

        // ✅ 7. Lấy thông tin học sinh
        const student = await ChildrenManagementModel.findOne({
            _id: parent.studentId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fullName studentCode status')
            .lean();

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin học sinh');
        }

        // ✅ 8. Lấy dữ liệu điểm danh của học sinh trong tuần
        const attendanceRecords = await ChildrenAttendanceModel.find({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        })
            .select('date status note')
            .lean();

        // Map dữ liệu điểm danh theo ngày
        const attendanceMap = {};
        attendanceRecords.forEach((record) => {
            const dateKey = new Date(record.date).toISOString().split('T')[0];
            attendanceMap[dateKey] = {
                status: record.status,
                note: record.note || '',
            };
        });

        // ✅ 9. Đếm số ngày vắng trong tuần
        const absentStatuses = ['Vắng có phép', 'Vắng không phép'];
        const absentInWeek = attendanceRecords.filter((r) => absentStatuses.includes(r.status)).length;

        // ✅ 10. Đếm tổng số ngày vắng trong năm học
        const totalAbsentInYear = await ChildrenAttendanceModel.countDocuments({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            status: { $in: absentStatuses },
            _destroy: false,
        });

        console.log('✅ [ParentChildren getAttendance] Success:', {
            studentName: student.fullName,
            weekNumber,
            daysCount: daysInWeek.length,
            absentInWeek,
        });

        return {
            academicYear,
            classData,
            student,
            weekData: {
                weekNumber: weekData.weekNumber,
                startDate: weekData.startDate,
                endDate: weekData.endDate,
            },
            days: daysInWeek,
            holidays: schedule.holidays || [],
            attendanceMap,
            absentInWeek,
            totalAbsentInYear,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getAttendance] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin điểm danh');
    }
};

/**
 * ✅ GET DAILY ASSESSMENT - Phụ huynh xem đánh giá hằng ngày của con
 */
const getDailyAssessment = async (academicYearId, classId, weekNumber, userId) => {
    try {
        console.log('📋 [ParentChildren getDailyAssessment] Starting:', {
            academicYearId,
            classId,
            weekNumber,
            userId,
        });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Kiểm tra học sinh có thuộc lớp không
        const classRecord = await ChildrenByClassModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        }).lean();

        if (!classRecord) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Học sinh không thuộc lớp này trong năm học được chọn');
        }

        // ✅ 4. Lấy thông tin lớp
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('name grade ageGroup homeRoomTeacher')
            .populate('homeRoomTeacher', 'fullName')
            .lean();

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ 5. Lấy thời khóa biểu để validate tuần và lấy holidays
        const schedule = await ScheduleModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Chưa có thời khóa biểu cho năm học này');
        }

        const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tuần này trong thời khóa biểu');
        }

        // ✅ 6. Tạo danh sách ngày trong tuần (Thứ 2 - Thứ 6) - FIX: Dùng dayjs
        const isMondayToFriday = (date) => {
            const day = dayjs(date).day();
            return day >= 1 && day <= 5;
        };

        const daysInWeek = [];
        const cur = new Date(weekData.startDate);
        while (cur <= new Date(weekData.endDate)) {
            if (isMondayToFriday(cur)) {
                // ✅ FIX: Dùng dayjs.format() thay vì toISOString()
                daysInWeek.push(dayjs(cur).format('YYYY-MM-DD'));
            }
            cur.setDate(cur.getDate() + 1);
        }

        // ✅ 7. Lấy thông tin học sinh
        const student = await ChildrenManagementModel.findOne({
            _id: parent.studentId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fullName studentCode status')
            .lean();

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin học sinh');
        }

        // ✅ 8. Lấy dữ liệu điểm danh của học sinh trong tuần (để hiển thị trạng thái)
        const attendanceRecords = await ChildrenAttendanceModel.find({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        })
            .select('date status note')
            .lean();

        const attendanceMap = {};
        attendanceRecords.forEach((record) => {
            // ✅ FIX: Dùng dayjs.format() thay vì toISOString()
            const dateKey = dayjs(record.date).format('YYYY-MM-DD');
            attendanceMap[dateKey] = {
                status: record.status,
                note: record.note || '',
            };
        });

        // ✅ 9. Lấy dữ liệu đánh giá của học sinh trong tuần
        const assessmentRecords = await ChildrenDailyAssessmentModel.find({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        })
            .select('date healthStatus emotionalBehavior skillsKnowledge notes')
            .lean();

        const assessmentMap = {};
        assessmentRecords.forEach((record) => {
            // ✅ FIX: Dùng dayjs.format() thay vì toISOString()
            const dateKey = dayjs(record.date).format('YYYY-MM-DD');
            assessmentMap[dateKey] = {
                _id: record._id,
                healthStatus: record.healthStatus,
                emotionalBehavior: record.emotionalBehavior,
                skillsKnowledge: record.skillsKnowledge,
                notes: record.notes || '',
            };
        });

        // ✅ 10. Đếm số ngày đã đánh giá trong tuần
        const assessedInWeek = assessmentRecords.length;

        // ✅ 11. Đếm tổng số ngày đã đánh giá trong năm học
        const totalAssessedInYear = await ChildrenDailyAssessmentModel.countDocuments({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        });

        // ✅ FIX: Normalize holidays về YYYY-MM-DD format (giống childrenDailyAssessmentServices)
        const holidays = (schedule.holidays || []).map((h) => {
            const d = h.date ? new Date(h.date) : new Date(h);
            return dayjs(d).format('YYYY-MM-DD');
        });

        console.log('✅ [ParentChildren getDailyAssessment] Success:', {
            studentName: student.fullName,
            weekNumber,
            daysCount: daysInWeek.length,
            assessedInWeek,
        });

        return {
            academicYear,
            classData,
            student,
            weekData: {
                weekNumber: weekData.weekNumber,
                startDate: weekData.startDate,
                endDate: weekData.endDate,
            },
            days: daysInWeek,
            holidays, // ✅ FIX: Trả về mảng string YYYY-MM-DD
            attendanceMap,
            assessmentMap,
            assessedInWeek,
            totalAssessedInYear,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getDailyAssessment] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin đánh giá hằng ngày');
    }
};

/**
 * ✅ GET WEEKLY CERTIFICATE - Phụ huynh xem phiếu bé ngoan hằng tuần của con
 */
const getWeeklyCertificate = async (academicYearId, classId, weekNumber, userId) => {
    try {
        console.log('🏆 [ParentChildren getWeeklyCertificate] Starting:', {
            academicYearId,
            classId,
            weekNumber,
            userId,
        });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Kiểm tra học sinh có thuộc lớp không
        const classRecord = await ChildrenByClassModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        }).lean();

        if (!classRecord) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Học sinh không thuộc lớp này trong năm học được chọn');
        }

        // ✅ 4. Lấy thông tin lớp
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('name grade ageGroup homeRoomTeacher')
            .populate('homeRoomTeacher', 'fullName')
            .lean();

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        // ✅ 5. Lấy thời khóa biểu để validate tuần
        const schedule = await ScheduleModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Chưa có thời khóa biểu cho năm học này');
        }

        const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy tuần này trong thời khóa biểu');
        }

        // ✅ 6. Lấy thông tin học sinh
        const student = await ChildrenManagementModel.findOne({
            _id: parent.studentId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fullName studentCode status')
            .lean();

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin học sinh');
        }

        // ✅ 7. Lấy phiếu bé ngoan của học sinh trong tuần này
        const certificate = await ChildrenCertificateModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        })
            .select('isGoodChild comment createdAt updatedAt createdBy lastUpdatedBy')
            .populate('createdBy', 'fullName')
            .populate('lastUpdatedBy', 'fullName')
            .lean();

        // ✅ 8. Đếm số phiếu bé ngoan trong năm học
        const totalCertificatesInYear = await ChildrenCertificateModel.countDocuments({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            isGoodChild: true,
            _destroy: false,
        });

        console.log('✅ [ParentChildren getWeeklyCertificate] Success:', {
            studentName: student.fullName,
            weekNumber,
            hasCertificate: !!certificate,
            isGoodChild: certificate?.isGoodChild || false,
        });

        return {
            academicYear,
            classData,
            student,
            weekData: {
                weekNumber: weekData.weekNumber,
                startDate: weekData.startDate,
                endDate: weekData.endDate,
            },
            certificate: certificate || null,
            totalCertificatesInYear,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getWeeklyCertificate] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thông tin phiếu bé ngoan');
    }
};

/**
 * ✅ NEW: Helper function to fetch target details for parent
 */
const fetchTargetDetailsForParent = async (schoolId, academicYearId, classAgeGroup, assessmentDetails) => {
    try {
        // Map class ageGroup to config ageGroup
        const mapping = {
            '12-24 tháng': 'Nhà trẻ 12-24 tháng',
            '24-36 tháng': 'Nhà trẻ 24-36 tháng',
            '3-4 tuổi': 'Khối mầm 3-4 tuổi',
            '4-5 tuổi': 'Khối chồi 4-5 tuổi',
            '5-6 tuổi': 'Khối lá 5-6 tuổi',
        };

        const configAgeGroup = mapping[classAgeGroup];
        if (!configAgeGroup) return {};

        const targetData = await SchoolYearTargetModel.findOne({
            schoolId,
            academicYearId,
            ageGroup: configAgeGroup,
            _destroy: false,
        })
            .select('mainFields')
            .lean();

        if (!targetData) return {};

        const details = {};
        const targetIds = assessmentDetails.map((d) => String(d.targetId));

        const processTargets = (mainFields) => {
            mainFields.forEach((mainField) => {
                if (mainField.subFields && mainField.subFields.length > 0) {
                    mainField.subFields.forEach((subField) => {
                        subField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                if (targetIds.includes(String(target._id))) {
                                    details[String(target._id)] = {
                                        code: target.code,
                                        content: target.content,
                                    };
                                }
                            });
                        });
                    });
                } else {
                    mainField.expectedResults?.forEach((expectedResult) => {
                        expectedResult.targets?.forEach((target) => {
                            if (targetIds.includes(String(target._id))) {
                                details[String(target._id)] = {
                                    code: target.code,
                                    content: target.content,
                                };
                            }
                        });
                    });
                }
            });
        };

        if (targetData.mainFields) {
            processTargets(targetData.mainFields);
        }

        return details;
    } catch (error) {
        console.error('❌ [fetchTargetDetailsForParent] Error:', error);
        return {};
    }
};

/**
 * ✅ GET COMPLETION ASSESSMENT - Phụ huynh xem đánh giá trẻ hoàn thành chương trình
 */
const getCompletionAssessment = async (academicYearId, classId, userId) => {
    try {
        console.log('📋 [ParentChildren getCompletionAssessment] Starting:', {
            academicYearId,
            classId,
            userId,
        });

        // ✅ 1. Lấy thông tin phụ huynh
        const parent = await UserModel.findOne({
            _id: userId,
            role: 'phu_huynh',
            _destroy: false,
        })
            .select('schoolId studentId')
            .lean();

        if (!parent) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin phụ huynh');
        }

        if (!parent.studentId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản chưa được liên kết với học sinh');
        }

        // ✅ 2. Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: parent.schoolId,
            _destroy: false,
        })
            .select('fromYear toYear status')
            .lean();

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học');
        }

        // ✅ 3. Kiểm tra lớp học của con trong năm học này
        const classRecord = await ChildrenByClassModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        })
            .populate({
                path: 'classId',
                select: 'name grade ageGroup homeRoomTeacher',
                populate: {
                    path: 'homeRoomTeacher',
                    select: 'fullName', // ✅ ADD: Populate GVCN
                },
            })
            .lean();

        if (!classRecord || !classRecord.classId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Học sinh không học lớp này trong năm học đã chọn');
        }

        const classData = {
            _id: classRecord.classId._id,
            name: classRecord.classId.name,
            grade: classRecord.classId.grade,
            ageGroup: classRecord.classId.ageGroup,
            homeRoomTeacher: classRecord.classId.homeRoomTeacher?.fullName || null, // ✅ ADD
        };

        // ✅ 4. Lấy thông tin học sinh
        const student = await ChildrenManagementModel.findById(parent.studentId)
            .select('fullName studentCode status avatar gender birthDate')
            .lean();

        if (!student) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin học sinh');
        }

        // ✅ 5. Lấy đánh giá hoàn thành chương trình (nếu có)
        const evaluation = await ChildrenProgramCompleteModel.findOne({
            schoolId: parent.schoolId,
            academicYearId,
            classId,
            studentId: parent.studentId,
            _destroy: false,
        })
            .populate('createdBy', 'fullName')
            .populate('lastUpdatedBy', 'fullName')
            .select('assessmentDetails note createdBy lastUpdatedBy createdAt updatedAt')
            .lean();

        // ✅ 6. Fetch target details (nếu có đánh giá)
        let targetDetails = {};
        if (evaluation && evaluation.assessmentDetails.length > 0) {
            targetDetails = await fetchTargetDetailsForParent(
                parent.schoolId,
                academicYearId,
                classData.ageGroup,
                evaluation.assessmentDetails,
            );
        }

        console.log('✅ [ParentChildren getCompletionAssessment] Success:', {
            studentName: student.fullName,
            className: classData.name,
            hasEvaluation: !!evaluation,
            targetCount: Object.keys(targetDetails).length,
        });

        return {
            academicYear,
            classData,
            student,
            evaluation: evaluation || null,
            targetDetails,
        };
    } catch (error) {
        console.error('❌ [ParentChildren getCompletionAssessment] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy đánh giá hoàn thành chương trình');
    }
};

export const parentChildrenServices = {
    getSchoolInfo,
    getChildrenInfo,
    updateChildrenInfo,
    getAcademicYears,
    getStudentClassesByYear,
    getWeeklyPlan,
    getScheduleWeeks,
    getWeeklyMenu,
    getAttendance,
    getDailyAssessment,
    getWeeklyCertificate,
    getCompletionAssessment, // ✅ ADD
};
