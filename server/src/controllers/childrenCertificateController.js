// server/src/controllers/childrenCertificateController.js

import { StatusCodes } from 'http-status-codes';
import { childrenCertificateServices } from '~/services/childrenCertificateServices.js';

const createNew = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenCertificateServices.createNew(req.body, userId);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo phiếu bé ngoan thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenCertificateServices.getAll(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách phiếu bé ngoan thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenCertificateServices.getDetails(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin phiếu bé ngoan thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenCertificateServices.update(req.params.id, req.body, userId);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật phiếu bé ngoan thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteCertificate = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        await childrenCertificateServices.deleteCertificate(req.params.id, userId);
        res.status(StatusCodes.OK).json({
            message: 'Xóa phiếu bé ngoan thành công!',
        });
    } catch (error) {
        next(error);
    }
};

const getAccessibleClassesList = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await childrenCertificateServices.getAccessibleClassesList(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách lớp học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getValidWeeks = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const { academicYearId } = req.query;
        const result = await childrenCertificateServices.getValidWeeks(academicYearId, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách tuần hợp lệ thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getPreviewData = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded.id;
        const result = await childrenCertificateServices.getPreviewData(req.query, userId);
        res.status(StatusCodes.OK).json({
            message: 'Lấy preview data thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const childrenCertificateController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteCertificate,
    getAccessibleClassesList,
    getValidWeeks,
    getPreviewData, // ✅ Add new controller
};
