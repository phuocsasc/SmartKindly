import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { userRoute } from '~/routes/v1/userRoute';
import { dashboardRoute } from '~/routes/v1/dashboardRoute';
import { schoolRoute } from '~/routes/v1/schoolRoute';
import { academicYearRoute } from '~/routes/v1/academicYearRoute';
import { adminUserManagementRoute } from '~/routes/v1/adminUserManagementRoute';
import { departmentRoute } from './departmentRoute'; // ✅ Import
import { classRoute } from './classRoute';
import { personnelRecordRoute } from './personnelRecordRoute';
import { personnelEvaluationRoute } from './personnelEvaluationRoute'; // ✅ Import
import { yearTargetRoute } from './yearTargetRoute'; // ✅ Import
import { educationalActivityRoute } from './educationalActivityRoute'; // ✅ Import
import { schoolYearTargetRoute } from '~/routes/v1/schoolYearTargetRoute.js';
import { schoolEducationalActivityRoute } from './schoolEducationalActivityRoute.js';
import { scheduleRoute } from './scheduleRoute.js';
import { weeklyPlanRoute } from './weeklyPlanRoute.js';
import { childrenProfileRoute } from '~/routes/v1/childrenProfileRoute';
import { childrenAttendanceRoute } from './childrenAttendanceRoute.js';


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


export const APIs_V1 = Router;
