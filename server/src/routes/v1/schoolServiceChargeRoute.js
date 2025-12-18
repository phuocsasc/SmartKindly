// server/src/routes/v1/schoolServiceChargeRoute.js

import express from 'express';
import { schoolServiceChargeValidation } from '~/validations/schoolServiceChargeValidation.js';
import { schoolServiceChargeController } from '~/controllers/schoolServiceChargeController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_SERVICE_CHARGE]),
        schoolServiceChargeController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_SERVICE_CHARGE]),
        schoolServiceChargeValidation.createNew,
        schoolServiceChargeController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_SERVICE_CHARGE]),
        schoolServiceChargeController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SERVICE_CHARGE]),
        schoolServiceChargeValidation.update,
        schoolServiceChargeController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_SERVICE_CHARGE]),
        schoolServiceChargeController.deleteServiceCharge,
    );

export default Router;
