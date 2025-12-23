import express from 'express';
import { schoolMenuValidation } from '~/validations/schoolMenuValidation.js';
import { schoolMenuController } from '~/controllers/schoolMenuController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MENU]),
        schoolMenuController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_MENU]),
        schoolMenuValidation.createNew,
        schoolMenuController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MENU]),
        schoolMenuController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_MENU]),
        schoolMenuValidation.update,
        schoolMenuController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MENU]),
        schoolMenuController.deleteMenu,
    );

export const schoolMenuRoute = Router;
