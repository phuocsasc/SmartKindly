import { StatusCodes } from 'http-status-codes';
import { schoolServices } from '~/services/schoolServices';
import ApiError from '~/utils/ApiError';

const createNew = async (req, res, next) => {
    try {
        const result = await schoolServices.createNew(req.body);
        res.status(StatusCodes.CREATED).json({
            message: 'Tạo mới trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await schoolServices.getAll(req.query);
        res.status(StatusCodes.OK).json({
            message: 'Lấy danh sách trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const result = await schoolServices.getDetails(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await schoolServices.update(req.params.id, req.body);
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật trường học thành công!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteSchool = async (req, res, next) => {
    try {
        await schoolServices.deleteSchool(req.params.id);
        res.status(StatusCodes.OK).json({
            message: 'Xóa trường học thành công!',
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Thêm controller getSchoolInfo
const getSchoolInfo = async (req, res, next) => {
    try {
        console.log('🔍 getSchoolInfo called');
        console.log('🔍 User info:', {
            id: req.jwtDecoded.id,
            role: req.jwtDecoded.role,
            schoolId: req.jwtDecoded.schoolId,
        });
        const schoolId = req.jwtDecoded.schoolId;
        if (!schoolId) {
            console.log('❌ User không có schoolId');
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }
        console.log('🔍 Fetching school with schoolId:', schoolId);
        const result = await schoolServices.getBySchoolId(schoolId);
        console.log('✅ School data fetched successfully');
        res.status(StatusCodes.OK).json({
            message: 'Lấy thông tin trường học thành công!',
            data: result,
        });
    } catch (error) {
        console.error('❌ Error in getSchoolInfo:', error);
        next(error);
    }
};

// ✅ Thêm controller updateSchoolInfo
const updateSchoolInfo = async (req, res, next) => {
    try {
        console.log('🔍 updateSchoolInfo called');
        console.log('🔍 User info:', {
            id: req.jwtDecoded.id,
            role: req.jwtDecoded.role,
            schoolId: req.jwtDecoded.schoolId,
        });
        console.log('🔍 Update data:', req.body);

        const schoolId = req.jwtDecoded.schoolId;
        if (!schoolId) {
            console.log('❌ User không có schoolId');
            throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không thuộc trường học nào');
        }
        const result = await schoolServices.updateSchoolInfo(schoolId, req.body, req.jwtDecoded);

        console.log('✅ School updated successfully');
        res.status(StatusCodes.OK).json({
            message: 'Cập nhật thông tin trường học thành công!',
            data: result,
        });
    } catch (error) {
        console.error('❌ Error in updateSchoolInfo:', error);
        next(error);
    }
};

export const schoolController = {
    createNew,
    getAll,
    getDetails,
    update,
    deleteSchool,
    getSchoolInfo, // ✅ Export thêm
    updateSchoolInfo, // ✅ Export thêm
};
