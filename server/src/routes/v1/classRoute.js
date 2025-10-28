import express from 'express';
import { classValidation } from '~/validations/classValidation';
import { classController } from '~/controllers/classController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';

const Router = express.Router();

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
        classController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CLASSROOM]),
        classController.deleteClass,
    );

export const classRoute = Router;
