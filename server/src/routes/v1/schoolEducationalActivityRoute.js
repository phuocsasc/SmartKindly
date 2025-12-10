// server/src/routes/v1/schoolEducationalActivityRoute.js

import express from 'express';
import { schoolEducationalActivityValidation } from '~/validations/schoolEducationalActivityValidation.js';
import { schoolEducationalActivityController } from '~/controllers/schoolEducationalActivityController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// API copy từ năm học cũ
Router.route('/copy-from-year').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_EDUCATION_ACTIVITY]),
    schoolEducationalActivityController.copyFromYear,
);

// API lấy danh sách và tạo mới
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_EDUCATION_ACTIVITY]),
        schoolEducationalActivityController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_EDUCATION_ACTIVITY]),
        schoolEducationalActivityValidation.createNew,
        // ✅ Audit log cho create
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.EDUCATIONAL_ACTIVITY, (req, body) => {
            const activity = body.data;
            return `Thêm hoạt động giáo dục cho mục tiêu "${activity?.targetCode || 'N/A'}" - Nhóm tuổi: ${req.body.ageGroup}`;
        }),
        schoolEducationalActivityController.createNew,
    );

// API chi tiết, cập nhật, xóa
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_EDUCATION_ACTIVITY]),
        schoolEducationalActivityController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_EDUCATION_ACTIVITY]),
        schoolEducationalActivityValidation.update,
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.EDUCATIONAL_ACTIVITY, (req, body) => {
            const activity = body.data;
            return `Cập nhật hoạt động giáo dục cho mục tiêu "${activity?.targetCode || req.params.id}" - Nhóm tuổi: ${activity?.ageGroup || 'N/A'}`;
        }),
        schoolEducationalActivityController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_EDUCATION_ACTIVITY]),
        // ✅ Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.EDUCATIONAL_ACTIVITY, (req, body) => {
            const info = body.activityInfo;
            return `Xóa hoạt động giáo dục cho mục tiêu "${info?.targetCode || req.params.id}" - Nhóm tuổi: ${info?.ageGroup || 'N/A'}`;
        }),
        schoolEducationalActivityController.deleteActivity,
    );

export const schoolEducationalActivityRoute = Router;
