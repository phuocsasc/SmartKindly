/* eslint-disable no-unused-vars */
import express from 'express';
import { childrenAttendanceValidation } from '~/validations/childrenAttendanceValidation.js';
import { childrenAttendanceController } from '~/controllers/childrenAttendanceController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// ✅ Lấy danh sách lớp accessible theo năm học
Router.route('/accessible-classes').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ATTENDANCE]),
    childrenAttendanceController.getAccessibleClassesList,
);

// ✅ Lấy danh sách tuần + ngày nghỉ
Router.route('/weeks').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ATTENDANCE]),
    childrenAttendanceController.getWeeksList,
);

// ✅ Điểm danh hàng loạt trong ngày (chỉ năm active)
Router.route('/bulk').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_ATTENDANCE]),
    childrenAttendanceValidation.bulkAttendance,
    auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.CHILDREN_ATTENDANCE, (req, body) => {
        const { classId, academicYearId, date } = req.body;
        return `Điểm danh hàng loạt - lớp ${classId} - ngày ${date} - năm ${academicYearId}`;
    }),
    childrenAttendanceController.bulkAttendance,
);

// ✅ Lấy dữ liệu điểm danh theo lớp/tuần hoặc ngày
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ATTENDANCE]),
    childrenAttendanceController.getAttendanceByClass,
);

// ✅ Cập nhật/Xóa 1 bản ghi (chỉ năm active)
Router.route('/:id')
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_ATTENDANCE]),
        childrenAttendanceValidation.updateAttendance,
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.CHILDREN_ATTENDANCE, (req, body) => {
            return `Cập nhật điểm danh ${req.params.id}`;
        }),
        childrenAttendanceController.updateAttendance,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_ATTENDANCE]),
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.CHILDREN_ATTENDANCE, (req, body) => {
            return `Xóa điểm danh ${req.params.id}`;
        }),
        childrenAttendanceController.deleteAttendance,
    );

export const childrenAttendanceRoute = Router;
