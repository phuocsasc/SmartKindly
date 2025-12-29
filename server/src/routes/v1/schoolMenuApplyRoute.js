import express from 'express';
import { schoolMenuApplyValidation } from '~/validations/schoolMenuApplyValidation.js';
import { schoolMenuApplyController } from '~/controllers/schoolMenuApplyController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Helper endpoints
Router.get(
    '/available-weeks',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MENU_APPLY]),
    schoolMenuApplyController.getAvailableWeeks,
);

Router.get(
    '/available-days',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MENU_APPLY]),
    schoolMenuApplyController.getAvailableDays,
);

Router.get(
    '/available-menus',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MENU_APPLY]),
    schoolMenuApplyController.getAvailableMenus,
);

// ✅ CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MENU_APPLY]),
        schoolMenuApplyController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_MENU_APPLY]),
        schoolMenuApplyValidation.createNew,
        schoolMenuApplyController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MENU_APPLY]),
        schoolMenuApplyController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_MENU_APPLY]),
        schoolMenuApplyValidation.update,
        schoolMenuApplyController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MENU_APPLY]),
        schoolMenuApplyController.deleteMenuApply,
    );

export const schoolMenuApplyRoute = Router;
