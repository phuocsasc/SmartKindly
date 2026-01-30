// server/src/routes/v1/childrenProgramCompleteRoute.js

import express from 'express';
import { childrenProgramCompleteController } from '~/controllers/childrenProgramCompleteController.js';
import { childrenProgramCompleteValidation } from '~/validations/childrenProgramCompleteValidation.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ CONFIG ENDPOINTS (BGH only)
Router.route('/config')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteController.getConfigByYear,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteValidation.configUpsert,
        childrenProgramCompleteController.upsertConfig,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteController.deleteConfig,
    );

// ✅ GET ACCESSIBLE CLASSES
Router.route('/accessible-classes').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROGRAM_COMPLETE]),
    childrenProgramCompleteController.getAccessibleClassesList,
);

// ✅ CRUD ENDPOINTS
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteValidation.createNew,
        childrenProgramCompleteController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteValidation.update,
        childrenProgramCompleteController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_PROGRAM_COMPLETE]),
        childrenProgramCompleteController.deleteEvaluation,
    );

export default Router;
