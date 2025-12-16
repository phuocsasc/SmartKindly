import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { userRoute } from '~/routes/v1/userRoute.js';
import { dashboardRoute } from '~/routes/v1/dashboardRoute.js';
import { schoolRoute } from '~/routes/v1/schoolRoute.js';
import { academicYearRoute } from '~/routes/v1/academicYearRoute.js';
import { adminUserManagementRoute } from '~/routes/v1/adminUserManagementRoute.js';
import { departmentRoute } from './departmentRoute.js'; // ✅ Import
import { classRoute } from './classRoute.js';
import { personnelRecordRoute } from './personnelRecordRoute.js';
import { personnelEvaluationRoute } from './personnelEvaluationRoute.js'; // ✅ Import
import { yearTargetRoute } from './yearTargetRoute.js'; // ✅ Import
import { educationalActivityRoute } from './educationalActivityRoute.js'; // ✅ Import
import { schoolYearTargetRoute } from '~/routes/v1/schoolYearTargetRoute.js';
import { schoolEducationalActivityRoute } from './schoolEducationalActivityRoute.js';
import { scheduleRoute } from './scheduleRoute.js';
import { weeklyPlanRoute } from './weeklyPlanRoute.js';
import { childrenProfileRoute } from '~/routes/v1/childrenProfileRoute.js';
import { childrenAttendanceRoute } from './childrenAttendanceRoute.js';
import { childrenDailyAssessmentRoute } from './childrenDailyAssessmentRoute.js';
import { childrenCertificateRoute } from './childrenCertificateRoute.js';
import { notificationRoute } from './notificationRoute.js';
import childrenProgramCompleteRoute from './childrenProgramCompleteRoute.js';
import { auditLogRoute } from './auditLogRoute.js';
import foodRoute from '~/routes/v1/foodRoute.js';
import schoolFoodRoute from '~/routes/v1/schoolFoodRoute.js';
import schoolMealRoute from './schoolMealRoute.js';

const Router = express.Router();

/** Check APIs v1/status */
Router.get('/status', (req, res) => {
    res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.' });
});

/** User APIs */
Router.use('/users', userRoute);

/** Dashboard APIs */
Router.use('/dashboards', dashboardRoute);

/** School APIs */
Router.use('/schools', schoolRoute);

/** Academic Year APIs */
Router.use('/academic-years', academicYearRoute);

/** Admin User Management APIs */
Router.use('/admin/users', adminUserManagementRoute);

Router.use('/departments', departmentRoute); // ✅ Đăng ký route

Router.use('/classes', classRoute);

Router.use('/personnel-records', personnelRecordRoute);

/** Personnel Evaluation APIs */
Router.use('/personnel-evaluations', personnelEvaluationRoute); // ✅ Thêm route

/** Year Target APIs */
Router.use('/year-targets', yearTargetRoute); // ✅ Đăng ký route

/** Educational Activity APIs */
Router.use('/educational-activities', educationalActivityRoute); // ✅ Register

Router.use('/school-year-targets', schoolYearTargetRoute);

// ✅ School Educational Activity Routes
Router.use('/school-educational-activities', schoolEducationalActivityRoute);

Router.use('/schedules', scheduleRoute);

Router.use('/weekly-plans', weeklyPlanRoute);

Router.use('/children-profiles', childrenProfileRoute);

Router.use('/children-attendances', childrenAttendanceRoute); // ✅ Add this

Router.use('/children-daily-assessments', childrenDailyAssessmentRoute);

Router.use('/children-certificates', childrenCertificateRoute);

Router.use('/notifications', notificationRoute);

Router.use('/children-program-completes', childrenProgramCompleteRoute);

Router.use('/audit-logs', auditLogRoute);

Router.use('/foods', foodRoute);

Router.use('/school-foods', schoolFoodRoute);

Router.use('/school-meals', schoolMealRoute);

export const APIs_V1 = Router;
