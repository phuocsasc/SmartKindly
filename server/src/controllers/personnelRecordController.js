// server/src/controllers/personnelRecordController.js
import { StatusCodes } from 'http-status-codes';
import { personnelRecordServices } from '~/services/personnelRecordServices';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelRecordServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mới hồ sơ cán bộ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelRecordServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách hồ sơ cán bộ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelRecordServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin hồ sơ cán bộ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelRecordServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật hồ sơ cán bộ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteRecord = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await personnelRecordServices.deleteRecord(req.params.id, userId);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

const importBulk = async (req, res, next) => {
    try {
        // ✅ FIX: Dùng id thay vì _id (vì JWT decode trả về id, không phải _id)
        const userId = req.jwtDecoded.id; // ✅ Thay đổi từ _id thành id
        const { records } = req.body;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Danh sách records không hợp lệ',
            });
        }

        console.log('📥 [importBulk Controller] userId:', userId);
        console.log('📥 [importBulk Controller] records count:', records.length);

        const result = await personnelRecordServices.importBulk(records, userId);
        res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const personnelRecordController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteRecord,
    importBulk,
};
