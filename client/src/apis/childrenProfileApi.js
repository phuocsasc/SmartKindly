import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const childrenProfileApi = {
    // Lấy danh sách hồ sơ trẻ
    getAll: async (params) => {
        const {
            page = 1,
            limit = 10,
            academicYearId = '',
            classId = '',
            ageGroup = '',
            search = '',
            status = '',
        } = params;
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-profiles`, {
            params: { page, limit, academicYearId, classId, ageGroup, search, status },
        });
    },

    // Lấy chi tiết hồ sơ trẻ
    getDetails: async (id) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-profiles/${id}`);
    },

    // Tạo hồ sơ trẻ mới
    create: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-profiles`, data);
    },

    // Cập nhật hồ sơ trẻ
    update: async (id, data) => {
        return await authorizedAxiosInstance.put(`${API_ROOT}/v1/children-profiles/${id}`, data);
    },

    // Xóa hồ sơ trẻ
    delete: async (id) => {
        return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/children-profiles/${id}`);
    },

    // ✅ Xóa nhiều hồ sơ trẻ
    deleteManyProfiles: async (ids) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-profiles/delete-many`, { ids });
    },

    // ✅ Lấy danh sách nhóm tuổi user được phép thao tác trong năm học
    getAccessibleAgeGroups: async (academicYearId) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-profiles/accessible-age-groups`, {
            params: { academicYearId },
        });
    },

    // ✅ Lấy danh sách lớp theo nhóm tuổi trong năm học
    getClassesByAgeGroup: async (academicYearId, ageGroup) => {
        return await authorizedAxiosInstance.get(`${API_ROOT}/v1/children-profiles/classes-by-age-group`, {
            params: { academicYearId, ageGroup },
        });
    },

    // ✅ Import bulk from Excel
    importBulk: async (data) => {
        return await authorizedAxiosInstance.post(`${API_ROOT}/v1/children-profiles/import-bulk`, data);
    },
};
