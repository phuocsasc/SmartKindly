// server/src/routes/v1/personnelEvaluationRoute.js

import express from 'express';
import { authMiddleware } from '~/middlewares/authMiddleware';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware';
import { PERMISSIONS } from '~/config/rbacConfig';
import { personnelEvaluationController } from '~/controllers/personnelEvaluationController';
import { personnelEvaluationValidation } from '~/validations/personnelEvaluationValidation';

const Router = express.Router();

// ✅ Lấy danh sách đánh giá xếp loại
Router.get(
    '/',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_PERSONNEL_EVALUATION]),
    personnelEvaluationController.getAll,
);

// ✅ Lấy chi tiết đánh giá
Router.get(
    '/:id',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_PERSONNEL_EVALUATION]),
    personnelEvaluationController.getDetails,
);

// ✅ Cập nhật đánh giá (chỉ update 3 fields)
Router.put(
    '/:id',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_PERSONNEL_EVALUATION]),
    personnelEvaluationValidation.update,
    personnelEvaluationController.update,
);

export const personnelEvaluationRoute = Router;
