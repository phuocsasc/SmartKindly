// client/src/apis/parentChildrenApi.js

import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const parentChildrenApi = {
    // Lấy thông tin trường học
    getSchoolInfo: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/school-info`);
    },

    // Lấy thông tin con
    getChildrenInfo: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/children-info`);
    },

    // Cập nhật thông tin con
    updateChildrenInfo: async (data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/parent-children/children-info`, data);
    },

    // Lấy danh sách năm học
    getAcademicYears: async () => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/academic-years`);
    },

    // Lấy danh sách lớp học theo năm học
    getStudentClassesByYear: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/classes-by-year`, {
            params: { academicYearId },
        });
    },

    // Lấy kế hoạch giáo dục chi tiết theo tuần
    getWeeklyPlan: async (params) => {
        const { academicYearId, classId, weekNumber } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/weekly-plan`, {
            params: { academicYearId, classId, weekNumber },
        });
    },

    // Lấy danh sách tuần trong năm học
    getScheduleWeeks: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/schedule-weeks`, {
            params: { academicYearId },
        });
    },

    // Lấy thực đơn hằng tuần
    getWeeklyMenu: async (params) => {
        const { academicYearId, classId, weekNumber } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/weekly-menu`, {
            params: { academicYearId, classId, weekNumber },
        });
    },

    // Lấy thông tin điểm danh hằng tuần
    getAttendance: async (params) => {
        const { academicYearId, classId, weekNumber } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/attendance`, {
            params: { academicYearId, classId, weekNumber },
        });
    },

    // Lấy thông tin đánh giá hằng ngày
    getDailyAssessment: async (params) => {
        const { academicYearId, classId, weekNumber } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/daily-assessment`, {
            params: { academicYearId, classId, weekNumber },
        });
    },

    // Lấy thông tin phiếu bé ngoan hằng tuần
    getWeeklyCertificate: async (params) => {
        const { academicYearId, classId, weekNumber } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/parent-children/weekly-certificate`, {
            params: { academicYearId, classId, weekNumber },
        });
    },
};
