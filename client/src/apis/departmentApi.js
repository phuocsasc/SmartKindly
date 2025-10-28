import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const departmentApi = {
    // Lấy danh sách tổ bộ môn
    getAll: async (params) => {
        const { page = 1, limit = 10, academicYearId = '', name = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/departments`, {
            params: { page, limit, academicYearId, name },
        });
    },

    // Lấy chi tiết tổ bộ môn
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/departments/${id}`);
    },

    // Tạo tổ bộ môn mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/departments`, data);
    },

    // Cập nhật tổ bộ môn
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/departments/${id}`, data);
    },

    // Xóa tổ bộ môn
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/departments/${id}`);
    },

    // Lấy danh sách cán bộ có thể chọn theo tên tổ bộ môn và năm học
    getAvailableManagers: async (departmentName, academicYearId, currentDepartmentId = null) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/departments/available-managers`, {
            params: { departmentName, academicYearId, currentDepartmentId },
        });
    },

    // Copy departments từ năm học khác
    copyFromYear: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/departments/copy-from-year`, data);
    },
};
