import express from 'express';
import { schoolMenuApplyValidation } from '~/validations/schoolMenuApplyValidation.js';
import { schoolMenuApplyController } from '~/controllers/schoolMenuApplyController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js'; // ✅ ADD
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js'; // ✅ ADD

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

// ✅ NEW: Copy to weeks
Router.route('/copy-to-weeks').post(
    authMiddleware.isAuthorized,
    schoolMenuApplyValidation.copyToWeeks,
    // ✅ ADD: Audit log cho copy
    auditLog(AUDIT_LOG_ACTIONS.COPY, AUDIT_LOG_RESOURCES.MENU_APPLY, (req, body) => {
        const summary = body.data;
        return `Nhân bản thực đơn từ tuần ${summary?.sourceWeek || req.body.sourceWeekNumber} sang ${summary?.targetWeeks || req.body.targetWeekNumbers?.length} tuần - Nhóm trẻ: ${req.body.ageGroup} - Tạo mới: ${summary?.created || 0}, Cập nhật: ${summary?.updated || 0}, Bỏ qua: ${summary?.skipped || 0}`;
    }),
    schoolMenuApplyController.copyToWeeks,
);

// ✅ NEW: Delete week menus
Router.route('/delete-week').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MENU_APPLY]),
    schoolMenuApplyValidation.deleteWeekMenus,
    // ✅ ADD: Audit log cho delete week
    auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.MENU_APPLY, (req, body) => {
        const summary = body.data;
        return `Xóa thực đơn tuần ${summary?.weekNumber || req.body.weekNumber} - Nhóm trẻ: ${req.body.ageGroup} - Đã xóa: ${summary?.deleted || 0}, Bỏ qua: ${summary?.skipped || 0} ngày nghỉ`;
    }),
    schoolMenuApplyController.deleteWeekMenus,
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
        // ✅ ADD: Audit log cho create
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.MENU_APPLY, (req, body) => {
            const menuApply = body.data;
            return `Thêm thực đơn áp dụng "${menuApply?.menuSnapshot?.menuName || 'N/A'}" - Nhóm trẻ: ${req.body.ageGroup} - Tuần ${req.body.weekNumber} - ${req.body.dayOfWeek}`;
        }),
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
        // ✅ ADD: Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.MENU_APPLY, (req, body) => {
            const menuApply = body.data;
            return `Cập nhật thực đơn áp dụng "${menuApply?.menuSnapshot?.menuName || 'N/A'}" - Nhóm trẻ: ${menuApply?.ageGroup || 'N/A'} - Tuần ${menuApply?.weekNumber || 'N/A'} - ${menuApply?.dayOfWeek || 'N/A'}`;
        }),
        schoolMenuApplyController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MENU_APPLY]),
        // ✅ ADD: Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.MENU_APPLY, (req, body) => {
            const menuApplyInfo = body.menuApplyInfo;
            return `Xóa thực đơn áp dụng "${menuApplyInfo?.menuName || req.params.id}" - Nhóm trẻ: ${menuApplyInfo?.ageGroup || 'N/A'} - Tuần ${menuApplyInfo?.weekNumber || 'N/A'} - ${menuApplyInfo?.dayOfWeek || 'N/A'}`;
        }),
        schoolMenuApplyController.deleteMenuApply,
    );

export const schoolMenuApplyRoute = Router;
