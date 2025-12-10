// server/src/routes/v1/scheduleRoute.js

import express from 'express';
import { scheduleValidation } from '~/validations/scheduleValidation.js';
import { scheduleController } from '~/controllers/scheduleController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// API khởi tạo thời khóa biểu cho năm học
Router.route('/initialize').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_SCHEDULE]),
    scheduleValidation.initializeSchedule,
    scheduleController.initializeSchedule,
);

// API copy mốc hoạt động từ năm học cũ
Router.route('/copy-from-year').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_SCHEDULE]),
    scheduleController.copyActivityPeriodsFromYear,
);

// API lấy thời khóa biểu theo năm học
Router.route('/by-academic-year').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_SCHEDULE]),
    scheduleController.getByAcademicYear,
);

// ✅ API cấu hình ngày nghỉ
Router.route('/:id/holidays')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_SCHEDULE]),
        scheduleController.getHolidays,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHEDULE]),
        // ✅ Audit log cho cấu hình ngày nghỉ
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.SCHEDULE, (req, body) => {
            const yearInfo = body.academicYearInfo;
            const count = body.totalHolidays || 0;
            return `Cấu hình ${count} ngày nghỉ cho năm học "${yearInfo}"`;
        }),
        scheduleController.updateHolidays,
    );

// ✅ API cập nhật mốc hoạt động cho TẤT CẢ các tuần (không cần weekNumber)
Router.route('/:id/activity-periods').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHEDULE]),
    scheduleValidation.updateActivityPeriods,
    // ✅ Audit log cho cập nhật
    auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.SCHEDULE, (req, body) => {
        const yearInfo = body.academicYearInfo;
        return `Cập nhật mốc hoạt động cho năm học "${yearInfo}"`;
    }),
    scheduleController.updateActivityPeriods,
);

// ✅ API xóa mốc hoạt động của TẤT CẢ các tuần (không cần weekNumber)
Router.route('/:id/activity-periods').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_SCHEDULE]),
    // ✅ Audit log cho xóa
    auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.SCHEDULE, (req, body) => {
        const yearInfo = body.academicYearInfo;
        return `Xóa mốc hoạt động của năm học "${yearInfo}"`;
    }),
    scheduleController.deleteActivityPeriods,
);

export const scheduleRoute = Router;
