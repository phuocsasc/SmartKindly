import express from 'express';
import { childrenByClassController } from '~/controllers/childrenByClassController.js';
import { childrenByClassValidation } from '~/validations/childrenByClassValidation.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Lấy danh sách trẻ chưa có lớp (để thêm vào lớp)
Router.route('/available-students').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_BY_CLASS]),
    childrenByClassController.getAvailableStudents,
);

// ✅ Lấy danh sách lớp phù hợp để chuyển (cùng nhóm tuổi)
Router.route('/available-classes-for-transfer').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_BY_CLASS]),
    childrenByClassController.getAvailableClassesForTransfer,
);

// ✅ Thêm trẻ vào lớp
Router.route('/add-students').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_BY_CLASS]),
    childrenByClassValidation.addStudentsToClass,
    childrenByClassController.addStudentsToClass,
);

// ✅ Chuyển lớp cho trẻ
Router.route('/transfer-students').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_BY_CLASS]),
    childrenByClassValidation.transferStudents,
    childrenByClassController.transferStudents,
);

// ✅ Xóa nhiều học sinh ra khỏi lớp
Router.route('/remove-students').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_BY_CLASS]),
    childrenByClassValidation.removeStudentsFromClass,
    childrenByClassController.removeStudentsFromClass,
);

// ✅ Lấy danh sách trẻ theo lớp
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_BY_CLASS]),
    childrenByClassController.getAll,
);

// ✅ Xóa 1 học sinh ra khỏi lớp
Router.route('/:id').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_BY_CLASS]),
    childrenByClassController.removeStudentFromClass,
);

export const childrenByClassRoute = Router;
