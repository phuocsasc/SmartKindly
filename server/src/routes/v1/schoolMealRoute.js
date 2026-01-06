// server/src/routes/v1/schoolMealRoute.js

import express from 'express';
import { schoolMealValidation } from '~/validations/schoolMealValidation.js';
import { schoolMealController } from '~/controllers/schoolMealController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js'; // ✅ ADD
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js'; // ✅ ADD

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
        // ✅ ADD: Audit log cho create
        auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.MEAL, (req, body) => {
            const meal = body.data;
            const ingredientCount = meal?.ingredients?.length || 0;
            return `Tạo món ăn "${meal?.name || req.body.name}" - Loại: ${meal?.mealType || req.body.mealType} - Số nguyên liệu: ${ingredientCount}`;
        }),
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
        // ✅ ADD: Audit log cho update
        auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.MEAL, (req, body) => {
            const meal = body.data;
            const ingredientCount = meal?.ingredients?.length || 0;
            return `Cập nhật món ăn "${meal?.name || 'N/A'}" - Loại: ${meal?.mealType || 'N/A'} - Số nguyên liệu: ${ingredientCount} - Tổng calo: ${meal?.totalCalories || 0} Calo`;
        }),
        schoolMealController.update,
    )
    .delete(
        authMiddleware.isAuthorized,
        rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_MEAL]),
        // ✅ ADD: Audit log cho delete
        auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.MEAL, (req, body) => {
            const mealInfo = body.mealInfo;
            return `Xóa món ăn "${mealInfo?.name || req.params.id}" - Loại: ${mealInfo?.mealType || 'N/A'}`;
        }),
        schoolMealController.deleteMeal,
    );

export default Router;
