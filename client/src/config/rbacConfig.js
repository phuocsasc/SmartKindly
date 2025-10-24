export const ROLES = {
    ADMIN: 'admin',
    BAN_GIAM_HIEU: 'ban_giam_hieu',
    TO_TRUONG: 'to_truong',
    GIAO_VIEN: 'giao_vien',
    KE_TOAN: 'ke_toan',
    PHU_HUYNH: 'phu_huynh',
};

export const PERMISSIONS = {
    // Quyền admin hệ thống
    ADMIN_DASHBOARD: 'admin_dashboard',
    ADMIN_MANAGE_SCHOOLS: 'admin_manage_schools',
    ADMIN_MANAGE_USERS: 'admin_manage_users',
    ADMIN_MANAGE_CHATBOT: 'admin_manage_chatbot',
    ADMIN_DATA_BANK: 'admin_data_bank',

    // Quản lý tài khoản người dùng
    VIEW_USERS: 'view_users',
    CREATE_USER: 'create_user',
    UPDATE_USER: 'update_user',
    DELETE_USER: 'delete_user',

    // Quản lý thông tin nhà trường
    VIEW_SCHOOL_INFO: 'view_school_info',
    CREATE_SCHOOL_INFO: 'create_school_info',
    UPDATE_SCHOOL_INFO: 'update_school_info',
    DELETE_SCHOOL_INFO: 'delete_school_info',

    // Quản lý khai báo năm học
    VIEW_ACADEMIC_YEAR: 'view_academic_year',
    CREATE_ACADEMIC_YEAR: 'create_academic_year',
    UPDATE_ACADEMIC_YEAR: 'update_academic_year',
    DELETE_ACADEMIC_YEAR: 'delete_academic_year',

    // Quản lý khai báo tổ bộ môn
    VIEW_DEPARTMENT: 'view_department',
    CREATE_DEPARTMENT: 'create_department',
    UPDATE_DEPARTMENT: 'update_department',
    DELETE_DEPARTMENT: 'delete_department',

    // Quản lý khai báo lớp học
    VIEW_CLASSROOM: 'view_classroom',
    CREATE_CLASSROOM: 'create_classroom',
    UPDATE_CLASSROOM: 'update_classroom',
    DELETE_CLASSROOM: 'delete_classroom',

    // Dashboard & cũ (giữ lại để tương thích)
    VIEW_DASHBOARD: 'view_dashboard',
};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.ADMIN_DASHBOARD,
        PERMISSIONS.ADMIN_MANAGE_SCHOOLS,
        PERMISSIONS.ADMIN_MANAGE_USERS,
        PERMISSIONS.ADMIN_MANAGE_CHATBOT,
        PERMISSIONS.ADMIN_DATA_BANK,
    ],
    // tất cả quyền ngoại trừ quyền admin hệ thống
    [ROLES.BAN_GIAM_HIEU]: [...Object.values(PERMISSIONS).filter((permission) => !permission.startsWith('admin_'))],
    [ROLES.TO_TRUONG]: [
        // PERMISSIONS.VIEW_USERS,
        PERMISSIONS.VIEW_SCHOOL_INFO,
        PERMISSIONS.VIEW_ACADEMIC_YEAR,
        PERMISSIONS.VIEW_DEPARTMENT,
        PERMISSIONS.VIEW_CLASSROOM,
        PERMISSIONS.CREATE_CLASSROOM,
        PERMISSIONS.UPDATE_CLASSROOM,
        PERMISSIONS.DELETE_CLASSROOM,
        PERMISSIONS.VIEW_DASHBOARD,
    ],
    [ROLES.GIAO_VIEN]: [
        PERMISSIONS.VIEW_SCHOOL_INFO,
        PERMISSIONS.VIEW_ACADEMIC_YEAR,
        PERMISSIONS.VIEW_DEPARTMENT,
        PERMISSIONS.VIEW_CLASSROOM,
        PERMISSIONS.VIEW_DASHBOARD,
    ],
    [ROLES.KE_TOAN]: [PERMISSIONS.VIEW_SCHOOL_INFO, PERMISSIONS.VIEW_CLASSROOM, PERMISSIONS.VIEW_DASHBOARD],
    [ROLES.PHU_HUYNH]: [PERMISSIONS.VIEW_SCHOOL_INFO, PERMISSIONS.VIEW_DASHBOARD],
};

// Helper function để map giữa role tiếng Việt và code
export const ROLE_DISPLAY = {
    [ROLES.ADMIN]: 'Quản trị viên hệ thống',
    [ROLES.BAN_GIAM_HIEU]: 'Ban giám hiệu',
    [ROLES.TO_TRUONG]: 'Tổ trưởng',
    [ROLES.GIAO_VIEN]: 'Giáo viên',
    [ROLES.KE_TOAN]: 'Kế toán',
    [ROLES.PHU_HUYNH]: 'Phụ huynh',
};

export const ROLE_CODE = {
    'Quản trị viên hệ thống': ROLES.ADMIN,
    'Ban giám hiệu': ROLES.BAN_GIAM_HIEU,
    'Tổ trưởng': ROLES.TO_TRUONG,
    'Giáo viên': ROLES.GIAO_VIEN,
    'Kế toán': ROLES.KE_TOAN,
    'Phụ huynh': ROLES.PHU_HUYNH,
};
