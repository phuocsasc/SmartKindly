import express from 'express';
import { dashboardController } from '~/controllers/dashboardController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';

const Router = express.Router();

// ✅ Get dashboard statistics
Router.route('/stats').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission(['view_dashboard']),
    dashboardController.getDashboardStats,
);

// ✅ Get available academic years
Router.route('/available-years').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission(['view_dashboard']),
    dashboardController.getAvailableYears,
);

// ✅ Get available weeks
Router.route('/available-weeks').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission(['view_dashboard']),
    dashboardController.getAvailableWeeks,
);

// ✅ Get accessible classes
Router.route('/accessible-classes').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission(['view_dashboard']),
    dashboardController.getAccessibleClasses,
);

export const dashboardRoute = Router;
