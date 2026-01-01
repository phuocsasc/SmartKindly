import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenByClassApi = {
    // Lấy danh sách trẻ theo lớp
    getAll: async (params) => {
        const { page = 1, limit = 10, academicYearId = '', classId = '', search = '' } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-by-class`, {
            params: { page, limit, academicYearId, classId, search },
        });
    },

    // Lấy danh sách trẻ chưa có lớp
    getAvailableStudents: async (academicYearId, classId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-by-class/available-students`, {
            params: { academicYearId, classId },
        });
    },

    // Thêm trẻ vào lớp
    addStudentsToClass: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-by-class/add-students`, data);
    },

    // Lấy danh sách lớp phù hợp để chuyển
    getAvailableClassesForTransfer: async (academicYearId, fromClassId, studentIds) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-by-class/available-classes-for-transfer`, {
            params: { academicYearId, fromClassId, studentIds: studentIds.join(',') },
        });
    },

    // Chuyển lớp cho trẻ
    transferStudents: async (data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/children-by-class/transfer-students`, data);
    },

    // Xóa 1 học sinh ra khỏi lớp
    removeStudentFromClass: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-by-class/${id}`);
    },

    // Xóa nhiều học sinh ra khỏi lớp
    removeStudentsFromClass: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-by-class/remove-students`, { ids });
    },
};
