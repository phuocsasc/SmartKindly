import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const classApi = {
    // Lấy danh sách lớp học
    getAll: async (params) => {
        const { page = 1, limit = 10, academicYearId = '', grade = '', search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/classes`, {
            params: { page, limit, academicYearId, grade, search },
        });
    },

    // Lấy chi tiết lớp học
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/classes/${id}`);
    },

    // Tạo lớp học mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/classes`, data);
    },

    // Cập nhật lớp học
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/classes/${id}`, data);
    },

    // Xóa lớp học
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/classes/${id}`);
    },

    // Lấy danh sách giáo viên có thể chọn
    getAvailableTeachers: async (academicYearId, currentClassId = null) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/classes/available-teachers`, {
            params: { academicYearId, currentClassId },
        });
    },

    // Lấy danh sách nhóm lớp theo khối
    getAgeGroupsByGrade: async (grade) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/classes/age-groups`, {
            params: { grade },
        });
    },

    // Copy classes từ năm học khác
    copyFromYear: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/classes/copy-from-year`, data);
    },
};
