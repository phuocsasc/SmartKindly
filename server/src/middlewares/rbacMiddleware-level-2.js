import { StatusCodes } from 'http-status-codes';
import { MOCK_ROLES_LEVEL_2 } from '~/models/mockDatabase-level-2';

// Middleware Level 2 phức tạp hơn Level 1: lúc này chúng ta sẽ nhận tham số đầu vào là
// một mảng permission được phép truy cập vào API.
// Nhận vào requiredPermissions là một mảng những permissions được phép truy cập vào API.
const isValidPermission = (requiredPermissions) => async (req, res, next) => {
    try {
        // Bước 01: Phải hiểu được luồng: middleware RBAC sẽ luôn chạy sau authMiddleware,
        // vì vậy đảm bảo JWT token phải hợp lệ và đã có dữ liệu decoded
        console.log(req.jwtDecoded);

        // Bước 02: Lấy role của user trong dữ liệu payload decoded của jwt token.
        // Lưu ý tùy vào từng loại dự án, nếu sẳn sàng đánh đổi về hiệu năng thì có những dự án sẽ truy cập vào DB
        // ở bước này để lấy full thông tin user (bao gồm role) từ DB ra và sử dụng
        const userRole = req.jwtDecoded.role;

        // Bước 03: Kiểm tra role.
        if (!userRole) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbiden: có vấn đề với role của bạn!' });
            return;
        }

        // Bước 04: Dựa theo role của user rồi tìm tiếp trong database để lấy đầy đủ thông tin của role đó
        const fullUserRole = MOCK_ROLES_LEVEL_2.find((item) => item.name === userRole);
        console.log('fullUserRole', fullUserRole);
        if (!fullUserRole) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbiden: không tồn tại role của bạn trong hệ thống' });
            return;
        }

        // Bước 05: kiểm tra quyền truy cập.
        // Lưu ý nếu không cung cấp mảng requiredPermissions hoặc mảng requiredPermissions là rổng thì
        // ý nghĩa ở đây thường là không check quyền => luôn cho phép truy cập API
        // Hàm every của js sẽ luôn trả về true nếu như mảng sử dụng là rổng
        const hasPermission = requiredPermissions?.every((item) => fullUserRole.permissions.includes(item));
        if (!hasPermission) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbiden: bạn không đủ quyền truy cập tới API này' });
            return;
        }

        // Bước 06: Nếu role hợp lệ thì cho phép request đi tiếp (sang controller)
        next();
    } catch (error) {
        console.log('Error from rbacMiddleware_Level_2: ', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Oops! Something went wrong.' });
    }
};

export const rbacMiddleware_Level_2 = { isValidPermission };
