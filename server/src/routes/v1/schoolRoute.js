import express from 'express';
import { schoolValidation } from '~/validations/schoolValidation.js';
import { schoolController } from '~/controllers/schoolController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
// import { setCacheHeaders } from '~/middlewares/httpCacheMiddleware';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// ✅ Route cho user trong trường xem/cập nhật thông tin trường của mình
Router.route('/my-school')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_SCHOOL_INFO]),
        // setCacheHeaders(600), // ✅ 10 phút
        schoolController.getSchoolInfo,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]),
        schoolValidation.update,
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.SCHOOL_INFO, (req, body) => {
            return `Cập nhật thông tin trường: "${body.data?.name || req.params.id}"`;
        }),
        schoolController.updateSchoolInfo,
    );

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
