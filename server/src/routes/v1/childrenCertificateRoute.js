// server/src/routes/v1/childrenCertificateRoute.js

import express from 'express';
import { childrenCertificateValidation } from '~/validations/childrenCertificateValidation.js';
import { childrenCertificateController } from '~/controllers/childrenCertificateController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ Lấy danh sách lớp accessible
Router.route('/accessible-classes').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_CERTIFICATE]),
    childrenCertificateController.getAccessibleClassesList,
);

// ✅ Lấy danh sách tuần hợp lệ
Router.route('/valid-weeks').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_CERTIFICATE]),
    childrenCertificateController.getValidWeeks,
);

// ✅ Lấy preview data cho dialog
Router.route('/preview-data').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_CERTIFICATE]),
    childrenCertificateController.getPreviewData,
);

// ✅ CRUD routes
Router.route('/')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_CERTIFICATE]),
        childrenCertificateController.getAll,
    )
    .post(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_CERTIFICATE]),
        childrenCertificateValidation.createNew,
        childrenCertificateController.createNew,
    );

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_CERTIFICATE]),
        childrenCertificateController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_CERTIFICATE]),
        childrenCertificateValidation.update,
        childrenCertificateController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_CERTIFICATE]),
        childrenCertificateController.deleteCertificate,
    );

export const childrenCertificateRoute = Router;
