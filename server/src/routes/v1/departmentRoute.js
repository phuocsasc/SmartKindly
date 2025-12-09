import express from 'express';
import { departmentValidation } from '~/validations/departmentValidation.js';
import { departmentController } from '~/controllers/departmentController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// API lấy danh sách cán bộ có thể chọn theo tên tổ bộ môn
Router.route('/available-managers').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_DEPARTMENT]),
    departmentController.getAvailableManagers,
);

// API copy departments từ năm học khác
Router.route('/copy-from-year').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_DEPARTMENT]),
    // ✅ Audit log cho copy
    auditLog(AUDIT_LOG_ACTIONS.COPY, AUDIT_LOG_RESOURCES.DEPARTMENT, (req, body) => {
        return `Copy ${body.data?.count || 0} tổ bộ môn từ năm học cũ`;
    }),
    departmentController.copyFromYear,
);

// API lấy danh sách và tạo mới tổ bộ môn
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_DEPARTMENT]),
        departmentController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_DEPARTMENT]),
        departmentValidation.createNew,
        // ✅ Audit log cho create
        // eslint-disable-next-line no-unused-vars
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.DEPARTMENT, (req, body) => {
            return `Tạo mới tổ bộ môn "${req.body.name}"`;
        }),
        departmentController.createNew,
    );

// API chi tiết, cập nhật, xóa tổ bộ môn
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_DEPARTMENT]),
        departmentController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_DEPARTMENT]),
        departmentValidation.update,
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.DEPARTMENT, (req, body) => {
            return `Cập nhật tổ bộ môn "${body.data?.name || req.params.id}"`;
        }),
        departmentController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_DEPARTMENT]),
        // ✅ Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.DEPARTMENT, (req, body) => {
            return `Xóa tổ bộ môn "${body.departmentName || req.params.id}"`;
        }),
        departmentController.deleteDepartment,
    );

export const departmentRoute = Router;
