import express from 'express';
import { classValidation } from '~/validations/classValidation.js';
import { classController } from '~/controllers/classController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();
// localhost:8017/v1/classes/available-teachers/
// API lấy danh sách giáo viên có thể chọn
Router.route('/available-teachers').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CLASSROOM]),
    classController.getAvailableTeachers,
);

// API lấy danh sách nhóm lớp theo khối
Router.route('/age-groups').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CLASSROOM]),
    classController.getAgeGroupsByGrade,
);

// API copy classes từ năm học khác
Router.route('/copy-from-year').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CLASSROOM]),
    classController.copyFromYear,
);

// API lấy danh sách và tạo mới lớp học
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CLASSROOM]),
        classController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CLASSROOM]),
        classValidation.createNew,
        // ✅ Thêm audit log middleware
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.CLASS, (req, body) => {
            return `Tạo mới lớp học "${req.body.name}"`;
        }),
        classController.createNew,
    );

// API chi tiết, cập nhật, xóa lớp học
Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CLASSROOM]),
        classController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CLASSROOM]),
        classValidation.update,
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.CLASS, (req, body) => {
            return `Cập nhật lớp học: "${body.data?.name || req.params.id}"`;
        }),
        classController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CLASSROOM]),
        // ✅ Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.CLASS, (req, body) => {
            return `Xóa lớp học: "${body.className || req.params.id}"`;
        }),
        classController.deleteClass,
    );

export const classRoute = Router;
