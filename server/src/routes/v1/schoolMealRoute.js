// server/src/routes/v1/schoolMealRoute.js

import express from 'express';
import { schoolMealValidation } from '~/validations/schoolMealValidation.js';
import { schoolMealController } from '~/controllers/schoolMealController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Search foods endpoint
Router.get(
    '/search-foods',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MEAL]),
    schoolMealController.searchFoods,
);

// CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MEAL]),
        schoolMealController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_MEAL]),
        schoolMealValidation.createNew,
        schoolMealController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_MEAL]),
        schoolMealController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_MEAL]),
        schoolMealValidation.update,
        schoolMealController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MEAL]),
        schoolMealController.deleteMeal,
    );

export default Router;
