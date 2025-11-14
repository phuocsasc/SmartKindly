// server/src/services/scheduleServices.js

import { WeeklyPlanModel } from '~/models/weeklyPlanModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { UserModel } from '~/models/userModel.js';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';

/**
 * ✅ Helper: Tính toán các tuần trong năm học
 */
const calculateWeeks = (sem1StartDate, sem2EndDate) => {
    const weeks = [];
    let currentDate = new Date(sem1StartDate);
    const endDate = new Date(sem2EndDate);
    let weekNumber = 1;

    // Set currentDate to Monday
    const dayOfWeek = currentDate.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + daysUntilMonday);

    while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 4); // Thứ 6

        if (weekEnd > endDate) {
            weekEnd.setTime(endDate.getTime());
        }

        weeks.push({
            weekNumber,
            startDate: weekStart,
            endDate: weekEnd,
            activityPeriods: [],
        });

        weekNumber++;
        currentDate.setDate(currentDate.getDate() + 7); // Next Monday
    }

    return weeks;
};

/**
 * ✅ Helper: Kiểm tra xem đã có Weekly Plan nào có nội dung chưa
 */
const hasExistingWeeklyPlanContent = async (schoolId, academicYearId) => {
    try {
        console.log(
            '🔍 [hasExistingWeeklyPlanContent] Checking for schoolId:',
            schoolId,
            'academicYearId:',
            academicYearId,
        );

        // Tìm tất cả weekly plans trong năm học
        const weeklyPlans = await WeeklyPlanModel.find({
            schoolId,
            academicYearId,
            _destroy: false,
        }).lean();

        console.log(`📋 [hasExistingWeeklyPlanContent] Found ${weeklyPlans.length} weekly plans`);

        // Kiểm tra xem có plan nào có nội dung không
        for (const plan of weeklyPlans) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

            for (const day of days) {
                const activities = plan[day] || [];

                // Kiểm tra xem có activity nào có detailedContent không
                const hasContent = activities.some(
                    (activity) => activity.detailedContent && activity.detailedContent.trim().length > 0,
                );

                if (hasContent) {
                    console.log(`✅ [hasExistingWeeklyPlanContent] Found content in plan ${plan._id} on ${day}`);
                    return true;
                }
            }
        }

        console.log('📋 [hasExistingWeeklyPlanContent] No content found');
        return false;
    } catch (error) {
        console.error('❌ [hasExistingWeeklyPlanContent] Error:', error);
        throw error;
    }
};

/**
 * ✅ Helper: Đồng bộ activity periods từ schedule sang weekly plans
 */
const syncWeeklyPlansWithSchedule = async (scheduleId, newActivityPeriods) => {
    try {
        console.log('🔄 [syncWeeklyPlansWithSchedule] Starting sync for scheduleId:', scheduleId);

        const schedule = await ScheduleModel.findById(scheduleId).lean();
        if (!schedule) return;

        // Lấy tất cả weekly plans liên quan đến schedule này
        const weeklyPlans = await WeeklyPlanModel.find({
            schoolId: schedule.schoolId,
            academicYearId: schedule.academicYearId,
            scheduleId: schedule._id,
            _destroy: false,
        });

        console.log(`📋 [syncWeeklyPlansWithSchedule] Found ${weeklyPlans.length} weekly plans to sync`);

        // Update từng weekly plan
        for (const plan of weeklyPlans) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

            for (const day of days) {
                // Map activity periods mới
                plan[day] = newActivityPeriods.map((period) => ({
                    activityPeriodId: period._id || period.activityPeriodId,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    description: period.description,
                    detailedContent: '', // ✅ Reset content vì mốc thời gian đã thay đổi
                }));
            }

            await plan.save();
        }

        console.log(`✅ [syncWeeklyPlansWithSchedule] Synced ${weeklyPlans.length} weekly plans successfully`);
    } catch (error) {
        console.error('❌ [syncWeeklyPlansWithSchedule] Error:', error);
        throw error;
    }
};

/**
 * ✅ Tự động tạo thời khóa biểu khi tạo năm học mới
 */
const initializeSchedule = async (data, userId) => {
    try {
        console.log('📋 [Schedule initializeSchedule] Starting with data:', data);
        const { academicYearId } = data;

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được tạo
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền tạo thời khóa biểu');
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra năm học
        const academicYear = await AcademicYearModel.findOne({
            _id: academicYearId,
            schoolId,
            status: 'active',
            _destroy: false,
        });

        if (!academicYear) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Chỉ có thể tạo thời khóa biểu cho năm học đang hoạt động');
        }

        // ✅ Kiểm tra đã có thời khóa biểu chưa
        const existingSchedule = await ScheduleModel.findOne({
            schoolId,
            academicYearId,
            _destroy: false,
        });

        if (existingSchedule) {
            throw new ApiError(StatusCodes.CONFLICT, 'Năm học này đã có thời khóa biểu');
        }

        // ✅ Lấy thời gian từ năm học
        const sem1 = academicYear.semesters.find((s) => s.name === 'Học kì I');
        const sem2 = academicYear.semesters.find((s) => s.name === 'Học kì II');

        if (!sem1 || !sem2) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Năm học chưa có đủ thông tin học kỳ');
        }

        // ✅ Tính toán các tuần
        const weeks = calculateWeeks(sem1.startDate, sem2.endDate);

        // ✅ Tạo thời khóa biểu
        const newSchedule = new ScheduleModel({
            schoolId,
            academicYearId,
            weeks,
            createdBy: userId,
        });

        await newSchedule.save();

        const populated = await ScheduleModel.findById(newSchedule._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('createdBy', 'fullName username')
            .lean();

        console.log('✅ [Schedule initializeSchedule] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [Schedule initializeSchedule] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi khởi tạo thời khóa biểu: ' + error.message);
    }
};

/**
 * ✅ Lấy thời khóa biểu theo năm học
 */
const getByAcademicYear = async (academicYearId, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const schedule = await ScheduleModel.findOne({
            schoolId: user.schoolId,
            academicYearId,
            _destroy: false,
        })
            .populate('academicYearId', 'fromYear toYear status semesters')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!schedule) {
            return null;
        }

        return schedule;
    } catch (error) {
        console.error('❌ [Schedule getByAcademicYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy thời khóa biểu');
    }
};

/**
 * ✅ Cập nhật mốc hoạt động cho TẤT CẢ các tuần
 */
const updateActivityPeriods = async (scheduleId, data, userId) => {
    try {
        console.log('📋 [Schedule updateActivityPeriods] Starting with data:', data);
        const { activityPeriods } = data;

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được cập nhật
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền cập nhật thời khóa biểu');
        }

        const schedule = await ScheduleModel.findOne({
            _id: scheduleId,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu');
        }

        // ✅ Chỉ cập nhật trong năm học đang active
        if (schedule.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể cập nhật thời khóa biểu của năm học đang hoạt động');
        }

        // ✅ Kiểm tra xem đã có Weekly Plan nào có nội dung chưa
        const hasContent = await hasExistingWeeklyPlanContent(user.schoolId, schedule.academicYearId._id);

        if (hasContent) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                'Không thể cập nhật thời khóa biểu vì đã có giáo viên lên kế hoạch chi tiết theo tuần. Vui lòng xóa hết nội dung kế hoạch trước khi thay đổi mốc hoạt động.',
            );
        }

        // ✅ Áp dụng mốc hoạt động cho TẤT CẢ các tuần
        schedule.weeks.forEach((week) => {
            week.activityPeriods = activityPeriods.map((period, index) => ({
                startTime: period.startTime,
                endTime: period.endTime,
                description: period.description,
                order: index + 1,
            }));
        });

        schedule.lastUpdatedBy = userId;
        await schedule.save();

        // ✅ Đồng bộ sang Weekly Plans
        await syncWeeklyPlansWithSchedule(scheduleId, schedule.weeks[0].activityPeriods);

        const updated = await ScheduleModel.findById(scheduleId)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [Schedule updateActivityPeriods] Updated successfully for all weeks');
        return {
            schedule: updated,
            message: `Đã cập nhật mốc hoạt động cho ${schedule.weeks.length} tuần và đồng bộ kế hoạch chi tiết`,
        };
    } catch (error) {
        console.error('❌ [Schedule updateActivityPeriods] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật mốc hoạt động: ' + error.message);
    }
};

/**
 * ✅ Xóa mốc hoạt động của TẤT CẢ các tuần
 */
const deleteActivityPeriods = async (scheduleId, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được xóa
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền xóa mốc hoạt động');
        }

        const schedule = await ScheduleModel.findOne({
            _id: scheduleId,
            schoolId: user.schoolId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!schedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu');
        }

        if (schedule.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể xóa mốc hoạt động của năm học đang hoạt động');
        }

        // ✅ Xóa mốc hoạt động của TẤT CẢ các tuần
        schedule.weeks.forEach((week) => {
            week.activityPeriods = [];
        });

        schedule.lastUpdatedBy = userId;
        await schedule.save();

        return { message: `Đã xóa mốc hoạt động của ${schedule.weeks.length} tuần` };
    } catch (error) {
        console.error('❌ [Schedule deleteActivityPeriods] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa mốc hoạt động');
    }
};

/**
 * ✅ Copy mốc hoạt động từ năm học cũ
 */
const copyActivityPeriodsFromYear = async (data, userId) => {
    try {
        console.log('📋 [Schedule copyActivityPeriodsFromYear] Starting with data:', data);
        const { fromAcademicYearId, toAcademicYearId } = data;

        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ ban giám hiệu mới được copy
        if (user.role !== 'ban_giam_hieu') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ ban giám hiệu mới có quyền copy thời khóa biểu');
        }

        const schoolId = user.schoolId;

        // ✅ Kiểm tra năm học nguồn
        const sourceSchedule = await ScheduleModel.findOne({
            schoolId,
            academicYearId: fromAcademicYearId,
            _destroy: false,
        });

        if (!sourceSchedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu của năm học nguồn');
        }

        // ✅ Kiểm tra năm học đích
        const targetSchedule = await ScheduleModel.findOne({
            schoolId,
            academicYearId: toAcademicYearId,
            _destroy: false,
        }).populate('academicYearId', 'status');

        if (!targetSchedule) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu của năm học đích');
        }

        if (targetSchedule.academicYearId.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ có thể copy vào năm học đang hoạt động');
        }

        // ✅ Kiểm tra xem đã có Weekly Plan nào có nội dung chưa
        const hasContent = await hasExistingWeeklyPlanContent(schoolId, toAcademicYearId);

        if (hasContent) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                'Không thể copy thời khóa biểu vì đã có giáo viên lên kế hoạch chi tiết theo tuần. Vui lòng xóa hết nội dung kế hoạch trước khi copy.',
            );
        }

        // ✅ Copy mốc hoạt động từ tuần đầu tiên của năm nguồn
        const sourceFirstWeek = sourceSchedule.weeks[0];
        if (!sourceFirstWeek || sourceFirstWeek.activityPeriods.length === 0) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Năm học nguồn chưa có mốc hoạt động nào');
        }

        const sourceActivityPeriods = sourceFirstWeek.activityPeriods;

        // ✅ Áp dụng cho tất cả các tuần trong năm đích
        targetSchedule.weeks.forEach((week) => {
            week.activityPeriods = sourceActivityPeriods.map((period, index) => ({
                startTime: period.startTime,
                endTime: period.endTime,
                description: period.description,
                order: index + 1,
            }));
        });

        targetSchedule.lastUpdatedBy = userId;
        await targetSchedule.save();

        // ✅ Đồng bộ sang Weekly Plans
        await syncWeeklyPlansWithSchedule(targetSchedule._id, targetSchedule.weeks[0].activityPeriods);

        const updated = await ScheduleModel.findById(targetSchedule._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [Schedule copyActivityPeriodsFromYear] Copied successfully');
        return {
            schedule: updated,
            message: `Đã copy ${sourceActivityPeriods.length} mốc hoạt động cho ${targetSchedule.weeks.length} tuần và đồng bộ kế hoạch chi tiết`,
        };
    } catch (error) {
        console.error('❌ [Schedule copyActivityPeriodsFromYear] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi copy thời khóa biểu: ' + error.message);
    }
};

export const scheduleServices = {
    initializeSchedule,
    getByAcademicYear,
    updateActivityPeriods,
    copyActivityPeriodsFromYear,
    deleteActivityPeriods,
};
