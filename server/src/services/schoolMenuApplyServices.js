import { SchoolMenuApplyModel } from '~/models/schoolMenuApplyModel.js';
import { UserModel } from '~/models/userModel.js';
import { AcademicYearModel } from '~/models/academicYearModel.js';
import { ScheduleModel } from '~/models/scheduleModel.js';
import { SchoolMenuModel } from '~/models/schoolMenuModel.js';
import { SchoolNutritionalStandardModel } from '~/models/schoolNutritionalStandardModel.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import dayjs from 'dayjs';

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

/**
 * ✅ Helper: Kiểm tra quyền
 */
const checkPermission = (user, requiredRole = 'ban_giam_hieu') => {
    if (user.role !== requiredRole) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ Ban giám hiệu mới có quyền thực hiện thao tác này');
    }
};

/**
 * ✅ Helper: Lấy năm học active
 */
const getActiveAcademicYear = async (schoolId) => {
    const activeYear = await AcademicYearModel.findOne({
        schoolId,
        status: 'active',
        _destroy: false,
    });

    if (!activeYear) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy năm học đang hoạt động');
    }

    return activeYear;
};

/**
 * ✅ Helper: Lấy thời khóa biểu theo năm học
 */
const getScheduleByAcademicYear = async (schoolId, academicYearId) => {
    const schedule = await ScheduleModel.findOne({
        schoolId,
        academicYearId,
        _destroy: false,
    });

    if (!schedule) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thời khóa biểu cho năm học này');
    }

    return schedule;
};

/**
 * ✅ Helper: Kiểm tra tuần có ngày làm việc (T2-T6) không bị nghỉ hết không
 */
const hasWorkingDays = (week, holidays) => {
    if (!week || !week.startDate || !week.endDate) {
        console.warn('⚠️ Week missing startDate or endDate:', week?.weekNumber);
        return false;
    }

    const startDate = dayjs(week.startDate);
    const endDate = dayjs(week.endDate);

    let currentDate = startDate;
    let workingDaysCount = 0;

    // Duyệt qua tất cả các ngày trong tuần
    while (currentDate.isSameOrBefore(endDate, 'day')) {
        const dayOfWeek = currentDate.day(); // 0=Sun, 1=Mon, ..., 6=Sat

        // Chỉ kiểm tra Thứ 2-6 (Monday=1 to Friday=5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            const isHoliday = holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);

            if (!isHoliday) {
                workingDaysCount++;
            }
        }

        currentDate = currentDate.add(1, 'day');
    }

    console.log(`📅 Week ${week.weekNumber}: ${workingDaysCount} working days (Mon-Fri, excluding holidays)`);
    return workingDaysCount > 0;
};

/**
 * ✅ Tạo thực đơn áp dụng mới
 */
const createNew = async (data, userId) => {
    try {
        console.log('📥 [SchoolMenuApply createNew] Starting');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được tạo
        checkPermission(user);

        const { ageGroup, weekNumber, dayOfWeek, menuId } = data;

        // ✅ Lấy năm học active
        const activeYear = await getActiveAcademicYear(user.schoolId);

        // ✅ Lấy thời khóa biểu
        const schedule = await getScheduleByAcademicYear(user.schoolId, activeYear._id);

        // ✅ Kiểm tra tuần có tồn tại không
        const weekData = schedule.weeks.find((w) => w.weekNumber === weekNumber);
        if (!weekData) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Tuần không hợp lệ');
        }

        // ✅ Tính toán ngày dựa trên dayOfWeek
        const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
        if (dayIndex === -1) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Ngày không hợp lệ');
        }

        const targetDate = dayjs(weekData.startDate).add(dayIndex, 'day');

        // ✅ Kiểm tra ngày có bị nghỉ không
        const holidays = schedule.holidays || [];
        const isHoliday = holidays.some(
            (holiday) => dayjs(holiday).format('YYYY-MM-DD') === targetDate.format('YYYY-MM-DD'),
        );

        if (isHoliday) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `${dayOfWeek} trong tuần ${weekNumber} đã được cấu hình nghỉ`);
        }

        // ✅ Kiểm tra nhóm trẻ có tồn tại không
        const standardExists = await SchoolNutritionalStandardModel.findOne({
            schoolId: user.schoolId,
            ageGroup,
            _destroy: false,
        });

        if (!standardExists) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Nhóm trẻ không hợp lệ');
        }

        // ✅ Kiểm tra thực đơn có tồn tại và phù hợp không
        const menu = await SchoolMenuModel.findOne({
            _id: menuId,
            schoolId: user.schoolId,
            ageGroup,
            _ready: true,
            _destroy: false,
        });

        if (!menu) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Thực đơn không hợp lệ hoặc chưa đạt chuẩn (_ready: true)');
        }

        // ✅ Kiểm tra trùng lặp
        const existingApply = await SchoolMenuApplyModel.findOne({
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            ageGroup,
            weekNumber,
            dayOfWeek,
            _destroy: false,
        });

        if (existingApply) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                `Đã có thực đơn áp dụng cho ${dayOfWeek} tuần ${weekNumber} của ${ageGroup}`,
            );
        }

        // ✅ Tạo snapshot thực đơn
        const menuSnapshot = {
            menuName: menu.menuName,
            numberOfChildren: menu.numberOfChildren,
            meals: menu.meals,
        };

        // ✅ Tạo mới
        const newMenuApply = new SchoolMenuApplyModel({
            schoolId: user.schoolId,
            academicYearId: activeYear._id,
            ageGroup,
            weekNumber,
            dayOfWeek,
            date: targetDate.toDate(),
            menuId,
            menuSnapshot,
            createdBy: userId,
            lastUpdatedBy: userId,
        });

        await newMenuApply.save();

        const populated = await SchoolMenuApplyModel.findById(newMenuApply._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('menuId', 'menuName')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [SchoolMenuApply createNew] Created successfully');
        return populated;
    } catch (error) {
        console.error('❌ [SchoolMenuApply createNew] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi tạo thực đơn áp dụng: ' + error.message);
    }
};

/**
 * ✅ Lấy danh sách thực đơn áp dụng
 */
const getAll = async (query, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const { page = 1, limit = 100, academicYearId, ageGroup, weekNumber } = query;

        // ✅ Nếu không truyền academicYearId, lấy năm học active
        let targetYearId = academicYearId;
        if (!targetYearId) {
            const activeYear = await getActiveAcademicYear(user.schoolId);
            targetYearId = activeYear._id.toString();
        }

        const filter = {
            schoolId: user.schoolId,
            academicYearId: new mongoose.Types.ObjectId(targetYearId),
            _destroy: false,
        };

        if (ageGroup) filter.ageGroup = ageGroup;
        if (weekNumber) filter.weekNumber = Number(weekNumber);

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            SchoolMenuApplyModel.find(filter)
                .populate('academicYearId', 'fromYear toYear status')
                .populate('menuId', 'menuName')
                .populate('createdBy', 'fullName username')
                .populate('lastUpdatedBy', 'fullName username')
                .sort({ weekNumber: 1, date: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            SchoolMenuApplyModel.countDocuments(filter),
        ]);

        return {
            items,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit),
            },
        };
    } catch (error) {
        console.error('❌ [SchoolMenuApply getAll] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách thực đơn áp dụng');
    }
};

/**
 * ✅ Lấy chi tiết thực đơn áp dụng
 */
const getDetails = async (id, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const menuApply = await SchoolMenuApplyModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        })
            .populate('academicYearId', 'fromYear toYear status')
            .populate('menuId')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        if (!menuApply) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực đơn áp dụng');
        }

        return menuApply;
    } catch (error) {
        console.error('❌ [SchoolMenuApply getDetails] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy chi tiết thực đơn áp dụng');
    }
};

/**
 * ✅ Cập nhật thực đơn áp dụng
 */
const update = async (id, data, userId) => {
    try {
        console.log('📝 [SchoolMenuApply update] Starting');

        const user = await UserModel.findById(userId).select('schoolId role _id');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // ✅ Chỉ BGH mới được cập nhật
        checkPermission(user);

        const existing = await SchoolMenuApplyModel.findOne({
            _id: id,
            schoolId: user.schoolId,
            _destroy: false,
        });

        if (!existing) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực đơn áp dụng');
        }

        // ✅ Kiểm tra năm học phải đang active
        const academicYear = await AcademicYearModel.findById(existing.academicYearId);
        if (!academicYear || academicYear.status !== 'active') {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                'Chỉ được cập nhật thực đơn áp dụng trong năm học đang hoạt động',
            );
        }

        const { menuId } = data;

        // ✅ Nếu thay đổi menuId
        if (menuId && menuId !== existing.menuId.toString()) {
            const menu = await SchoolMenuModel.findOne({
                _id: menuId,
                schoolId: user.schoolId,
                ageGroup: existing.ageGroup,
                _ready: true,
                _destroy: false,
            });

            if (!menu) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Thực đơn không hợp lệ hoặc chưa đạt chuẩn (_ready: true)');
            }

            existing.menuId = menuId;
            existing.menuSnapshot = {
                menuName: menu.menuName,
                numberOfChildren: menu.numberOfChildren,
                meals: menu.meals,
            };
        }

        existing.lastUpdatedBy = userId;
        await existing.save();

        const updated = await SchoolMenuApplyModel.findById(existing._id)
            .populate('academicYearId', 'fromYear toYear status')
            .populate('menuId', 'menuName')
            .populate('createdBy', 'fullName username')
            .populate('lastUpdatedBy', 'fullName username')
            .lean();

        console.log('✅ [SchoolMenuApply update] Updated successfully');
        return updated;
    } catch (error) {
        console.error('❌ [SchoolMenuApply update] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi cập nhật thực đơn áp dụng');
    }
};

/**
 * ✅ Xóa thực đơn áp dụng
 */
const deleteMenuApply = async (id, userId) => {
    try {
        console.log('🗑️ [SchoolMenuApply delete HARD] Starting');

        // 1️⃣ Lấy user + schoolId + role
        const user = await UserModel.findById(userId).select('schoolId role');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        // 2️⃣ Chỉ BGH mới được xóa
        checkPermission(user);

        // 3️⃣ Tìm thực đơn áp dụng (KHÔNG dùng _destroy nữa)
        const existing = await SchoolMenuApplyModel.findOne({
            _id: id,
            schoolId: user.schoolId,
        });

        if (!existing) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thực đơn áp dụng');
        }

        // 4️⃣ Kiểm tra năm học đang active
        const academicYear = await AcademicYearModel.findById(existing.academicYearId);
        if (!academicYear || academicYear.status !== 'active') {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Chỉ được xóa thực đơn áp dụng trong năm học đang hoạt động');
        }

        // 5️⃣ 🔥 HARD DELETE – xóa khỏi database
        await SchoolMenuApplyModel.deleteOne({ _id: existing._id });

        console.log('✅ [SchoolMenuApply delete HARD] Deleted successfully');
        return { message: 'Xóa thực đơn áp dụng thành công' };
    } catch (error) {
        console.error('❌ [SchoolMenuApply delete HARD] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi xóa thực đơn áp dụng');
    }
};

/**
 * ✅ Lấy danh sách tuần khả dụng (có ít nhất 1 ngày làm việc T2-T6)
 */
const getAvailableWeeks = async (academicYearId, userId) => {
    try {
        console.log('📅 [SchoolMenuApply getAvailableWeeks] Starting with:', academicYearId);

        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        let targetYearId = academicYearId;
        if (!targetYearId) {
            const activeYear = await getActiveAcademicYear(user.schoolId);
            targetYearId = activeYear._id;
        }

        const schedule = await getScheduleByAcademicYear(user.schoolId, targetYearId);

        console.log('📋 Schedule found, total weeks:', schedule.weeks?.length || 0);

        // ✅ Kiểm tra schedule.weeks tồn tại
        if (!schedule.weeks || schedule.weeks.length === 0) {
            console.log('⚠️ No weeks found in schedule');
            return { weeks: [] };
        }

        const holidays = schedule.holidays || [];
        console.log('🎉 Total holidays:', holidays.length);

        // ✅ Filter weeks: chỉ lấy tuần có ít nhất 1 ngày làm việc (T2-T6, không nghỉ)
        const availableWeeks = schedule.weeks
            .filter((week) => hasWorkingDays(week, holidays))
            .map((week) => ({
                weekNumber: week.weekNumber,
                startDate: week.startDate,
                endDate: week.endDate,
            }));

        console.log('✅ Available weeks:', availableWeeks.length);
        return { weeks: availableWeeks };
    } catch (error) {
        console.error('❌ [SchoolMenuApply getAvailableWeeks] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách tuần');
    }
};

/**
 * ✅ Lấy danh sách ngày khả dụng trong tuần
 */
const getAvailableDays = async (academicYearId, weekNumber, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        let targetYearId = academicYearId;
        if (!targetYearId) {
            const activeYear = await getActiveAcademicYear(user.schoolId);
            targetYearId = activeYear._id;
        }

        const schedule = await getScheduleByAcademicYear(user.schoolId, targetYearId);

        const weekData = schedule.weeks.find((w) => w.weekNumber === Number(weekNumber));
        if (!weekData) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Tuần không hợp lệ');
        }

        const holidays = schedule.holidays || [];
        const availableDays = [];

        const startDate = dayjs(weekData.startDate);
        const endDate = dayjs(weekData.endDate);

        let currentDate = startDate;

        while (currentDate.isSameOrBefore(endDate, 'day')) {
            const dayOfWeek = currentDate.day(); // 0=Sun, 1=Mon, ..., 6=Sat

            // Chỉ lấy Thứ 2-6
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const dateStr = currentDate.format('YYYY-MM-DD');
                const isHoliday = holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);

                if (!isHoliday) {
                    availableDays.push({
                        dayOfWeek: DAYS_OF_WEEK[dayOfWeek - 1],
                        date: currentDate.toDate(),
                    });
                }
            }

            currentDate = currentDate.add(1, 'day');
        }

        return { days: availableDays };
    } catch (error) {
        console.error('❌ [SchoolMenuApply getAvailableDays] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách ngày');
    }
};

/**
 * ✅ Lấy danh sách thực đơn khả dụng theo nhóm trẻ
 */
const getAvailableMenus = async (ageGroup, userId) => {
    try {
        const user = await UserModel.findById(userId).select('schoolId');
        if (!user || !user.schoolId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }

        const menus = await SchoolMenuModel.find({
            schoolId: user.schoolId,
            ageGroup,
            _ready: true,
            _destroy: false,
        })
            .select('menuName ageGroup numberOfChildren')
            .sort({ menuName: 1 })
            .lean();

        return { menus };
    } catch (error) {
        console.error('❌ [SchoolMenuApply getAvailableMenus] Error:', error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi lấy danh sách thực đơn');
    }
};

export const schoolMenuApplyServices = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteMenuApply,
    getAvailableWeeks,
    getAvailableDays,
    getAvailableMenus,
};
