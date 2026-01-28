// server/src/controllers/parentChildrenController.js

import { StatusCodes } from 'http-status-codes';
import { parentChildrenServices } from '~/services/parentChildrenServices.js';

const getSchoolInfo = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentChildrenServices.getSchoolInfo(userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getChildrenInfo = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentChildrenServices.getChildrenInfo(userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin học sinh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateChildrenInfo = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentChildrenServices.updateChildrenInfo(userId, req.body);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thông tin học sinh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAcademicYears = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await parentChildrenServices.getAcademicYears(userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getStudentClassesByYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await parentChildrenServices.getStudentClassesByYear(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getWeeklyPlan = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, classId, weekNumber } = req.query;
        const result = await parentChildrenServices.getWeeklyPlan(academicYearId, classId, weekNumber, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy kế hoạch giáo dục thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getScheduleWeeks = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await parentChildrenServices.getScheduleWeeks(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách tuần thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getWeeklyMenu = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, classId, weekNumber } = req.query;
        const result = await parentChildrenServices.getWeeklyMenu(academicYearId, classId, weekNumber, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thực đơn hằng tuần thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAttendance = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, classId, weekNumber } = req.query;
        const result = await parentChildrenServices.getAttendance(academicYearId, classId, weekNumber, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin điểm danh thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const parentChildrenController = {
    getSchoolInfo,
    getChildrenInfo,
    updateChildrenInfo,
    getAcademicYears,
    getStudentClassesByYear,
    getWeeklyPlan,
    getScheduleWeeks,
    getWeeklyMenu,
    getAttendance, // ✅ ADD
};
