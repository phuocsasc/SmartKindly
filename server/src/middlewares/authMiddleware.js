import { StatusCodes } from 'http-status-codes';
import { JwtProvider } from '~/providers/JwtProvider';
import dotenv from 'dotenv';
dotenv.config();

// Middleware này sẽ đảm nhiệm việc quan trọng: Lấy và xác thực cái JWT accessToken nhận được từ phía FE có hơp lệ hay không
const isAuthorized = async (req, res, next) => {
    // DÙng 1 cách thôi
    // Cách 1: Lấy accessToken nằm trong request cookies phía client - withCredentials trong file authorizeAxios và credentials trong CORS
    // const accessTokenFromCookie = req.cookies?.accessToken;
    // if (!accessTokenFromCookie) {
    //     res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized! (Token not found)' });
    //     return;
    // }
    // console.log('accessTokenFromCookie: ', accessTokenFromCookie);
    // console.log('-----');

    // Cách 2: Lấy accessToken trong trường hợp phía FE lưu localstorage và gửi lên thông qua header authorization
    const accessTokenFromHeader = req.headers.authorization;
    if (!accessTokenFromHeader) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized! (Token not found)' });
        return;
    }
    // console.log('accessTokenFromHeader: ', accessTokenFromHeader);
    // console.log('-----');
    try {
        // Bước 01: Thực hiện giải mã token xem nó có hợp lệ hay là không
        const accessTokenDecoded = await JwtProvider.verifyToken(
            // accessTokenFromCookie,                          // Dùng token theo cách 01 ở trên
            accessTokenFromHeader.substring('Bearer '.length), // Dùng token theo cách 02 ở trên
            process.env.ACCESS_TOKEN_SECRET_SIGNATURE,
        );
        // console.log('accessTokenDecoded: ', accessTokenDecoded);

        // Bước 02: Quan trọng: Nếu như token hợp lệ, thì sẽ cần phải lưu thông tin giải mã được
        // vào cái req.jwtDecoded, để sử dụng cho các tầng cần xử lý ở phía sau
        req.jwtDecoded = accessTokenDecoded;

        // Bước 03: cho phép cải request đi tiếp
        next();
    } catch (error) {
        //   console.log('Error from authMiddleware: ', error);

        // Trường hợp lỗi 01: Nếu accessToken nó bị hết hạn (expired) thì mình cần trả về một cái mã lỗi
        // GONE - 410 cho phía FE biết để gọi api refreshToken
        if (error.message?.includes('jwt expired')) {
            res.status(StatusCodes.GONE).json({ message: 'Need to refresh token' });
            return;
        }

        // Trường hợp lỗi 02: Nếu như cái accessToken nó không hợp lệ do bất kỳ điều gì khác trường hợp hết hạn
        // thì chúng ta cứ thẳng tay trả về mã 401 cho phía FE xử lý Logout / hoặc gọi API Logout tùy trường hợp
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized! please login.' });
    }
};

export const authMiddleware = { isAuthorized };
