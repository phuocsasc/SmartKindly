// server/src/controllers/dashboardController.js

import { StatusCodes } from 'http-status-codes';
import { dashboardServices } from '~/services/dashboardServices.js';

// ✅ Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await dashboardServices.getDashboardStats(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thống kê dashboard thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Get available academic years
const getAvailableYears = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await dashboardServices.getAvailableYears(userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách năm học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Get available weeks
const getAvailableWeeks = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await dashboardServices.getAvailableWeeks(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách tuần thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Get accessible classes
const getAccessibleClasses = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await dashboardServices.getAccessibleClasses(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const dashboardController = {
    getDashboardStats,
    getAvailableYears,
    getAvailableWeeks,
    getAccessibleClasses, // ✅ ADD
};
