// client/src/apis/childrenCertificateApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenCertificateApi = {
    // Lấy danh sách lớp accessible
    getAccessibleClasses: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-certificates/accessible-classes`, {
            params: { academicYearId },
        });
    },

    // Lấy danh sách tuần hợp lệ (không phải nghỉ hoàn toàn Mon-Fri)
    getValidWeeks: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-certificates/valid-weeks`, {
            params: { academicYearId },
        });
    },

    // Lấy danh sách phiếu bé ngoan theo lớp và tuần
    getAll: async (params) => {
        const { classId, weekNumber, academicYearId, search } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-certificates`, {
            params: { classId, weekNumber, academicYearId, search, page: 1, limit: 1000 },
        });
    },

    // Tạo phiếu bé ngoan mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-certificates`, data);
    },

    // Cập nhật phiếu bé ngoan
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/children-certificates/${id}`, data);
    },

    // Xóa phiếu bé ngoan
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-certificates/${id}`);
    },

    // Lấy chi tiết phiếu bé ngoan
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-certificates/${id}`);
    },

    // Lấy preview data cho dialog
    getPreviewData: async (params) => {
        const { academicYearId, classId, studentId, weekNumber } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-certificates/preview-data`, {
            params: { academicYearId, classId, studentId, weekNumber },
        });
    },
};
