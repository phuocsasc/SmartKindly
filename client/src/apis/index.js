import authorizedAxiosInstance from '~/utils/authorizedAxios';
import { API_ROOT } from '~/utils/constants';

export const handleLogoutApi = async () => {
    // Với trường hợp 01: Dùng localstorage > chỉ xóa thông tin user trong localstorage phía FE
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');

    // Với trường hợp 02: Dùng Http Only Cookies > gọi API để xử lý delete cookies
    // return await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`);
};

export const refreshTokenApi = async (refreshToken) => {
    return await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/refresh_token`, {
        refreshToken,
    });
};
