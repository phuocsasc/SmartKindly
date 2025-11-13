import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const handleLogoutApi = async () => {
    // Với trường hợp 01: Dùng localstorage > chỉ xóa thông tin user trong localstorage phía FE
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');

    // Gọi API logout nếu cần
    // await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`);
};

export const refreshTokenApi = async (refreshToken) => {
    return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/refresh_token`, {
        refreshToken,
    });
};
// Export userApi
export * from './userApi';

// Export academicYearApi
export * from './academicYearApi';

// Export schoolApi
export * from './schoolApi';

// Export adminUserApi
export * from './adminUserApi';

// Export classApi
export * from './classApi';

// Export personnelRecordApi
export * from './personnelRecordApi';

// Export yearTargetApi
export * from './yearTargetApi';

export * from './educationalActivityApi';

export * from './schoolYearTargetApi';

export * from './schoolEducationalActivityApi';

export * from './scheduleApi';

export * from './weeklyPlanApi';
