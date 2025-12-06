// server/src/routes/v1/educationalActivityRoute.js

import express from 'express';
import { educationalActivityValidation } from '~/validations/educationalActivityValidation.js';
import { educationalActivityController } from '~/controllers/educationalActivityController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// API lấy hoạt động giáo dục theo targetCode
Router.route('/by-target').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
    educationalActivityController.getByTargetCode,
);

// API lấy danh sách và tạo mới hoạt động giáo dục
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        educationalActivityController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        educationalActivityValidation.createNew,
        educationalActivityController.createNew,
    );

// API chi tiết, cập nhật, xóa hoạt động giáo dục
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        educationalActivityController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        educationalActivityValidation.update,
        educationalActivityController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        educationalActivityController.deleteActivity,
    );

export const educationalActivityRoute = Router;
