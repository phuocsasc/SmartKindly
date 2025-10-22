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
