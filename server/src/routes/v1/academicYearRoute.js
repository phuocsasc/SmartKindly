import express from 'express';
import { academicYearValidation } from '~/validations/academicYearValidation';
import { academicYearController } from '~/controllers/academicYearController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';

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
        academicYearController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_ACADEMIC_YEAR]),
        academicYearController.deleteAcademicYear,
    );

export const academicYearRoute = Router;
