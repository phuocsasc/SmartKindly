import { StatusCodes } from 'http-status-codes';
import { getPermissionsFromRole } from '~/utils/rbacUtils';

// Level 3: Group Roles & Hierarchical RBAC
// Group Roles: một user có thể có nhiều vai trò (roles).
// Hierarchical RBAC: Vai trò có thể kế thừa lại từ vai trò khác.
// CRUD (Create, Read, Update, Delete)
// Nhận vào requiredPermissions là một mảng những permissions được phép truy cập vào API.
const isValidPermission = (requiredPermissions) => async (req, res, next) => {
    try {
        // Bước 01: Phải hiểu được luồng: middleware RBAC sẽ luôn chạy sau authMiddleware,
        // vì vậy đảm bảo JWT token phải hợp lệ và đã có dữ liệu decoded
        console.log(req.jwtDecoded);

        // Bước 02: Lấy role của user trong dữ liệu payload decoded của jwt token.
        // Lưu ý tùy vào từng loại dự án, nếu sẳn sàng đánh đổi về hiệu năng thì có những dự án sẽ truy cập vào DB
        // ở bước này để lấy full thông tin user (bao gồm role) từ DB ra và sử dụng
        const userRoles = req.jwtDecoded.role;

        // Bước 03: Kiểm tra role, user bắt buộc phải có ít nhất một role theo như định nghĩa của dự án
        if (!Array.isArray(userRoles) || userRoles.length === 0) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbiden: có vấn đề với role của bạn!' });
            return;
        }

        // Bước 04: Dựa theo mảng userRoles của user rồi tìm tiếp trong database để lấy đầy đủ thông tin của role đó
        // Đối với các thao tác cần hiệu suất cao khi duyệt qua các phần tử thì dùng Set oject để tối ưu hiệu năng
        // xử lý (tìm kiếm / thêm / sửa / xóa) hơn xử lý array thông thường
        // Ví dụ Array.includes() sẽ chậm: 0(n) nếu so với Set.has() có độ phức tạp 0(1)
        let userPermissions = new Set();
        for (const roleName of userRoles) {
            const rolePermissions = await getPermissionsFromRole(roleName);
            rolePermissions.forEach((item) => userPermissions.add(item));
        }
        console.log('userPermission', userPermissions);
        console.log('userPermission: ', Array.from(userPermissions));

        // Bước 05: kiểm tra quyền truy cập.
        // Lưu ý nếu không cung cấp mảng requiredPermissions hoặc mảng requiredPermissions là rổng thì
        // ý nghĩa ở đây thường là không check quyền => luôn cho phép truy cập API
        // Hàm every của js sẽ luôn trả về true nếu như mảng sử dụng là rổng
        const hasPermission = requiredPermissions?.every((item) => userPermissions.has(item));
        if (!hasPermission) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbiden: bạn không đủ quyền truy cập tới API này' });
            return;
        }

        // Bước 06: Nếu role hợp lệ thì cho phép request đi tiếp (sang controller)
        next();
    } catch (error) {
        console.log('Error from rbacMiddleware_Level_3: ', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Oops! Something went wrong.' });
    }
};

export const rbacMiddleware_Level_3 = { isValidPermission };
