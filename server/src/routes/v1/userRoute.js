import express from 'express';
import { userController } from '~/controllers/userController';
import { userManagementController } from '~/controllers/userManagementController';
import { userValidation } from '~/validations/userValidation';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';

const Router = express.Router();

// ===== Authentication APIs =====
Router.route('/login').post(userController.login);
Router.route('/logout').delete(userController.logout);
Router.route('/refresh_token').put(userController.refreshToken);

// ===== User Management APIs =====
Router.route('/management')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_USERS]),
        userManagementController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_USER]),
        userValidation.createNew,
        userManagementController.createNew,
    );

Router.route('/management/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
    userManagementController.deleteManyUsers,
);

Router.route('/management/:id')
    .get(
        authMiddleware.isAuthorized,
        // Cho phép user xem thông tin của chính mình HOẶC có quyền VIEW_USERS
        rbacMiddleware.isValidPermissionOrOwner([PERMISSIONS.VIEW_USERS]),
        userManagementController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        // Cho phép user tự update thông tin của chính mình HOẶC có quyền UPDATE_USER
        rbacMiddleware.isValidPermissionOrOwner([PERMISSIONS.UPDATE_USER]),
        userValidation.update,
        userManagementController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
        userManagementController.deleteUser,
    );

// API đổi mật khẩu - Tất cả user đều có thể đổi mật khẩu của chính mình
Router.route('/management/:id/change-password').put(
    authMiddleware.isAuthorized,
    userValidation.changePassword,
    userManagementController.changePassword,
);

// API reset mật khẩu - Chỉ admin
Router.route('/management/:id/reset-password').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_USER]),
    userManagementController.resetPassword,
);

export const userRoute = Router;
