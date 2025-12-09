// server/src/routes/v1/personnelEvaluationRoute.js

import express from 'express';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { personnelEvaluationController } from '~/controllers/personnelEvaluationController.js';
import { personnelEvaluationValidation } from '~/validations/personnelEvaluationValidation.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

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
    // ✅ Audit log cho update
    auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.PERSONNEL_EVALUATION, (req, body) => {
        const evaluation = body.data;
        return `Cập nhật đánh giá xếp loại cán bộ "${evaluation?.fullName || evaluation?.personnelCode || req.params.id}"`;
    }),
    personnelEvaluationController.update,
);

export const personnelEvaluationRoute = Router;
