import express from 'express';
import { childrenAttendanceValidation } from '~/validations/childrenAttendanceValidation.js';
import { childrenAttendanceController } from '~/controllers/childrenAttendanceController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

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
        childrenAttendanceController.updateAttendance,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_ATTENDANCE]),
        childrenAttendanceController.deleteAttendance,
    );

export const childrenAttendanceRoute = Router;
