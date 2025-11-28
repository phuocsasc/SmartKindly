// client/src/apis/childrenDailyAssessmentApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenDailyAssessmentApi = {
    // Lấy danh sách lớp accessible
    getAccessibleClasses: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-daily-assessments/accessible-classes`, {
            params: { academicYearId },
        });
    },

    // Lấy danh sách đánh giá theo lớp và tuần
    getAssessmentsByClass: async (params) => {
        const { classId, weekNumber, academicYearId, search } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-daily-assessments`, {
            params: { classId, weekNumber, academicYearId, search, page: 1, limit: 1000 },
        });
    },

    // Tạo đánh giá mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-daily-assessments`, data);
    },

    // Cập nhật đánh giá
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/children-daily-assessments/${id}`, data);
    },

    // Xóa đánh giá
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-daily-assessments/${id}`);
    },

    // Lấy chi tiết đánh giá
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-daily-assessments/${id}`);
    },
};
