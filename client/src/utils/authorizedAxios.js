import axios from 'axios';
import { toast } from 'react-toastify';
import { handleLogoutApi, refreshTokenApi } from '~/apis';

// Khởi tạo một đối tượng Axios (authorizedAxiosInstance) mục đích để custom và cấu hình chung cho dự án
let authorizedAxiosInstance = axios.create();
// Thời gian chờ tối đa của 1 request: để 10 phút
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10;
// withCredentials: Sẽ cho phép axios tự động đính kèm và gửi cookie trong mỗi request lên BE
// (phục vụ trường hợp nếu chúng ta sử dụng JWT tokens (refresh & access) theo cơ chế httpOnly Cookie)
// ✅ Quan trọng: để trình duyệt chấp nhận nhận cookie từ server
// authorizedAxiosInstance.defaults.withCredentials = true;

// Cấu hình Interceptors (Bộ đánh chặn vào giữa mọi Request & Response)
// Add a request interceptor: Can thiệp vào giữa những cái request API
authorizedAxiosInstance.interceptors.request.use(
    (config) => {
        // Lấy accessToken từ localstorage và đính kèm vào header.
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            // Cần thêm "Bearer" vì chúng ta nên tuân thủ theo tiêu chuẩn OAuth 2.0 trong việc xác định loại token đang sử dụng
            // Bearer là định nghĩa loại token dành cho việc xác thực và ủy quyền, tham khảo các loại token khác như:
            // Basic token, Digest token, OAuth token, ...v.v
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        // Do something with request error
        return Promise.reject(error);
    },
);

// Khởi tạo một cái promise cho việc gọi API refresh_token
// Mục đích tạo Promise này để khi nhận yêu cầu refreshToken đầu tiên thi hold lại việc gọi API refresh_token
// cho tới khi xong xuôi thì mới retry lại những API bị lỗi trước đó thay vì cứ thế gọi lại refreshToken API liên tục với mỗi req lỗi
let refreshTokenPromise = null;

// Add a response interceptor: Can thiệp vào giữa những cái response nhận về từ API
authorizedAxiosInstance.interceptors.response.use(
    function onFulfilled(response) {
        // Mọi mã http status code nằm trong khoảng 200 - 299 sẽ là error và rơi vào đây
        // Do something with response data
        return response;
    },
    function onRejected(error) {
        // Khu vực quan trọng: Xử lý Refresh Token tự động
        // Nếu như nhận được mã 401 từ BE, thì gọi api logout
        if (error.response?.status === 401) {
            // handleLogoutApi().then(() => {
            //     // Nếu trường hợp dùng cookie thì nhớ xóa userInfo trong localstorage
            //     // localStorage.removeItem('userInfo')

            //     // Điều hướng tới trang Login sau khi Logout thành công, dùng JS thuần.
            //     location.href = '/login';
            // });

            // Chỉ redirect nếu không phải là trang login
            const isLoginRequest = error.config?.url?.includes('/login');
            if (!isLoginRequest) {
                handleLogoutApi().then(() => {
                    location.href = '/login';
                });
            }
        }

        // Nếu như nhận mã 410 từ BE, thì sẽ gọi API refresh token để làm mới lại accessToken
        // Đầu tiên lấy được các request API đang bị lỗi thông qua error.config
        const originalRequest = error.config;
        console.log('originalRequest: ', originalRequest);
        if (error.response?.status === 410 && originalRequest) {
            if (!refreshTokenPromise) {
                // Lấy refresh token từ localstorage (cho trường hợp localstorage)
                const refreshToken = localStorage.getItem('refreshToken');
                // Gọi API refresh token
                refreshTokenPromise = refreshTokenApi(refreshToken)
                    .then((res) => {
                        // Lấy và gán lại accessToken vào localstorage (cho trường hợp localstorage)
                        const { accessToken } = res.data;
                        localStorage.setItem('accessToken', accessToken);
                        authorizedAxiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;

                        // Đồng thời lưu ý là accessToken cũng đã được update lại ở cookie rồi nhé (Cho trường hợp Cookie)

                        // Bước cuối cùng Quan trong: return lại axios instance của chúng ta kết hợp cái originalRequest
                        // ...
                    })
                    .catch((error) => {
                        // Nếu nhận bất kỳ lỗi nào từ api refresh token thì cứ logout luôn
                        handleLogoutApi().then(() => {
                            // Nếu trường hợp dùng cookie thì nhớ xóa userInfo trong localstorage
                            // localStorage.removeItem('userInfo')

                            // Điều hướng tới trang Login sau khi Logout thành công, dùng JS thuần.
                            location.href = '/login';
                        });

                        return Promise.reject(error);
                    })
                    .finally(() => {
                        // Dù API refresh_token có thành công hay lỗi thì vẫn luôn gán lại cái refreshTokenPromise về null như ban đầu
                        refreshTokenPromise = null;
                    });
            }

            // Cuối cùng mới return cái refreshTokenPromise trong trường hợp success ở đây
            return refreshTokenPromise.then(() => {
                //Quan trong: return lại axios instance của chúng ta kết hợp cái originalRequest
                // để gọi lại những api ban đầu bị lỗi
                return authorizedAxiosInstance(originalRequest);
            });
        }

        // Mọi mã http status code nằm ngoài khoảng 200 - 299 sẽ là error và rơi vào đây
        // Xử lý tập trung phần hiển thị thông báo lỗi trả về từ mọi API ở đây (Mục đích: viết code 1 lần "clean code")
        // dùng toastify để hiển thị bất kể mọi mã lỗi lên màn hình - Ngoại trừ mã 410 - GONE phục vụ việc tự động refresh lại token
        if (error.response?.status !== 410) {
            toast.error(error.response?.data?.message || error?.message);
        }
        return Promise.reject(error);
    },
);

export default authorizedAxiosInstance;
