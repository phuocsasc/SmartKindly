import express from 'express';
import { childrenProfileController } from '~/controllers/childrenProfileController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { childrenProfileValidation } from '~/validations/childrenProfileValidation.js';

const Router = express.Router();

// ✅ Thêm route xóa nhiều
Router.route('/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_PROFILE]),
    childrenProfileController.deleteManyProfiles,
);

// ✅ Route lấy nhóm tuổi accessible - ĐẶT TRƯỚC route có :id
Router.route('/accessible-age-groups').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getAccessibleAgeGroups,
);

// ✅ Route lấy classes theo age group - ĐẶT TRƯỚC route có :id
Router.route('/classes-by-age-group').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getClassesByAgeGroup,
);
// ✅ Import bulk
Router.route('/import-bulk').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.importBulk,
);

// Route lấy danh sách
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getAll,
);

// Route tạo mới
Router.route('/').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_PROFILE]),
    childrenProfileValidation.create,
    childrenProfileController.createNew,
);

// Route chi tiết
Router.route('/:id').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getDetails,
);

// Route cập nhật
Router.route('/:id').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_PROFILE]),
    childrenProfileValidation.update,
    childrenProfileController.update,
);

// Route xóa
Router.route('/:id').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_PROFILE]),
    childrenProfileController.deleteProfile,
);

export const childrenProfileRoute = Router;
