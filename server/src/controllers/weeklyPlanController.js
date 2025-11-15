// server/src/controllers/weeklyPlanController.js

import { StatusCodes } from 'http-status-codes';
import { weeklyPlanServices } from '~/services/weeklyPlanServices.js';

// ✅ API: Lấy danh sách lớp theo năm học được chọn
const getAccessibleClassListByYear = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;

        if (!academicYearId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Năm học là bắt buộc',
            });
        }

        const result = await weeklyPlanServices.getAccessibleClassListByYear(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getWeeklyPlanByClassAndWeek = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { classId, weekNumber, academicYearId } = req.query;

        const result = await weeklyPlanServices.getWeeklyPlanByClassAndWeek(
            classId,
            weekNumber,
            academicYearId,
            userId,
        );

        res.status(StatusCodes.OK).json({
            message: 'Lấy kế hoạch tuần thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateDailyPlan = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await weeklyPlanServices.updateDailyPlan(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật kế hoạch thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const copyWeekToFollowingWeeks = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await weeklyPlanServices.copyWeekToFollowingWeeks(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const weeklyPlanController = {
    getAccessibleClassListByYear,
    getWeeklyPlanByClassAndWeek,
    updateDailyPlan,
    copyWeekToFollowingWeeks,
};
