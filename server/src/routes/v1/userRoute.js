import express from 'express';
import { userController } from '~/controllers/userController';
import { userManagementController } from '~/controllers/userManagementController';
import { userValidation } from '~/validations/userValidation';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { schoolScopeMiddleware } from '~/middlewares/schoolScopeMiddleware'; // ✅ Import middleware mới
import { PERMISSIONS } from '~/config/rbacConfig';

const Router = express.Router();

// ===== Authentication APIs =====
Router.route('/login').post(userController.login);
Router.route('/me').get(authMiddleware.isAuthorized, userController.getInfoUserDetails);
Router.route('/logout').delete(userController.logout);
Router.route('/refresh_token').put(userController.refreshToken);

// ===== Forgot Password APIs (Không cần authentication) =====
Router.route('/forgot-password/send-otp').post(userValidation.forgotPassword, userController.sendOtpToEmail);
Router.route('/forgot-password/verify-otp').post(userValidation.verifyOtp, userController.verifyOtp);
Router.route('/forgot-password/reset-password').post(
    userValidation.resetPasswordWithOtp,
    userController.resetPasswordWithOtp,
);

// ===== User Management APIs =====
// API đổi mật khẩu - Tất cả user đều có thể đổi mật khẩu của chính mình
Router.route('/management/:id/change-password').put(
    authMiddleware.isAuthorized,
    userValidation.changePassword,
    userManagementController.changePassword,
);

Router.route('/management/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
    schoolScopeMiddleware.checkSchoolScopeForList, // ✅ Kiểm tra school scope
    userManagementController.deleteManyUsers,
);

Router.route('/management')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_USERS]),
        schoolScopeMiddleware.checkSchoolScopeForList, // ✅ Kiểm tra school scope
        userManagementController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_USER]),
        schoolScopeMiddleware.checkSchoolScopeForList, // ✅ Kiểm tra school scope
        userValidation.createNew,
        userManagementController.createNew,
    );

Router.route('/management/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermissionOrOwner([PERMISSIONS.VIEW_USERS]),
        schoolScopeMiddleware.checkSameSchool, // ✅ Kiểm tra cùng trường
        userManagementController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermissionOrOwner([PERMISSIONS.UPDATE_USER]),
        schoolScopeMiddleware.checkSameSchool, // ✅ Kiểm tra cùng trường
        userValidation.update,
        userManagementController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
        schoolScopeMiddleware.checkSameSchool, // ✅ Kiểm tra cùng trường
        userManagementController.deleteUser,
    );

export const userRoute = Router;
