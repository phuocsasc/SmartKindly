// client/src/apis/weeklyPlanApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const weeklyPlanApi = {
    // ✅ Lấy danh sách lớp theo năm học được chọn
    getAccessibleClassesByYear: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/weekly-plans/accessible-classes-by-year`, {
            params: { academicYearId },
        });
    },

    // Lấy kế hoạch theo lớp, tuần VÀ NĂM HỌC
    getByClassAndWeek: async (classId, weekNumber, academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/weekly-plans/by-class-week`, {
            params: { classId, weekNumber, academicYearId },
        });
    },

    // Cập nhật kế hoạch chi tiết cho 1 ngày
    updateDailyPlan: async (data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/weekly-plans/daily`, data);
    },

    // ✅ Copy kế hoạch tuần hiện tại sang các tuần phía sau
    copyToFollowingWeeks: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/weekly-plans/copy-to-following-weeks`, data);
    },
};
