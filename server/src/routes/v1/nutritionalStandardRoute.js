// server/src/routes/v1/nutritionalStandardRoute.js

import express from 'express';
import { nutritionalStandardValidation } from '~/validations/nutritionalStandardValidation.js';
import { nutritionalStandardController } from '~/controllers/nutritionalStandardController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        nutritionalStandardController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        nutritionalStandardValidation.createNew,
        nutritionalStandardController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        nutritionalStandardController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        nutritionalStandardValidation.update,
        nutritionalStandardController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.ADMIN_DATA_BANK]),
        nutritionalStandardController.deleteStandard,
    );

export default Router;
