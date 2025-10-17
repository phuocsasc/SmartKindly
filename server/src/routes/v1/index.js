import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { userRoute } from '~/routes/v1/userRoute';
import { dashboardRoute } from '~/routes/v1/dashboardRoute';
import { schoolRoute } from '~/routes/v1/schoolRoute';
import { academicYearRoute } from '~/routes/v1/academicYearRoute';

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

export const APIs_V1 = Router;
