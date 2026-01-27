// server/src/routes/v1/parentChildrenRoute.js

import express from 'express';
import { parentChildrenController } from '~/controllers/parentChildrenController.js';
import { parentChildrenValidation } from '~/validations/parentChildrenValidation.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';

const Router = express.Router();

// ✅ GET SCHOOL INFO - Phụ huynh xem thông tin trường học
Router.route('/school-info').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_SCHOOL_INFO]),
    parentChildrenController.getSchoolInfo,
);

// ✅ GET CHILDREN INFO - Phụ huynh xem thông tin con
Router.route('/children-info').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILD_PROFILE]),
    parentChildrenController.getChildrenInfo,
);

// ✅ UPDATE CHILDREN INFO - Phụ huynh cập nhật thông tin con (với validation)
Router.route('/children-info').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILD_PROFILE]),
    parentChildrenValidation.updateChildrenInfo, // ✅ Thêm validation
    parentChildrenController.updateChildrenInfo,
);

// ✅ GET ACADEMIC YEARS
Router.route('/academic-years').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_WEEKLY_MENU]),
    parentChildrenController.getAcademicYears,
);

// ✅ GET STUDENT CLASSES BY YEAR
Router.route('/classes-by-year').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_WEEKLY_MENU]),
    parentChildrenController.getStudentClassesByYear,
);

// ✅ GET WEEKLY PLAN
Router.route('/weekly-plan').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_WEEKLY_MENU]),
    parentChildrenController.getWeeklyPlan,
);

// ✅ GET SCHEDULE WEEKS
Router.route('/schedule-weeks').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_WEEKLY_MENU]),
    parentChildrenController.getScheduleWeeks,
);

// ✅ GET WEEKLY MENU
Router.route('/weekly-menu').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_WEEKLY_MENU]),
    parentChildrenController.getWeeklyMenu,
);

export const parentChildrenRoute = Router;
