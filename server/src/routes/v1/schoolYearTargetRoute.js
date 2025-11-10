import express from 'express';
import { schoolYearTargetValidation } from '~/validations/schoolYearTargetValidation.js';
import { schoolYearTargetController } from '~/controllers/schoolYearTargetController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

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
    schoolYearTargetController.copyFromYear,
);

// ✅ API copy từ hệ thống
Router.route('/copy-from-system').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_YEAR_TARGET]),
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
        schoolYearTargetController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_YEAR_TARGET]),
        schoolYearTargetController.deleteTarget,
    );

export const schoolYearTargetRoute = Router;
