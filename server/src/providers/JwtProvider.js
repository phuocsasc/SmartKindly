import JWT from 'jsonwebtoken';

/**
 * Funtion tạo mới một JWT Token. - Cần 3 tham số đầu vào:
 * 1. userInfo: Những thông tin muốn lưu trong Token.
 * 2. secretSignature: Chử ký bí mật (dạng một chuỗi string ngẫu nhiên)
 * 3. options: Các tùy chọn cho Token (thời gian sống của Token).
 *
 * Funtion xác thực một JWT Token có hợp lệ hay không. - Cần 2 tham số đầu vào:
 * 1. token: Chuỗi JWT Token cần xác thực.
 * 2. secretKey: Chuỗi bí mật dùng để ký Token.
 *
 * Cả hai function đều trả về một Promise:
 * - Nếu thành công, Promise sẽ resolve với kết quả (Token mới hoặc dữ liệu giải mã).
 * - Nếu thất bại, Promise sẽ reject với lỗi.
 */
const generateToken = async (userInfo, secretSignature, tokenLife) => {
    try {
        // Hàm sign() của jsonwebtoken để tạo token
        const token = JWT.sign(userInfo , secretSignature, {
            algorithm: 'HS256',
            expiresIn: tokenLife,
        });
        return token;

    } catch (error) { throw new Error(error) }
};

const verifyToken = async (token, secretSignature) => {
    try {
        // Hàm verify() của jsonwebtoken để xác thực token
        const decoded = JWT.verify(token, secretSignature);
        return decoded;
        
    } catch (error) { throw new Error(error) }
};

export const JwtProvider = {
    generateToken,
    verifyToken,
};
