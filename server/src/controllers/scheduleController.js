// server/src/controllers/scheduleController.js

import { StatusCodes } from 'http-status-codes';
import { scheduleServices } from '~/services/scheduleServices.js';

const initializeSchedule = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await scheduleServices.initializeSchedule(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Khởi tạo thời khóa biểu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getByAcademicYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await scheduleServices.getByAcademicYear(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thời khóa biểu thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateActivityPeriods = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { id } = req.params;
        const result = await scheduleServices.updateActivityPeriods(id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: result.message || 'Cập nhật mốc hoạt động thành công!',
            data: result.schedule,
        });
    } catch (error) {
        next(error);
    }
};

const copyActivityPeriodsFromYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await scheduleServices.copyActivityPeriodsFromYear(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: result.message || 'Copy thời khóa biểu thành công!',
            data: result.schedule,
        });
    } catch (error) {
        next(error);
    }
};

const deleteActivityPeriods = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { id } = req.params;
        const result = await scheduleServices.deleteActivityPeriods(id, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Get holidays configuration
 */
const getHolidays = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.jwtDecoded.id;

        const schedule = await scheduleServices.getHolidays(id, userId);

        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách ngày nghỉ thành công!',
            data: { holidays: schedule.holidays || [] },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ Update holidays configuration
 */
const updateHolidays = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { holidays } = req.body;
        const userId = req.jwtDecoded.id;

        await scheduleServices.updateHolidays(id, holidays, userId);

        res.status(StatusCodes.OK).json({
            message: 'Cấu hình ngày nghỉ thành công!',
        });
    } catch (error) {
        next(error);
    }
};

export const scheduleController = {
    initializeSchedule,
    getByAcademicYear,
    updateActivityPeriods,
    copyActivityPeriodsFromYear,
    deleteActivityPeriods,
    getHolidays,
    updateHolidays,
};
