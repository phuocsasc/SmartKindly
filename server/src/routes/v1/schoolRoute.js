import express from 'express';
import { schoolValidation } from '~/validations/schoolValidation';
import { schoolController } from '~/controllers/schoolController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';

const Router = express.Router();

// API lấy danh sách và tạo mới trường học - Chỉ admin
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_SCHOOLS]),
        schoolController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_SCHOOLS]),
        schoolValidation.createNew,
        schoolController.createNew,
    );

// API chi tiết, cập nhật, xóa trường học - Chỉ admin
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_SCHOOLS]),
        schoolController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_SCHOOLS]),
        schoolValidation.update,
        schoolController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_MANAGE_SCHOOLS]),
        schoolController.deleteSchool,
    );

export const schoolRoute = Router;
