import express from 'express';
import { academicYearValidation } from '~/validations/academicYearValidation.js';
import { academicYearController } from '~/controllers/academicYearController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// API lấy danh sách và tạo mới năm học
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_ACADEMIC_YEAR]),
        academicYearController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_ACADEMIC_YEAR]),
        academicYearValidation.createNew,
        // ✅ Audit log cho create
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.ACADEMIC_YEAR, (req, body) => {
            const year = body.data;
            return `Tạo mới năm học "${year.fromYear}-${year.toYear}"`;
        }),
        academicYearController.createNew,
    );

// API kích hoạt năm học
Router.route('/:id/set-active').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_ACADEMIC_YEAR]),
    academicYearController.setActive,
);

// API chi tiết, cập nhật, xóa năm học
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_ACADEMIC_YEAR]),
        academicYearController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_ACADEMIC_YEAR]),
        academicYearValidation.update,
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.ACADEMIC_YEAR, (req, body) => {
            const year = body.data;
            return `Cập nhật năm học "${year.fromYear}-${year.toYear}"`;
        }),
        academicYearController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_ACADEMIC_YEAR]),
        // ✅ Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.ACADEMIC_YEAR, (req, body) => {
            // Body trả về từ controller không có data, cần lấy từ service
            return `Xóa năm học "${body.yearInfo.fromYear}-${body.yearInfo.toYear}`;
        }),
        academicYearController.deleteAcademicYear,
    );

export const academicYearRoute = Router;
