import express from 'express';
import { schoolValidation } from '~/validations/schoolValidation';
import { schoolController } from '~/controllers/schoolController';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';
import { setCacheHeaders } from '~/middlewares/httpCacheMiddleware';


const Router = express.Router();

// ✅ Route cho user trong trường xem/cập nhật thông tin trường của mình
Router.route('/my-school')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_SCHOOL_INFO]),
        setCacheHeaders(600), // ✅ 10 phút
        schoolController.getSchoolInfo,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]),
        schoolValidation.update,
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
