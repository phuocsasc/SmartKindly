import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenAttendanceApi = {
    // Lấy danh sách lớp accessible
    getAccessibleClasses: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-attendances/accessible-classes`, {
            params: { academicYearId },
        });
    },

    // Lấy danh sách tuần
    getWeeks: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-attendances/weeks`, {
            params: { academicYearId },
        });
    },

    // Lấy dữ liệu điểm danh theo lớp và tuần
    getAttendanceByClass: async (params) => {
        const { classId, date, weekNumber, academicYearId } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-attendances`, {
            params: { classId, date, weekNumber, academicYearId },
        });
    },

    // Điểm danh hàng loạt
    bulkAttendance: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-attendances/bulk`, data);
    },

    // Cập nhật điểm danh
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/children-attendances/${id}`, data);
    },

    // Xóa điểm danh
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-attendances/${id}`);
    },
};
