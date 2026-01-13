// server/src/routes/v1/parentManagementRoute.js

import express from 'express';
import { parentManagementController } from '~/controllers/parentManagementController.js';
import { parentManagementValidation } from '~/validations/parentManagementValidation.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Lấy danh sách học sinh chưa có tài khoản phụ huynh
Router.route('/available-students').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_USERS]),
    parentManagementController.getAvailableStudents,
);

// ✅ Xóa nhiều phụ huynh
Router.route('/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
    parentManagementController.deleteManyParents,
);

// ✅ CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_USERS]),
        parentManagementController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_USER]),
        parentManagementValidation.createNew,
        parentManagementController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_USERS]),
        parentManagementController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_USER]),
        parentManagementValidation.update,
        parentManagementController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_USER]),
        parentManagementController.deleteParent,
    );

export const parentManagementRoute = Router;
