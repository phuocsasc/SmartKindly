import express from 'express';
import { childrenAttendanceValidation } from '~/validations/childrenAttendanceValidation.js';
import { childrenAttendanceController } from '~/controllers/childrenAttendanceController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// ✅ Lấy danh sách lớp accessible
Router.route('/accessible-classes').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ATTENDANCE]),
    childrenAttendanceController.getAccessibleClassesList,
);

// ✅ Lấy danh sách tuần
Router.route('/weeks').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ATTENDANCE]),
    childrenAttendanceController.getWeeksList,
);

// ✅ Điểm danh hàng loạt
Router.route('/bulk').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_ATTENDANCE]),
    childrenAttendanceValidation.bulkAttendance,
    childrenAttendanceController.bulkAttendance,
);

// ✅ Lấy danh sách điểm danh theo lớp
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ATTENDANCE]),
    childrenAttendanceController.getAttendanceByClass,
);

// ✅ Cập nhật và xóa điểm danh
Router.route('/:id')
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_ATTENDANCE]),
        childrenAttendanceValidation.updateAttendance,
        // ✅ Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.CHILDREN_ATTENDANCE, (req, body) => {
            const data = body.data;
            const studentName = data.studentId?.fullName || 'N/A';
            const className = data.classId?.name || 'N/A';
            const academicYear = data.classId?.academicYearId
                ? `${data.classId.academicYearId.fromYear}-${data.classId.academicYearId.toYear}`
                : 'N/A';
            const dayOfWeek = data.dayOfWeek || 'N/A';
            const weekNumber = data.weekNumber || 'N/A';
            return `Cập nhật điểm danh "${studentName}" - ${dayOfWeek} - Tuần ${weekNumber} - Lớp "${className}" - Năm học ${academicYear}`;
        }),
        childrenAttendanceController.updateAttendance,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_ATTENDANCE]),
        // ✅ Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.CHILDREN_ATTENDANCE, (req, body) => {
            const info = body.attendanceInfo;
            return `Xóa điểm danh "${info?.studentName || 'N/A'}" - ${info?.dayOfWeek || 'N/A'} - Tuần ${info?.weekNumber || 'N/A'} - Lớp "${info?.className || 'N/A'}" - Năm học ${info?.academicYear || 'N/A'}`;
        }),
        childrenAttendanceController.deleteAttendance,
    );

export const childrenAttendanceRoute = Router;
