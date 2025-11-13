// server/src/routes/v1/weeklyPlanRoute.js

import express from 'express';
import { weeklyPlanController } from '~/controllers/weeklyPlanController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ API: Lấy danh sách lớp theo năm học được chọn
Router.route('/accessible-classes-by-year').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MONTHLY_PLAN]),
    weeklyPlanController.getAccessibleClassListByYear,
);

// API lấy kế hoạch theo lớp và tuần
Router.route('/by-class-week').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MONTHLY_PLAN]),
    weeklyPlanController.getWeeklyPlanByClassAndWeek,
);

// API cập nhật kế hoạch chi tiết cho 1 ngày
Router.route('/daily').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_MONTHLY_PLAN]),
    weeklyPlanController.updateDailyPlan,
);

export const weeklyPlanRoute = Router;
