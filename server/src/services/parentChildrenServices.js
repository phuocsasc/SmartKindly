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
import { StatusCodes } from 'http-status-codes';

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

export const parentChildrenServices = {
    getSchoolInfo,
    getChildrenInfo,
    updateChildrenInfo,
    getAcademicYears,
    getStudentClassesByYear,
    getWeeklyPlan,
    getScheduleWeeks, // ✅ ADD
};
