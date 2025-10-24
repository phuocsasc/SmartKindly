import express from 'express';
import { departmentValidation } from '~/validations/departmentValidation';
import { departmentController } from '~/controllers/departmentController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';

const Router = express.Router();

// API lấy danh sách cán bộ có thể chọn theo tên tổ bộ môn
Router.route('/available-managers').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_DEPARTMENT]),
    departmentController.getAvailableManagers,
);

// API lấy danh sách và tạo mới tổ bộ môn
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_DEPARTMENT]),
        departmentController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_DEPARTMENT]),
        departmentValidation.createNew,
        departmentController.createNew,
    );

// API chi tiết, cập nhật, xóa tổ bộ môn
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_DEPARTMENT]),
        departmentController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_DEPARTMENT]),
        departmentValidation.update,
        departmentController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_DEPARTMENT]),
        departmentController.deleteDepartment,
    );

export const departmentRoute = Router;
