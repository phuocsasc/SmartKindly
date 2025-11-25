// client/src/apis/scheduleApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const scheduleApi = {
    // Khởi tạo thời khóa biểu cho năm học
    initialize: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/schedules/initialize`, data);
    },

    // Lấy thời khóa biểu theo năm học
    getByAcademicYear: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/schedules/by-academic-year`, {
            params: { academicYearId },
        });
    },

    // ✅ Cập nhật mốc hoạt động cho TẤT CẢ các tuần
    updateActivityPeriods: async (scheduleId, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/schedules/${scheduleId}/activity-periods`, data);
    },

    // Copy mốc hoạt động từ năm học cũ
    copyFromYear: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/schedules/copy-from-year`, data);
    },

    // ✅ Xóa mốc hoạt động của TẤT CẢ các tuần
    deleteActivityPeriods: async (scheduleId) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/schedules/${scheduleId}/activity-periods`);
    },
    // ✅ Get holidays
    getHolidays: async (scheduleId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/schedules/${scheduleId}/holidays`);
    },

    // ✅ Update holidays
    updateHolidays: async (scheduleId, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/schedules/${scheduleId}/holidays`, data);
    },
};
