// client/src/apis/schoolEducationalActivityApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const schoolEducationalActivityApi = {
    // Lấy danh sách hoạt động giáo dục
    getAll: async (params) => {
        const { page = 1, limit = 100, academicYearId = '', ageGroup = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-educational-activities`, {
            params: { page, limit, academicYearId, ageGroup },
        });
    },

    // Lấy chi tiết hoạt động giáo dục
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/school-educational-activities/${id}`);
    },

    // Tạo hoạt động giáo dục mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-educational-activities`, data);
    },

    // Cập nhật hoạt động giáo dục
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/school-educational-activities/${id}`, data);
    },

    // Xóa hoạt động giáo dục
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/school-educational-activities/${id}`);
    },

    // Copy từ năm học cũ
    copyFromYear: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/school-educational-activities/copy-from-year`, data);
    },
};
