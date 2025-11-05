// server/src/routes/v1/yearTargetRoute.js

import express from 'express';
import { yearTargetValidation } from '~/validations/yearTargetValidation';
import { yearTargetController } from '~/controllers/yearTargetController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';

const Router = express.Router();

// API lấy danh sách và tạo mới mục tiêu năm học
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        yearTargetController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        yearTargetValidation.createNew,
        yearTargetController.createNew,
    );

// API chi tiết, cập nhật, xóa mục tiêu năm học
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        yearTargetController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        yearTargetValidation.update,
        yearTargetController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        yearTargetController.deleteYearTarget,
    );

export const yearTargetRoute = Router;
