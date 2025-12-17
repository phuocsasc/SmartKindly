// server/src/routes/v1/schoolNutritionalStandardRoute.js

import express from 'express';
import { schoolNutritionalStandardValidation } from '~/validations/schoolNutritionalStandardValidation.js';
import { schoolNutritionalStandardController } from '~/controllers/schoolNutritionalStandardController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Check and sync endpoint (lần đầu)
Router.get(
    '/check-sync',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_NUTRITIONAL_STANDARDS]),
    schoolNutritionalStandardController.checkAndSync,
);

// ✅ Force sync endpoint (đồng bộ tất cả)
Router.post(
    '/force-sync',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]), // Chỉ BGH
    schoolNutritionalStandardController.forceSync,
);

// CRUD routes
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_NUTRITIONAL_STANDARDS]),
    schoolNutritionalStandardController.getAll,
);

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_NUTRITIONAL_STANDARDS]),
        schoolNutritionalStandardController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]), // Chỉ BGH
        schoolNutritionalStandardValidation.update,
        schoolNutritionalStandardController.update,
    );

export default Router;
