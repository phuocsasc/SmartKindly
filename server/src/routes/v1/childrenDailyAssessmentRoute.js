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

// ✅ CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ASSESSMENT]),
        childrenDailyAssessmentController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_ASSESSMENT]),
        childrenDailyAssessmentValidation.createNew,
        childrenDailyAssessmentController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_ASSESSMENT]),
        childrenDailyAssessmentController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_ASSESSMENT]),
        childrenDailyAssessmentValidation.update,
        childrenDailyAssessmentController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_ASSESSMENT]),
        childrenDailyAssessmentController.deleteAssessment,
    );

export const childrenDailyAssessmentRoute = Router;
