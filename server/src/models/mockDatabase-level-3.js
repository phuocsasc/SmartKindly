// Level 3: Group Roles & Hierarchical RBAC
// Group Roles: một user có thể có nhiều vai trò (roles).
// Hierarchical RBAC: Vai trò có thể kế thừa lại từ vai trò khác.
// CRUD (Create, Read, Update, Delete)

export const MOCK_ROLES_LEVEL_3 = [
    // client
    {
        _id: 'role-client-sample-id-123456',
        name: 'client',
        permissions: [
            // support
            'create_support',
            'read_support',
            'update_support',
            'delete_support',
        ],
        inherits: [], // client không kế thừa permission từ role nào cả.
    },
    // moderator
    {
        _id: 'role-moderator-sample-id-123456',
        name: 'moderator',
        permissions: [
            // messages
            'create_messages',
            'read_messages',
            'update_messages',
            'delete_messages',
        ],
        inherits: ['client'], // moderator kế thừa permission từ client.
    },
    // admin
    {
        _id: 'role-admin-sample-id-123456',
        name: 'admin',
        permissions: [
            // admin-tools
            'create_admin_tools',
            'read_admin_tools',
            'update_admin_tools',
            'delete_admin_tools',
        ],
        inherits: ['client', 'moderator'], // admin kế thừa permission từ client và moderator.
    },
];

export const MOCK_USER_LEVEL_3 = {
    ID: 'Phuoc-dev-22102004',
    EMAIL: 'phuoctran.22102004@gmail.com',
    PASSWORD: 'phuocdev@123',
    // User lúc này có thể có nhiều roles, lưu ý nếu bạn muốn dùng cách level 3 này ở phía UI thì phần FE
    // ở bộ RBAC - FE trước cũng phải cập nhật lại cho chuẩn. Vì ở bộ trước thì FE đang xử lý theo cấu trúc mỗi user có một role.
    // ROLES: ['client'],
    ROLES: ['client', 'moderator'],
    // ROLES: ['client', 'moderator', 'admin'],
};
