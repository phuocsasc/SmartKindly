import express from 'express';
import { childrenProfileController } from '~/controllers/childrenProfileController.js';
import { authMiddleware } from '~/middlewares/authMiddleware.js';
import { rbacMiddleware } from '~/middlewares/rbacMiddleware.js';
import { PERMISSIONS } from '~/config/rbacConfig.js';
import { childrenProfileValidation } from '~/validations/childrenProfileValidation.js';
import { auditLog } from '~/middlewares/auditLogMiddleware.js';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_RESOURCES } from '~/config/auditLogConfig.js';

const Router = express.Router();

// ✅ Thêm route xóa nhiều
Router.route('/delete-many').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_PROFILE]),
    childrenProfileController.deleteManyProfiles,
);

// ✅ Route lấy nhóm tuổi accessible - ĐẶT TRƯỚC route có :id
Router.route('/accessible-age-groups').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getAccessibleAgeGroups,
);

// ✅ Route lấy classes theo age group - ĐẶT TRƯỚC route có :id
Router.route('/classes-by-age-group').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getClassesByAgeGroup,
);
// ✅ Import bulk
Router.route('/import-bulk').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    // ✅ Audit log cho import
    auditLog(AUDIT_LOG_ACTIONS.IMPORT, AUDIT_LOG_RESOURCES.CHILDREN_PROFILE, (req, body) => {
        const { created = [], updated = [] } = body.data || {};
        const totalCount = created.length + updated.length;
        return `Import ${totalCount} hồ sơ trẻ (${created.length} mới, ${updated.length} cập nhật)`;
    }),
    childrenProfileController.importBulk,
);

// Route lấy danh sách
Router.route('/').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getAll,
);

// Route tạo mới
Router.route('/').post(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.CREATE_CHILDREN_PROFILE]),
    childrenProfileValidation.create,
    // ✅ Audit log cho create
    auditLog(AUDIT_LOG_ACTIONS.CREATE, AUDIT_LOG_RESOURCES.CHILDREN_PROFILE, (req, body) => {
        const profile = body.data;
        const className = profile.classId?.name || 'N/A';
        const academicYear = profile.classId?.academicYearId
            ? `${profile.classId.academicYearId.fromYear}-${profile.classId.academicYearId.toYear}`
            : 'N/A';
        return `Thêm hồ sơ trẻ "${profile.fullName}" - Lớp: ${className} - Năm học: ${academicYear}`;
    }),
    childrenProfileController.createNew,
);

// Route chi tiết
Router.route('/:id').get(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.VIEW_CHILDREN_PROFILE]),
    childrenProfileController.getDetails,
);

// Route cập nhật
Router.route('/:id').put(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.UPDATE_CHILDREN_PROFILE]),
    childrenProfileValidation.update,
    // ✅ Audit log cho update
    auditLog(AUDIT_LOG_ACTIONS.UPDATE, AUDIT_LOG_RESOURCES.CHILDREN_PROFILE, (req, body) => {
        const profile = body.data;
        const className = profile.classId?.name || 'N/A';
        const academicYear = profile.classId?.academicYearId
            ? `${profile.classId.academicYearId.fromYear}-${profile.classId.academicYearId.toYear}`
            : 'N/A';
        return `Cập nhật hồ sơ trẻ "${profile.fullName}" - Lớp: ${className} - Năm học: ${academicYear}`;
    }),
    childrenProfileController.update,
);

// Route xóa
Router.route('/:id').delete(
    authMiddleware.isAuthorized,
    rbacMiddleware.isValidPermission([PERMISSIONS.DELETE_CHILDREN_PROFILE]),
    // ✅ Audit log cho delete
    auditLog(AUDIT_LOG_ACTIONS.DELETE, AUDIT_LOG_RESOURCES.CHILDREN_PROFILE, (req, body) => {
        const info = body.profileInfo;
        return `Xóa hồ sơ trẻ "${info?.fullName || req.params.id}" - Lớp: ${info?.className || 'N/A'} - Năm học: ${info?.academicYear || 'N/A'}`;
    }),
    childrenProfileController.deleteProfile,
);

export const childrenProfileRoute = Router;
