// Level 1: Đơn giản nhất và cũng khá phổ biến, đó là một user chỉ được gắn với một quyền hạn duy nhất.

export const MOCK_ROLES_LEVEL_1 = {
    CLIENT: 'client',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
};
export const MOCK_USER_LEVEL_1 = {
    ID: 'Phuoc-dev-22102004',
    EMAIL: 'phuoctran.22102004@gmail.com',
    PASSWORD: 'phuocdev@123',
    ROLE: MOCK_ROLES_LEVEL_1.MODERATOR,
};
