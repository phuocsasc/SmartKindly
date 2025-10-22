export const ROLES = {
    ADMIN: 'admin',
    BAN_GIAM_HIEU: 'ban_giam_hieu',
    TO_TRUONG: 'to_truong',
    GIAO_VIEN: 'giao_vien',
    KE_TOAN: 'ke_toan',
    PHU_HUYNH: 'phu_huynh',
};

export const PERMISSIONS = {
    // Admin PERMISSIONS
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
};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.ADMIN_DASHBOARD,
        PERMISSIONS.ADMIN_MANAGE_SCHOOLS,
        PERMISSIONS.ADMIN_MANAGE_USERS,
        PERMISSIONS.ADMIN_MANAGE_CHATBOT,
        PERMISSIONS.ADMIN_DATA_BANK,
    ],

    [ROLES.BAN_GIAM_HIEU]: [
        // tất cả quyền ngoại trừ quyền admin hệ thống
        ...Object.values(PERMISSIONS).filter((permission) => !permission.startsWith('admin_')),
    ],
    [ROLES.TO_TRUONG]: [
        PERMISSIONS.VIEW_USERS,
        // Xem thông tin nhà trường
        PERMISSIONS.VIEW_SCHOOL_INFO,
        // Quản lý năm học (chỉ xem)
        PERMISSIONS.VIEW_ACADEMIC_YEAR,
        // Quản lý tổ bộ môn (chỉ xem)
        PERMISSIONS.VIEW_DEPARTMENT,
        // Quản lý lớp học (toàn quyền trong tổ của mình)
        PERMISSIONS.VIEW_CLASSROOM,
        PERMISSIONS.CREATE_CLASSROOM,
        PERMISSIONS.UPDATE_CLASSROOM,
        PERMISSIONS.DELETE_CLASSROOM,
    ],
    [ROLES.GIAO_VIEN]: [
        // Xem thông tin nhà trường
        PERMISSIONS.VIEW_SCHOOL_INFO,
        // Xem thông tin năm học
        PERMISSIONS.VIEW_ACADEMIC_YEAR,
        // Xem thông tin tổ bộ môn
        PERMISSIONS.VIEW_DEPARTMENT,
        // Xem thông tin lớp học (chỉ lớp của mình)
        PERMISSIONS.VIEW_CLASSROOM,
    ],
    [ROLES.KE_TOAN]: [
        // Xem thông tin nhà trường
        PERMISSIONS.VIEW_SCHOOL_INFO,
        // Xem danh sách lớp học (để quản lý học phí)
        PERMISSIONS.VIEW_CLASSROOM,
    ],
    [ROLES.PHU_HUYNH]: [
        // Xem thông tin nhà trường
        PERMISSIONS.VIEW_SCHOOL_INFO,
        // Chỉ xem thông tin cá nhân của con
        // Sẽ được handle riêng trong business logic
    ],
};
