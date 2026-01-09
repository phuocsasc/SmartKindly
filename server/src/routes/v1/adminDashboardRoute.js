// server/src/routes/v1/adminDashboardRoute.js

import express from 'express';
import { adminDashboardController } from '~/controllers/adminDashboardController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';

const Router = express.Router();

/**
 * ✅ GET ADMIN DASHBOARD STATISTICS
 * @route   GET /v1/admin/dashboard/stats
 * @access  Admin only
 */
Router.route('/stats').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission(['admin_dashboard']),
    adminDashboardController.getAdminDashboardStats,
);

export const adminDashboardRoute = Router;
