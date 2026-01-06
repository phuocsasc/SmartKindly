// server/src/routes/v1/schoolMenuAiRoute.js

import express from 'express';
import { schoolMenuAiController } from '~/controllers/schoolMenuAiController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js'; // ✅ ADD
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js'; // ✅ ADD

const Router = express.Router();

Router.route('/balance-menu').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_MENU]), // ✅ ADD: Yêu cầu quyền update menu
    // ✅ ADD: Audit log cho AI balance
    auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.MENU, (req, body) => {
        const menuInfo = body.menuInfo;
        const suggestions = body.data || [];
        const changedCount = suggestions.filter((item) => item.purchaseQuantityByUnit !== item.originalQuantity).length;
        return `Cân đối thực đơn "${menuInfo?.menuName || 'N/A'}" bằng A.I - Nhóm trẻ: ${menuInfo?.ageGroup || 'N/A'} - Số thực phẩm được điều chỉnh: ${changedCount}/${suggestions.length}`;
    }),
    schoolMenuAiController.balanceMenuWithAi,
);

export const schoolMenuAiRoute = Router;
