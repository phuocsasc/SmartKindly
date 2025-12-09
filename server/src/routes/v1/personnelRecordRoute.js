import express from 'express';
import { personnelRecordValidation } from '~/validations/personnelRecordValidation.js';
import { personnelRecordController } from '~/controllers/personnelRecordController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';


const Router = express.Router();

// ✅ Import bulk
Router.post(
    '/import',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_PERSONNEL_RECORDS]),
    // ✅ Audit log cho import
    auditLog(AUDIT_LOG_ACTIONS.IMPORT, AUDIT_LOG_RESOURCES.PERSONNEL_RECORD, (req, body) => {
        const { created = 0, updated = 0 } = body.data || {};
        return `Import hồ sơ cán bộ: ${created} mới, ${updated} cập nhật`;
    }),
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
        // ✅ Audit log cho create
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.PERSONNEL_RECORD, (req, body) => {
            return `Tạo mới hồ sơ cán bộ "${body.data?.fullName || req.body.fullName}"`;
        }),
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
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.PERSONNEL_RECORD, (req, body) => {
            return `Cập nhật hồ sơ cán bộ "${body.data?.fullName || req.params.id}"`;
        }),
        personnelRecordController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_PERSONNEL_RECORDS]),
        // ✅ Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.PERSONNEL_RECORD, (req, body) => {
            return `Xóa hồ sơ cán bộ "${body.personnelName || req.params.id}"`;
        }),
        personnelRecordController.deleteRecord,
    );

export const personnelRecordRoute = Router;
