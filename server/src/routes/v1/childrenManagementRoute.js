import express from 'express';
import { childrenManagementController } from '~/controllers/childrenManagementController.js';
import { childrenManagementValidation } from '~/validations/childrenManagementValidation.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// ✅ Xóa nhiều trẻ
Router.route('/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_MANAGEMENT]),
    childrenManagementValidation.deleteMany,
    auditLog(AUDIT_LOG_ACTIONS.DELETE_MANY, AUDIT_LOG_RESOURCES.CHILDREN_MANAGEMENT, (req) => {
        return `Xóa ${req.body.ids?.length || 0} trẻ khỏi danh sách toàn trường`;
    }),
    childrenManagementController.deleteMany,
);

// ✅ Import bulk children
Router.route('/import-bulk').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_MANAGEMENT]),
    childrenManagementController.importBulk,
);

// ✅ CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_MANAGEMENT]),
        childrenManagementController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_MANAGEMENT]),
        childrenManagementValidation.create,
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.CHILDREN_MANAGEMENT, (req, body) => {
            const child = body.data;
            return `Thêm trẻ "${child.fullName}" (Mã: ${child.studentCode}) vào danh sách toàn trường`;
        }),
        childrenManagementController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_MANAGEMENT]),
        childrenManagementController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_MANAGEMENT]),
        childrenManagementValidation.update,
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.CHILDREN_MANAGEMENT, (req, body) => {
            const child = body.data;
            return `Cập nhật thông tin trẻ "${child.fullName}" (Mã: ${child.studentCode})`;
        }),
        childrenManagementController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_MANAGEMENT]),
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.CHILDREN_MANAGEMENT, (req, body) => {
            const info = body.data?.childInfo;
            return `Xóa trẻ "${info?.fullName}" (Mã: ${info?.studentCode}) khỏi danh sách toàn trường`;
        }),
        childrenManagementController.deleteChild,
    );

export const childrenManagementRoute = Router;
