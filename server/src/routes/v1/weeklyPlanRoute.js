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

// ✅ API mới: Copy kế hoạch tuần hiện tại sang các tuần phía sau
Router.route('/copy-to-following-weeks').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_MONTHLY_PLAN]),
    weeklyPlanController.copyWeekToFollowingWeeks,
);

// ✅ API mới: Xóa kế hoạch chi tiết của 1 tuần
Router.route('/delete-week').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MONTHLY_PLAN]),
    weeklyPlanController.deleteWeekPlan,
);

// ✅ API mới: Xóa kế hoạch chi tiết của TẤT CẢ các tuần
Router.route('/delete-all-weeks').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MONTHLY_PLAN]),
    weeklyPlanController.deleteAllWeekPlans,
);

export const weeklyPlanRoute = Router;
