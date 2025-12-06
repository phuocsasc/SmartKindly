import express from 'express';
import { personnelRecordValidation } from '~/validations/personnelRecordValidation.js';
import { personnelRecordController } from '~/controllers/personnelRecordController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Import bulk
Router.post(
    '/import',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_PERSONNEL_RECORDS]),
    personnelRecordController.importBulk,
);

// API lấy danh sách và tạo mới hồ sơ cán bộ
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_PERSONNEL_RECORDS]),
        personnelRecordController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_PERSONNEL_RECORDS]),
        personnelRecordValidation.createNew,
        personnelRecordController.createNew,
    );

// API chi tiết, cập nhật, xóa hồ sơ cán bộ
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_PERSONNEL_RECORDS]),
        personnelRecordController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_PERSONNEL_RECORDS]),
        personnelRecordValidation.update,
        personnelRecordController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_PERSONNEL_RECORDS]),
        personnelRecordController.deleteRecord,
    );

export const personnelRecordRoute = Router;
