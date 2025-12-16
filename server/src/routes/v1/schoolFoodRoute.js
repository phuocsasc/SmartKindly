// server/src/routes/v1/schoolFoodRoute.js

import express from 'express';
import { schoolFoodValidation } from '~/validations/schoolFoodValidation.js';
import { schoolFoodController } from '~/controllers/schoolFoodController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Check and sync endpoint (lần đầu)
Router.get(
    '/check-sync',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_FOOD]),
    schoolFoodController.checkAndSync,
);

// ✅ NEW: Force sync endpoint (đồng bộ tất cả)
Router.post(
    '/force-sync',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]), // Chỉ BGH
    schoolFoodController.forceSync,
);

// CRUD routes
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_FOOD]),
    schoolFoodController.getAll,
);

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_FOOD]),
        schoolFoodController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]), // Chỉ BGH
        schoolFoodValidation.update,
        schoolFoodController.update,
    );

export default Router;
