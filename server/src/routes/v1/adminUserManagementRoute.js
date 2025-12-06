import express from 'express';
import { adminUserValidation } from '~/validations/adminUserValidation.js';
import { adminUserManagementController } from '~/controllers/adminUserManagementController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// API lấy danh sách và tạo mới user - Chỉ admin
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_USERS]),
        adminUserManagementController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_USERS]),
        adminUserValidation.createNew,
        adminUserManagementController.createNew,
    );

// ✅ API xóa nhiều users
Router.route('/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_USERS]),
    adminUserManagementController.deleteManyUsers,
);

// API chi tiết, cập nhật, xóa user - Chỉ admin
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_USERS]),
        adminUserManagementController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_USERS]),
        adminUserValidation.update,
        adminUserManagementController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_USERS]),
        adminUserManagementController.deleteUser,
    );

export const adminUserManagementRoute = Router;
