import express from 'express';
import { schoolYearTargetValidation } from '~/validations/schoolYearTargetValidation.js';
import { schoolYearTargetController } from '~/controllers/schoolYearTargetController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// API khởi tạo mục tiêu mặc định cho năm học mới
Router.route('/initialize').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_YEAR_TARGET]),
    schoolYearTargetController.initializeDefaults,
);

// API copy từ năm học cũ
Router.route('/copy-from-year').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_YEAR_TARGET]),
    // ✅ Audit log cho copy từ năm cũ
    auditLog(AUDIT_LOG_ACTIONS.COPY, AUDIT_LOG_RESOURCES.YEAR_TARGET, (req, body) => {
        const { count = 0, activitiesCount = 0 } = body.data || {};
        return `Copy ${count} mục tiêu và ${activitiesCount} hoạt động giáo dục từ năm học cũ`;
    }),
    schoolYearTargetController.copyFromYear,
);

// ✅ API copy từ hệ thống
Router.route('/copy-from-system').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_YEAR_TARGET]),
    // ✅ Audit log cho copy từ hệ thống
    auditLog(AUDIT_LOG_ACTIONS.COPY, AUDIT_LOG_RESOURCES.YEAR_TARGET, (req, body) => {
        const count = body.data?.count || 0;
        return `Copy mục tiêu của ${count} nhóm tuổi từ hệ thống (Ngân hàng dữ liệu)`;
    }),
    schoolYearTargetController.copyFromSystem,
);

// ✅ API lấy preview từ hệ thống
Router.route('/system-preview').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_YEAR_TARGET]),
    schoolYearTargetController.getSystemPreview,
);

// API lấy danh sách và tạo mới
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_YEAR_TARGET]),
        schoolYearTargetController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_YEAR_TARGET]),
        schoolYearTargetValidation.createNew,
        // ✅ Audit log cho create
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.YEAR_TARGET, (req, body) => {
            return `Tạo mới mục tiêu năm học cho nhóm tuổi "${req.body.ageGroup}"`;
        }),
        schoolYearTargetController.createNew,
    );

// API chi tiết, cập nhật, xóa
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_YEAR_TARGET]),
        schoolYearTargetController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_YEAR_TARGET]),
        schoolYearTargetValidation.update,
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.YEAR_TARGET, (req, body) => {
            const ageGroup = body.data?.ageGroup || req.params.id;
            return `Cập nhật mục tiêu năm học cho nhóm tuổi "${ageGroup}"`;
        }),
        schoolYearTargetController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_YEAR_TARGET]),
        // ✅ Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.YEAR_TARGET, (req, body) => {
            return `Xóa mục tiêu năm học "${body.targetInfo.ageGroup}" (${body.targetInfo.academicYear})`;
        }),
        schoolYearTargetController.deleteTarget,
    );

export const schoolYearTargetRoute = Router;
