// server/src/routes/v1/schoolEducationalActivityRoute.js

import express from 'express';
import { schoolEducationalActivityValidation } from '~/validations/schoolEducationalActivityValidation.js';
import { schoolEducationalActivityController } from '~/controllers/schoolEducationalActivityController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// API copy từ năm học cũ
Router.route('/copy-from-year').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_EDUCATION_ACTIVITY]),
    schoolEducationalActivityController.copyFromYear,
);

// API lấy danh sách và tạo mới
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_EDUCATION_ACTIVITY]),
        schoolEducationalActivityController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_EDUCATION_ACTIVITY]),
        schoolEducationalActivityValidation.createNew,
        schoolEducationalActivityController.createNew,
    );

// API chi tiết, cập nhật, xóa
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_EDUCATION_ACTIVITY]),
        schoolEducationalActivityController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_EDUCATION_ACTIVITY]),
        schoolEducationalActivityValidation.update,
        schoolEducationalActivityController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_EDUCATION_ACTIVITY]),
        schoolEducationalActivityController.deleteActivity,
    );

export const schoolEducationalActivityRoute = Router;
