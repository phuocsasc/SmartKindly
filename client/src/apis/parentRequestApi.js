// client/src/apis/parentRequestApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const parentRequestApi = {
    // Lấy danh sách phiếu dặn dò của phụ huynh
    getMyRequests: async (params) => {
        const { page = 1, limit = 10, academicYearId = '', status = '', search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-requests/my-requests`, {
            params: { page, limit, academicYearId, status, search },
        });
    },

    // ✅ NHÀ TRƯỜNG: Lấy danh sách phiếu dặn dò theo lớp (BGH, Tổ trưởng, Giáo viên)
    getAll: async (params) => {
        const { page = 1, limit = 10, academicYearId = '', classId = '', status = '', search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-requests`, {
            params: { page, limit, academicYearId, classId, status, search },
        });
    },

    // ✅ NHÀ TRƯỜNG: Lấy danh sách lớp có quyền truy cập
    getAccessibleClasses: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-requests/accessible-classes`, {
            params: { academicYearId },
        });
    },

    // Lấy chi tiết phiếu dặn dò
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-requests/${id}`);
    },

    // Tạo phiếu dặn dò mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/parent-requests`, data);
    },

    // Cập nhật phiếu dặn dò
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/parent-requests/${id}`, data);
    },

    // Xóa phiếu dặn dò
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/parent-requests/${id}`);
    },
};
