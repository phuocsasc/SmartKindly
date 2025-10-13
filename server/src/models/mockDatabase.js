// Level 2: Vẫn là một user chỉ được gắn với một vai trò (role) duy nhất, nhưng mỗi role có thể có nhiều quyền hạn
// permissions  khác nhau chia nhỏ ra. CRUD (Create, Read, Update, Delete)

export const MOCK_ROLES = [
    // client
    {
        _id: 'role-client-sample-id-123456',
        name: 'client',
        permissions: ['create_support', 'read_support', 'update_support', 'delete_support'],
    },
    // moderator
    {
        _id: 'role-moderator-sample-id-123456',
        name: 'moderator',
        permissions: [
            'create_support',
            'read_support',
            'update_support',
            'delete_support',
            // messages
            'create_messages',
            'read_messages',
            'update_messages',
            'delete_messages',
        ],
    },
    // admin
    {
        _id: 'role-admin-sample-id-123456',
        name: 'admin',
        permissions: [
            'create_support',
            'read_support',
            'update_support',
            'delete_support',
            // messages
            'create_messages',
            'read_messages',
            'update_messages',
            'delete_messages',
            // admin-tools
            'create_admin_tools',
            'read_admin_tools',
            'update_admin_tools',
            'delete_admin_tools',
        ],
    },
];

export const MOCK_USER = {
    ID: 'Phuoc-dev-22102004',
    username: 'phuoctran.22102004@gmail.com',
    PASSWORD: 'phuocdev@123',
    ROLE: 'moderator', // Role phải là unique và ăn theo đúng name với bằng role trong DB như trên
};
