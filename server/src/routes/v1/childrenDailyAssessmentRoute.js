// server/src/routes/v1/childrenDailyAssessmentRoute.js

import express from 'express';
import { childrenDailyAssessmentValidation } from '~/validations/childrenDailyAssessmentValidation.js';
import { childrenDailyAssessmentController } from '~/controllers/childrenDailyAssessmentController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Lấy danh sách lớp accessible
Router.route('/accessible-classes').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ASSESSMENT]),
    childrenDailyAssessmentController.getAccessibleClassesList,
);

// ✅ Lấy danh sách đánh giá theo lớp và tuần
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ASSESSMENT]),
    childrenDailyAssessmentController.getAssessmentsByClass,
);

// ✅ Tạo đánh giá mới
Router.route('/').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_ASSESSMENT]),
    childrenDailyAssessmentValidation.createNew,
    childrenDailyAssessmentController.createNew,
);

// ✅ Lấy chi tiết đánh giá
Router.route('/:id').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ASSESSMENT]),
    childrenDailyAssessmentController.getDetails,
);

// ✅ Cập nhật đánh giá
Router.route('/:id').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_ASSESSMENT]),
    childrenDailyAssessmentValidation.update,
    childrenDailyAssessmentController.update,
);

// ✅ Xóa đánh giá
Router.route('/:id').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_ASSESSMENT]),
    childrenDailyAssessmentController.deleteAssessment,
);

export const childrenDailyAssessmentRoute = Router;
