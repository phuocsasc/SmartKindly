import express from 'express';
import { schoolValidation } from '~/validations/schoolValidation';
import { schoolController } from '~/controllers/schoolController';

const Router = express.Router();

Router.route('/')
    .get(schoolController.getAll) // Thêm API lấy danh sách
    .post(schoolValidation.createNew, schoolController.createNew);

Router.route('/:id')
    .get(schoolController.getDetails) // Lấy chi tiết theo ID
    .put(schoolValidation.createNew, schoolController.update) // Cập nhật
    .delete(schoolController.deleteSchool); // Xóa (soft delete)

export const schoolRoute = Router;
