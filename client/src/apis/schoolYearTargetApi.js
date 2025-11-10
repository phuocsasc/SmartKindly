import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolYearTargetApi = {
    // Lấy danh sách mục tiêu năm học
    getAll: async (params) => {
        const { page = 1, limit = 10, academicYearId = '', ageGroup = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-year-targets`, {
            params: { page, limit, academicYearId, ageGroup },
        });
    },

    // Lấy chi tiết
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-year-targets/${id}`);
    },

    // Tạo mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-year-targets`, data);
    },

    // Cập nhật
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-year-targets/${id}`, data);
    },

    // Xóa
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/school-year-targets/${id}`);
    },

    // Copy từ năm học cũ
    copyFromYear: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-year-targets/copy-from-year`, data);
    },

    // Khởi tạo mục tiêu mặc định
    initializeDefaults: async (academicYearId) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-year-targets/initialize`, {
            academicYearId,
        });
    },
};
