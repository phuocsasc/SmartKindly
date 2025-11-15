// server/src/services/weeklyPlanServices.js

import { WeeklyPlanModel } from '~/models/weeklyPlanModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import { ClassModel } from '~/models/classModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { DepartmentModel } from '~/models/departmentModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

/**
 * ✅ Helper: Get accessible classes for user THEO NĂM HỌC CỤ THỂ
 */
const getAccessibleClasses = async (user, academicYearId) => {
    console.log('🔍 [getAccessibleClasses] Starting with:', {
        userId: user._id,
        role: user.role,
        schoolId: user.schoolId,
        academicYearId,
    });

    // Ban giám hiệu: full access
    if (user.role === 'ban_giam_hieu') {
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        })
            .select('_id')
            .lean();
        console.log('✅ [BGH] Found classes:', classes.length);
        return classes.map((c) => c._id.toString());
    }

    // ✅ Tổ trưởng: chỉ truy cập lớp trong khối được quản lý
    if (user.role === 'to_truong') {
        console.log('🔍 [TỔ TRƯỞNG] Querying departments...');

        // ✅ Tìm tất cả departments mà user này quản lý
        const departments = await DepartmentModel.find({
            schoolId: user.schoolId,
            academicYearId,
            managers: user._id,
            _destroy: false,
        })
            .select('name')
            .lean();

        console.log('📋 [TỔ TRƯỞNG] Departments found:', {
            count: departments.length,
            departments: departments.map((d) => d.name),
        });

        if (departments.length === 0) {
            console.log('⚠️ [TỔ TRƯỞNG] No departments found!');
            return [];
        }

        // ✅ Mapping: Tên khối → Nhóm tuổi (KHỚP VỚI DB)
        const ageGroupMapping = {
            'Khối Nhà Trẻ': ['3-12 tháng', '12-24 tháng', '24-36 tháng'], // ✅ Bỏ "Nhà trẻ"
            'Khối Mầm': ['3-4 tuổi'], // ✅ Bỏ "Khối mầm"
            'Khối Chồi': ['4-5 tuổi'], // ✅ Bỏ "Khối chồi"
            'Khối Lá': ['5-6 tuổi'], // ✅ Bỏ "Khối lá"
        };

        const ageGroups = [];
        departments.forEach((dept) => {
            const groups = ageGroupMapping[dept.name];
            if (groups) {
                ageGroups.push(...groups);
                console.log(`✅ [TỔ TRƯỞNG] Mapped "${dept.name}" → ${groups.join(', ')}`);
            } else {
                console.log(`⚠️ [TỔ TRƯỞNG] No mapping found for department: "${dept.name}"`);
            }
        });

        console.log('📋 [TỔ TRƯỞNG] Final age groups:', ageGroups);

        if (ageGroups.length === 0) {
            console.log('⚠️ [TỔ TRƯỞNG] No age groups mapped!');
            return [];
        }

        // ✅ Tìm tất cả lớp thuộc các nhóm tuổi này
        const classes = await ClassModel.find({
            schoolId: user.schoolId,
            academicYearId,
            ageGroup: { $in: ageGroups },
            _destroy: false,
        })
            .select('_id name ageGroup')
            .lean();

        console.log('📋 [TỔ TRƯỞNG] Classes found:', {
            count: classes.length,
            classes: classes.map((c) => ({ name: c.name, ageGroup: c.ageGroup })),
        });

        return classes.map((c) => c._id.toString());
    }

    // ✅ Giáo viên: chỉ truy cập lớp mình làm chủ nhiệm
    if (user.role === 'giao_vien') {
        const classData = await ClassModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            homeRoomTeacher: user._id,
            _destroy: false,
        })
            .select('_id')
            .lean();

        console.log('✅ [GIÁO VIÊN] Found class:', classData ? 'Yes' : 'No');
        return classData ? [classData._id.toString()] : [];
    }

    return [];
};

/**
 * ✅ Lấy danh sách lớp học có thể truy cập THEO NĂM HỌC ĐƯỢC CHỌN
 */
const getAccessibleClassListByYear = async (academicYearId, userId) => {
    try {
        console.log('📋 [getAccessibleClassListByYear] Starting with academicYearId:', academicYearId);

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Kiểm tra năm học có tồn tại không
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!academicYear) {
            return {
                classes: [],
                message: 'Không tìm thấy năm học',
            };
        }

        // ✅ Lấy danh sách lớp có thể truy cập THEO NĂM HỌC CỤ THỂ
        const accessibleClassIds = await getAccessibleClasses(user, academicYearId);

        console.log('📋 [getAccessibleClassListByYear] Accessible class IDs:', accessibleClassIds);

        if (accessibleClassIds.length === 0) {
            return {
                classes: [],
                message: 'Bạn không được phân công quản lý lớp học nào trong năm học này',
            };
        }

        const classes = await ClassModel.find({
            _id: { $in: accessibleClassIds },
            _destroy: false,
        })
            .populate('homeRoomTeacher', 'fullName username')
            .select('classId name grade ageGroup homeRoomTeacher')
            .sort({ classId: 1 })
            .lean();

        console.log('📋 [getAccessibleClassListByYear] Classes found:', classes.length);

        return {
            classes,
            academicYearId: academicYear._id,
        };
    } catch (error) {
        console.error('❌ [WeeklyPlan getAccessibleClassListByYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách lớp học');
    }
};

/**
 * ✅ Lấy kế hoạch theo lớp, tuần VÀ NĂM HỌC
 */
const getWeeklyPlanByClassAndWeek = async (classId, weekNumber, academicYearId, userId) => {
    try {
        console.log('📋 [WeeklyPlan getByClassAndWeek] Params:', { classId, weekNumber, academicYearId });

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Kiểm tra quyền truy cập lớp THEO NĂM HỌC ĐƯỢC CHỌN
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học trong năm học này');
        }

        const accessibleClassIds = await getAccessibleClasses(user, academicYearId);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập lớp học này');
        }

        // ✅ Lấy thời khóa biểu THEO NĂM HỌC ĐƯỢC CHỌN
        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
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

        // ✅ Tìm hoặc tạo weekly plan THEO NĂM HỌC ĐƯỢC CHỌN
        let weeklyPlan = await WeeklyPlanModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            classId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        })
            .populate('classId', 'classId name grade ageGroup')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        // ✅ Nếu chưa có, tự động tạo với template từ schedule (CHỈ KHI LÀ NĂM ACTIVE)
        if (!weeklyPlan && classData.academicYearId.status === 'active') {
            const templateActivities = weekData.activityPeriods.map((period) => ({
                activityPeriodId: period._id,
                startTime: period.startTime,
                endTime: period.endTime,
                description: period.description,
                detailedContent: '',
            }));

            const newPlan = new WeeklyPlanModel({
                schoolId: user.schoolId,
                academicYearId,
                classId,
                scheduleId: schedule._id,
                weekNumber: parseInt(weekNumber),
                weekStartDate: weekData.startDate,
                weekEndDate: weekData.endDate,
                monday: templateActivities,
                tuesday: templateActivities,
                wednesday: templateActivities,
                thursday: templateActivities,
                friday: templateActivities,
                createdBy: userId,
            });

            await newPlan.save();

            weeklyPlan = await WeeklyPlanModel.findById(newPlan._id)
                .populate('classId', 'classId name grade ageGroup')
                .populate('createdBy', 'fullName username')
                .lean();
        }

        return {
            weeklyPlan,
            schedule: weekData,
            isActiveYear: classData.academicYearId.status === 'active',
        };
    } catch (error) {
        console.error('❌ [WeeklyPlan getByClassAndWeek] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy kế hoạch tuần');
    }
};

/**
 * ✅ Cập nhật kế hoạch chi tiết cho 1 ngày
 */
const updateDailyPlan = async (data, userId) => {
    try {
        console.log('📋 [WeeklyPlan updateDailyPlan] Starting with data:', data);
        const { classId, weekNumber, dayOfWeek, activities } = data;

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Lấy năm học active
        const activeYear = await AcademicYearModel.findOne({
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Không có năm học đang hoạt động');
        }

        // ✅ Kiểm tra quyền truy cập lớp
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            _destroy: false,
        });

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        const accessibleClassIds = await getAccessibleClasses(user, activeYear._id);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền cập nhật lớp học này');
        }

        // ✅ Tìm weekly plan
        const weeklyPlan = await WeeklyPlanModel.findOne({
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            classId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        });

        if (!weeklyPlan) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy kế hoạch tuần');
        }

        // ✅ Cập nhật activities cho ngày cụ thể
        weeklyPlan[dayOfWeek] = activities.map((activity) => ({
            activityPeriodId: activity.activityPeriodId,
            startTime: activity.startTime,
            endTime: activity.endTime,
            description: activity.description,
            detailedContent: activity.detailedContent || '',
        }));

        weeklyPlan.lastUpdatedBy = userId;
        await weeklyPlan.save();

        const updated = await WeeklyPlanModel.findById(weeklyPlan._id)
            .populate('classId', 'classId name grade ageGroup')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [WeeklyPlan updateDailyPlan] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [WeeklyPlan updateDailyPlan] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật kế hoạch: ' + error.message);
    }
};

/**
 * ✅ Copy kế hoạch từ tuần hiện tại sang các tuần phía sau
 */
const copyWeekToFollowingWeeks = async (data, userId) => {
    try {
        console.log('📋 [WeeklyPlan copyWeekToFollowingWeeks] Starting with data:', data);
        const { classId, weekNumber } = data;

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Lấy năm học active
        const activeYear = await AcademicYearModel.findOne({
            schoolId: user.schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!activeYear) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Không có năm học đang hoạt động');
        }

        // ✅ Kiểm tra quyền truy cập lớp
        const classData = await ClassModel.findOne({
            _id: classId,
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            _destroy: false,
        });

        if (!classData) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lớp học');
        }

        const accessibleClassIds = await getAccessibleClasses(user, activeYear._id);
        if (!accessibleClassIds.includes(classId)) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền thao tác với lớp học này');
        }

        // ✅ Lấy thời khóa biểu của năm học
        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            _destroy: false,
        }).lean();

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu');
        }

        const totalWeeks = schedule.weeks.length;

        // ✅ Kiểm tra tuần hiện tại có hợp lệ không
        if (weekNumber >= totalWeeks) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Đây là tuần cuối cùng, không thể copy sang các tuần sau');
        }

        // ✅ Lấy kế hoạch tuần nguồn (tuần hiện tại)
        const sourceWeeklyPlan = await WeeklyPlanModel.findOne({
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            classId,
            weekNumber: parseInt(weekNumber),
            _destroy: false,
        }).lean();

        if (!sourceWeeklyPlan) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy kế hoạch tuần nguồn');
        }

        // ✅ Kiểm tra xem tuần nguồn có dữ liệu không
        const hasContent = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].some((day) => {
            const activities = sourceWeeklyPlan[day] || [];
            return activities.some(
                (activity) => activity.detailedContent && activity.detailedContent.trim().length > 0,
            );
        });

        if (!hasContent) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Tuần hiện tại chưa có nội dung kế hoạch nào để copy. Vui lòng thêm nội dung trước khi copy.',
            );
        }

        // ✅ Lấy danh sách tuần cần copy (từ tuần sau đến tuần cuối)
        const targetWeeks = schedule.weeks.filter((week) => week.weekNumber > weekNumber);

        console.log(`📋 [WeeklyPlan copyWeekToFollowingWeeks] Will copy to ${targetWeeks.length} weeks`);

        let copiedCount = 0;
        let createdCount = 0;

        // ✅ Copy sang từng tuần
        for (const targetWeek of targetWeeks) {
            // Kiểm tra xem tuần đích đã có weekly plan chưa
            let targetWeeklyPlan = await WeeklyPlanModel.findOne({
                schoolId: user.schoolId,
                academicYearId: activeYear._id,
                classId,
                weekNumber: targetWeek.weekNumber,
                _destroy: false,
            });

            // ✅ Copy dữ liệu từng ngày
            const copiedData = {
                monday: sourceWeeklyPlan.monday.map((activity) => ({
                    activityPeriodId: activity.activityPeriodId,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    description: activity.description,
                    detailedContent: activity.detailedContent || '',
                })),
                tuesday: sourceWeeklyPlan.tuesday.map((activity) => ({
                    activityPeriodId: activity.activityPeriodId,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    description: activity.description,
                    detailedContent: activity.detailedContent || '',
                })),
                wednesday: sourceWeeklyPlan.wednesday.map((activity) => ({
                    activityPeriodId: activity.activityPeriodId,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    description: activity.description,
                    detailedContent: activity.detailedContent || '',
                })),
                thursday: sourceWeeklyPlan.thursday.map((activity) => ({
                    activityPeriodId: activity.activityPeriodId,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    description: activity.description,
                    detailedContent: activity.detailedContent || '',
                })),
                friday: sourceWeeklyPlan.friday.map((activity) => ({
                    activityPeriodId: activity.activityPeriodId,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    description: activity.description,
                    detailedContent: activity.detailedContent || '',
                })),
                lastUpdatedBy: userId,
            };

            if (targetWeeklyPlan) {
                // ✅ Update weekly plan hiện có
                Object.assign(targetWeeklyPlan, copiedData);
                await targetWeeklyPlan.save();
                copiedCount++;
            } else {
                // ✅ Tạo mới weekly plan
                const newPlan = new WeeklyPlanModel({
                    schoolId: user.schoolId,
                    academicYearId: activeYear._id,
                    classId,
                    scheduleId: schedule._id,
                    weekNumber: targetWeek.weekNumber,
                    weekStartDate: targetWeek.startDate,
                    weekEndDate: targetWeek.endDate,
                    ...copiedData,
                    createdBy: userId,
                });

                await newPlan.save();
                createdCount++;
            }
        }

        console.log(
            `✅ [WeeklyPlan copyWeekToFollowingWeeks] Copied successfully: ${copiedCount} updated, ${createdCount} created`,
        );

        return {
            message: `Đã copy kế hoạch tuần ${weekNumber} sang ${targetWeeks.length} tuần tiếp theo (${copiedCount} tuần đã cập nhật, ${createdCount} tuần mới tạo)`,
            copiedWeeks: targetWeeks.length,
            updatedCount: copiedCount,
            createdCount: createdCount,
        };
    } catch (error) {
        console.error('❌ [WeeklyPlan copyWeekToFollowingWeeks] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi copy kế hoạch tuần: ' + error.message);
    }
};

export const weeklyPlanServices = {
    getAccessibleClassListByYear,
    getWeeklyPlanByClassAndWeek,
    updateDailyPlan,
    copyWeekToFollowingWeeks,
};
