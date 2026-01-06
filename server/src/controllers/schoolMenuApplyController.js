import { StatusCodes } from 'http-status-codes';
import { schoolMenuApplyServices } from '~/services/schoolMenuApplyServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuApplyServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo thực đơn áp dụng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuApplyServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách thực đơn áp dụng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuApplyServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy chi tiết thực đơn áp dụng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuApplyServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thực đơn áp dụng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteMenuApply = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuApplyServices.deleteMenuApply(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa thực đơn áp dụng thành công!',
            menuApplyInfo: result.menuApplyInfo, // ✅ ADD: Thêm menuApplyInfo để audit log có thể access
        });
    } catch (error) {
        next(error);
    }
};

const getAvailableWeeks = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await schoolMenuApplyServices.getAvailableWeeks(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách tuần khả dụng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAvailableDays = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId, weekNumber } = req.query;
        const result = await schoolMenuApplyServices.getAvailableDays(academicYearId, weekNumber, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách ngày khả dụng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAvailableMenus = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { ageGroup } = req.query;
        const result = await schoolMenuApplyServices.getAvailableMenus(ageGroup, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách thực đơn khả dụng thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const copyToWeeks = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuApplyServices.copyToWeeks(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

const deleteWeekMenus = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await schoolMenuApplyServices.deleteWeekMenus(req.body, userId);
        res.status(StatusCodes.OK).json({
            message: result.message,
            data: result.summary,
        });
    } catch (error) {
        next(error);
    }
};

export const schoolMenuApplyController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteMenuApply,
    getAvailableWeeks,
    getAvailableDays,
    getAvailableMenus,
    copyToWeeks, // ✅ NEW
    deleteWeekMenus, // ✅ NEW
};
