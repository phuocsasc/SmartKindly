import express from 'express';
import { schoolMenuValidation } from '~/validations/schoolMenuValidation.js';
import { schoolMenuController } from '~/controllers/schoolMenuController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js'; // ✅ ADD
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js'; // ✅ ADD

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
        // ✅ ADD: Audit log cho create
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.MENU, (req, body) => {
            const menu = body.data;
            return `Tạo thực đơn "${menu?.menuName || req.body.menuName}" - Nhóm trẻ: ${menu?.ageGroup || req.body.ageGroup} - Số trẻ: ${menu?.numberOfChildren || req.body.numberOfChildren}`;
        }),
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
        // ✅ ADD: Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.MENU, (req, body) => {
            const menu = body.data;
            const ready = menu?._ready ? 'Đạt chuẩn' : 'Chưa đạt chuẩn';
            return `Cập nhật thực đơn "${menu?.menuName || 'N/A'}" - Nhóm trẻ: ${menu?.ageGroup || 'N/A'} - Trạng thái: ${ready}`;
        }),
        schoolMenuController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MENU]),
        // ✅ ADD: Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.MENU, (req, body) => {
            const menuInfo = body.menuInfo;
            return `Xóa thực đơn "${menuInfo?.menuName || req.params.id}" - Nhóm trẻ: ${menuInfo?.ageGroup || 'N/A'}`;
        }),
        schoolMenuController.deleteMenu,
    );

export const schoolMenuRoute = Router;
