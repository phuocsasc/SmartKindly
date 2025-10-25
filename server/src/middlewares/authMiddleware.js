import { StatusCodes } from 'http-status-codes';
import { JwtProvider } from '~/providers/JwtProvider';
import dotenv from 'dotenv';
import { UserModel } from '~/models/userModel';
dotenv.config();

// Middleware này sẽ đảm nhiệm việc quan trọng: Lấy và xác thực cái JWT accessToken nhận được từ phía FE có hơp lệ hay không
const isAuthorized = async (req, res, next) => {
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
            accessTokenFromHeader.substring('Bearer '.length), // Dùng token theo cách 02 ở trên
            process.env.ACCESS_TOKEN_SECRET_SIGNATURE,
        );
        // console.log('accessTokenDecoded: ', accessTokenDecoded);

        // 🔍 Đảm bảo lấy thông tin user mới nhất từ DB
        const dbUser = await UserModel.findById(accessTokenDecoded.id).select('schoolId role isRoot');
        if (!dbUser) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Người dùng không tồn tại hoặc đã bị xóa' });
        }

        // ✅ Gộp thông tin token + DB (ưu tiên DB)
        // Bước 02: Quan trọng: Nếu như token hợp lệ, thì sẽ cần phải lưu thông tin giải mã được
        // vào cái req.jwtDecoded, để sử dụng cho các tầng cần xử lý ở phía sau
        req.jwtDecoded = {
            ...accessTokenDecoded,
            schoolId: dbUser.schoolId,
            role: dbUser.role,
            isRoot: dbUser.isRoot,
        };

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
