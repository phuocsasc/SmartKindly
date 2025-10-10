import { MOCK_ROLES_LEVEL_3 } from '~/models/mockDatabase-level-3';

// Lấy tất cả quyền (permissions) của một role, bao gồm quyền kế thừa
export const getPermissionsFromRole = async (rolename) => {
    // Thực tế bước này sẽ await vào DB bảng roles để lấy role từ Database nên cứ để func là async
    const role = MOCK_ROLES_LEVEL_3.find((item) => item.name === rolename);
    // Nếu role không tồn tại thì trả về mảng rổng, nghĩa là user không có quyền gì cả.
    if (!role) return [];

    // Đối với các thao tác cần hiệu suất cao khi duyệt qua các phần tử thì dùng Set oject để tối ưu hiệu năng
    // xử lý (tìm kiếm / thêm / sửa / xóa) hơn xử lý array thông thường
    // Ví dụ Array.includes() sẽ chậm: 0(n) nếu so với Set.has() có độ phức tạp 0(1)
    let permissions = new Set(role.permissions);

    // Xữ lý kế thừa quyền nếu như role có tồn tại filed inherits với dữ liệu
    if (Array.isArray(role.inherits) && role.inherits.length > 0) {
        for (const inheritedRoleName of role.inherits) {
            // Đệ qui lại chính function này để lấy toàn bộ quyền kế thừa của role hiện tại.
            const inheritedPermissions = await getPermissionsFromRole(inheritedRoleName);
            inheritedPermissions.forEach((item) => permissions.add(item));
        }
    }

    // Trả về kết quả là một mảng các permission nên sẽ dùng Array.from() vì permissions đang ở dạng Set object.
    return Array.from(permissions);
};
