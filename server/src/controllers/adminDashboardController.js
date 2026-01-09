// server/src/controllers/adminDashboardController.js

import { StatusCodes } from 'http-status-codes';
import { adminDashboardServices } from '~/services/adminDashboardServices.js';

/**
 * ✅ GET ADMIN DASHBOARD STATISTICS
 */
const getAdminDashboardStats = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await adminDashboardServices.getAdminDashboardStats(userId);

        res.status(StatusCodes.OK).json({
            message: 'Lấy thống kê dashboard admin thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const adminDashboardController = {
    getAdminDashboardStats,
};
