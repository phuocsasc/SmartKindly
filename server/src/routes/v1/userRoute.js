import express from 'express';
import { userController } from '~/controllers/userController';
import { userManagementController } from '~/controllers/userManagementController';
import { userValidation } from '~/validations/userValidation';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';

const Router = express.Router();

// ===== Authentication APIs =====
// API đăng nhập
Router.route('/login').post(userController.login);

// API đăng xuất
Router.route('/logout').delete(userController.logout);

// API Refresh Token - Cấp lại Access Token mới
Router.route('/refresh_token').put(userController.refreshToken);

// ===== User Management APIs (Cần xác thực và phân quyền) =====
// API lấy danh sách người dùng
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

// API xóa nhiều người dùng
Router.route('/management/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
    userManagementController.deleteManyUsers,
);

// API chi tiết, cập nhật, xóa người dùng
Router.route('/management/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_USERS]),
        userManagementController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_USER]),
        userValidation.update,
        userManagementController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
        userManagementController.deleteUser,
    );

// API đổi mật khẩu
Router.route('/management/:id/change-password').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_USER]),
    userValidation.changePassword,
    userManagementController.changePassword,
);

// API reset mật khẩu (chỉ admin)
Router.route('/management/:id/reset-password').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_USER]),
    userManagementController.resetPassword,
);

export const userRoute = Router;
