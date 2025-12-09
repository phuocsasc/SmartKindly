import express from 'express';
import { auditLogController } from '~/controllers/auditLogController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Xóa nhiều
Router.post(
    '/delete-many',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_HISTORY]),
    auditLogController.deleteManyLogs,
);

// ✅ CRUD
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_HISTORY]),
    auditLogController.getAll,
);

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_HISTORY]),
        auditLogController.getDetails,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_HISTORY]),
        auditLogController.deleteLog,
    );

export const auditLogRoute = Router;
