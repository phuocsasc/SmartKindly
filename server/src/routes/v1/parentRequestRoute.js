// server/src/routes/v1/parentRequestRoute.js

import express from 'express';
import { parentRequestController } from '~/controllers/parentRequestController.js';
import { parentRequestValidation } from '~/validations/parentRequestValidation.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ GET ACCESSIBLE CLASSES
Router.route('/accessible-classes').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([
        PERMISSIONS.VIEW_PARENT_REQUEST,
        PERMISSIONS.CREATE_PARENT_REQUEST,
        PERMISSIONS.UPDATE_PARENT_REQUEST,
    ]),
    parentRequestController.getAccessibleClassesList,
);

// ✅ GET MY REQUESTS (Phụ huynh xem phiếu của con)
Router.route('/my-requests').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_PARENT_REQUEST]),
    parentRequestController.getMyRequests,
);

// ✅ CRUD
Router.route('/')
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_PARENT_REQUEST]),
        parentRequestValidation.createNew,
        parentRequestController.createNew,
    )
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_PARENT_REQUEST]),
        parentRequestController.getAll,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_PARENT_REQUEST]),
        parentRequestController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_PARENT_REQUEST]),
        parentRequestValidation.update,
        parentRequestController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_PARENT_REQUEST]),
        parentRequestController.deleteRequest,
    );

export const parentRequestRoute = Router;
