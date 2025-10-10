import { StatusCodes } from 'http-status-codes';
import ms from 'ms';
import { JwtProvider } from '~/providers/JwtProvider';
import dotenv from 'dotenv';
dotenv.config();
import { MOCK_USER_LEVEL_2 } from '~/models/mockDatabase-level-2';

// Mock nhanh thông tin user thay vì phải tạo Database rồi query.

/**
 * 2 cái chữ ký bí mật quan trọng trong dự án. Dành cho JWT - Jsonwebtokens
 * Lưu ý phải lưu vào biến môi trường ENV trong thực tế cho bảo mật.
 * Ở đây mình làm Demo thôi nên mới đặt biến const và giá trị random ngẫu nhiên trong code nhé.
 * Xem thêm về biến môi trường: https://youtu.be/Vgr3MWb7aOw
 */
const ACCESS_TOKEN_SECRET_SIGNATURE = process.env.ACCESS_TOKEN_SECRET_SIGNATURE;
const REFRESH_TOKEN_SECRET_SIGNATURE = process.env.REFRESH_TOKEN_SECRET_SIGNATURE;

const login = async (req, res) => {
    try {
        if (req.body.email !== MOCK_USER_LEVEL_2.EMAIL || req.body.password !== MOCK_USER_LEVEL_2.PASSWORD) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                message: 'Email hoặc Password không đúng.',
            });
            return;
        }

        // Trường hợp nhập đúng thông tin tài khoản, tạo token và trả về cho phía Client
        // Tạo thông tin payload để đính kèm trong JWT Token: bao gồm id và email của user
        const userInfo = {
            id: MOCK_USER_LEVEL_2.ID,
            email: MOCK_USER_LEVEL_2.EMAIL,
            role: MOCK_USER_LEVEL_2.ROLE,
        };

        // Tạo ra 2 loại token, accessToken và refreshToken để trả về cho phía FE
        const accessToken = await JwtProvider.generateToken(
            userInfo,
            ACCESS_TOKEN_SECRET_SIGNATURE,
            // 5, // 5 giây debug
            '1h',
        );
        const refreshToken = await JwtProvider.generateToken(
            userInfo,
            REFRESH_TOKEN_SECRET_SIGNATURE,
            // 15, // 15 giây
            '14 days',
        );

        /**
         * Xử lý trường hợp trả về httpOnly cookie cho phía trình duyệt
         * Về cái maxAge và thư viện ms
         * Đối với cái maxAge - thời gian sống của cookie thì chúng ta sẽ để tối đa 14 ngày, tùy dự án
         * Lưu ý: thời gian sống của cookie khác với cái thời gian sống của token
         */
        // res.cookie('accessToken', accessToken, {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'lax',
        //     maxAge: ms('14 days'),
        // });
        // res.cookie('refreshToken', refreshToken, {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'lax',
        //     maxAge: ms('14 days'),
        // });

        // Trả về thông tin user cũng như sẽ trả về Tokens cho trường hợp phía FE cần lưu Tokens vào Localstorage
        res.status(StatusCodes.OK).json({
            ...userInfo,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
    }
};

const logout = async (req, res) => {
    try {
        // Xóa cookie - đơn giản là làm ngược lại so với việc gán cookie ở hàm login
        // res.clearCookie('accessToken');
        // res.clearCookie('refreshToken');

        res.status(StatusCodes.OK).json({ message: 'Logout API success!' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
    }
};

const refreshToken = async (req, res) => {
    try {
        // Cách 01: Lấy refreshToken luôn từ Cookies đã đính kèm vào request
        // const refreshTokenFromCookie = req.cookies?.refreshToken;

        // Cách 02: Lấy refreshToken từ localstorage phía FE sẽ truyền vào body khi gọi API
        const refreshTokenFromBody = req.body?.refreshToken;

        // Verify / giải mã cái refreshToken xem có hợp lệ hay không?
        const refreshTokenDecoded = await JwtProvider.verifyToken(
            // refreshTokenFromCookie, // Dùng token theo cách 1 ở trên
            refreshTokenFromBody, // Dùng token theo cách 2 ở trên
            REFRESH_TOKEN_SECRET_SIGNATURE,
        );

        // Đoạn này vì chúng ta chỉ lưu những thông tin unique và cố định của user trong token rồi, vì vậy có thể
        // lấy luôn từ Decoded ra, tiết kiệm query vào DB để lấy data mới
        const userInfo = {
            id: refreshTokenDecoded.id,
            email: refreshTokenDecoded.email,
            role: refreshTokenDecoded.role,
        };

        // Tạo accessToken mới
        const accessToken = await JwtProvider.generateToken(
            userInfo,
            ACCESS_TOKEN_SECRET_SIGNATURE,
            // 5, // 5 giây debug
            '1h',
        );

        // Res lại cookie accessToken mới cho trường hợp sử dụng cookie
        // res.cookie('accessToken', accessToken, {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'lax',
        //     maxAge: ms('14 days'),
        // });

        // Res lại accessToken mới cho trường hợp FE cần update lại trong localstorage
        res.status(StatusCodes.OK).json({ accessToken });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Refresh Token API failed.',
        });
    }
};

export const userController = {
    login,
    logout,
    refreshToken,
};
