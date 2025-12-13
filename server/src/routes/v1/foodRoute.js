// server/src/routes/v1/foodRoute.js

import express from 'express';
import { foodValidation } from '~/validations/foodValidation.js';
import { foodController } from '~/controllers/foodController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

Router.post(
    '/import-bulk',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
    foodController.importBulk,
);

Router.post(
    '/delete-many',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
    foodController.deleteManyFoods,
);

// CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        foodController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        foodValidation.createNew,
        foodController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        foodController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        foodValidation.update,
        foodController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        foodController.deleteFood,
    );

export default Router;
