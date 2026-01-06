// server/src/routes/v1/schoolFoodRoute.js

import express from 'express';
import { schoolFoodValidation } from '~/validations/schoolFoodValidation.js';
import { schoolFoodController } from '~/controllers/schoolFoodController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js'; // ✅ ADD
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js'; // ✅ ADD

const Router = express.Router();

// ✅ Check and sync endpoint (lần đầu)
Router.get(
    '/check-sync',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_FOOD]),
    schoolFoodController.checkAndSync,
);

// ✅ NEW: Force sync endpoint (đồng bộ tất cả)
Router.post(
    '/force-sync',
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]), // Chỉ BGH
    // ✅ ADD: Audit log cho force sync
    auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.FOOD, (req, body) => {
        return `Đồng bộ danh sách thực phẩm từ ngân hàng dữ liệu - Tổng số: ${body.data?.total || 0}, Thêm mới: ${body.data?.upserted || 0}, Cập nhật: ${body.data?.modified || 0}`;
    }),
    schoolFoodController.forceSync,
);

// CRUD routes
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_FOOD]),
    schoolFoodController.getAll,
);

Router.route('/:id')
    .get(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_FOOD]),
        schoolFoodController.getDetails,
    )
    .put(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_SCHOOL_INFO]), // Chỉ BGH
        schoolFoodValidation.update,
        // ✅ ADD: Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.FOOD, (req, body) => {
            const food = body.data;
            return `Cập nhật thực phẩm: "${food?.name || 'N/A'}" - ĐVT: ${food?.unit || 'N/A'}, Quy đổi: ${food?.gramConversion || 0}g, Hệ số thải bỏ: ${food?.wastePercentage || 0}%`;
        }),
        schoolFoodController.update,
    );

export default Router;
