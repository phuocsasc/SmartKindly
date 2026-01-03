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

    // ✅ Lấy danh sách đánh giá theo lớp và tuần (CÓ PHÂN TRANG)
    getAssessmentsByClass: async (params) => {
        const { academicYearId, classId, weekNumber, page = 1, limit = 10, search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-daily-assessments`, {
            params: { academicYearId, classId, weekNumber, page, limit, search },
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
