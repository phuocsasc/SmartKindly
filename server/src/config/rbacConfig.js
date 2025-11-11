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

    // Dashboard & cũ (giữ lại để tương thích)
    VIEW_DASHBOARD: 'view_dashboard',

    // Quản lý hồ sơ cán bộ
    VIEW_PERSONNEL_RECORDS: 'view_personnel_records',
    CREATE_PERSONNEL_RECORDS: 'create_personnel_records',
    UPDATE_PERSONNEL_RECORDS: 'update_personnel_records',
    DELETE_PERSONNEL_RECORDS: 'delete_personnel_records',

    // Quản lý đánh giá xếp loại cán bộ
    VIEW_PERSONNEL_EVALUATION: 'view_personnel_evaluation',
    CREATE_PERSONNEL_EVALUATION: 'create_personnel_evaluation',
    UPDATE_PERSONNEL_EVALUATION: 'update_personnel_evaluation',
    DELETE_PERSONNEL_EVALUATION: 'delete_personnel_evaluation',

    // Quản lý mục tiêu năm học theo từng độ tuổi
    VIEW_YEAR_TARGET: 'view_year_target',
    CREATE_YEAR_TARGET: 'create_year_target',
    UPDATE_YEAR_TARGET: 'update_year_target',
    DELETE_YEAR_TARGET: 'delete_year_target',

    // Quản lý hoạt động giáo dục theo từng mục tiêu
    VIEW_EDUCATION_ACTIVITY: 'view_education_activity',
    CREATE_EDUCATION_ACTIVITY: 'create_education_activity',
    UPDATE_EDUCATION_ACTIVITY: 'update_education_activity',
    DELETE_EDUCATION_ACTIVITY: 'delete_education_activity',

    // Quản lý các chủ để /sự kiện giáo dục
    VIEW_THEME_EVENT: 'view_theme_event',
    CREATE_THEME_EVENT: 'create_theme_event',
    UPDATE_THEME_EVENT: 'update_theme_event',
    DELETE_THEME_EVENT: 'delete_theme_event',

    // Quản lý thời khóa biểu
    VIEW_SCHEDULE: 'view_schedule',
    CREATE_SCHEDULE: 'create_schedule',
    UPDATE_SCHEDULE: 'update_schedule',
    DELETE_SCHEDULE: 'delete_schedule',

    // Quản lý kế hoạch giáo dục theo chủ đề
    VIEW_THEME_PLAN: 'view_theme_plan',
    CREATE_THEME_PLAN: 'create_theme_plan',
    UPDATE_THEME_PLAN: 'update_theme_plan',
    DELETE_THEME_PLAN: 'delete_theme_plan',

    // Quản lý kế hoạch giáo dục theo tháng / tuần
    VIEW_MONTHLY_PLAN: 'view_monthly_plan',
    CREATE_MONTHLY_PLAN: 'create_monthly_plan',
    UPDATE_MONTHLY_PLAN: 'update_monthly_plan',
    DELETE_MONTHLY_PLAN: 'delete_monthly_plan',
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
        PERMISSIONS.VIEW_PERSONNEL_RECORDS,
        PERMISSIONS.VIEW_PERSONNEL_EVALUATION,
        PERMISSIONS.VIEW_YEAR_TARGET,
        PERMISSIONS.VIEW_EDUCATION_ACTIVITY,
        PERMISSIONS.CREATE_EDUCATION_ACTIVITY,
        PERMISSIONS.UPDATE_EDUCATION_ACTIVITY,
        PERMISSIONS.DELETE_EDUCATION_ACTIVITY,
        PERMISSIONS.VIEW_THEME_EVENT,
        PERMISSIONS.CREATE_THEME_EVENT,
        PERMISSIONS.UPDATE_THEME_EVENT,
        PERMISSIONS.DELETE_THEME_EVENT,
        PERMISSIONS.VIEW_SCHEDULE,
        PERMISSIONS.VIEW_THEME_PLAN,
        PERMISSIONS.CREATE_THEME_PLAN,
        PERMISSIONS.UPDATE_THEME_PLAN,
        PERMISSIONS.DELETE_THEME_PLAN,
        PERMISSIONS.VIEW_MONTHLY_PLAN,
        PERMISSIONS.CREATE_MONTHLY_PLAN,
        PERMISSIONS.UPDATE_MONTHLY_PLAN,
        PERMISSIONS.DELETE_MONTHLY_PLAN,
    ],
    [ROLES.GIAO_VIEN]: [
        PERMISSIONS.VIEW_SCHOOL_INFO,
        PERMISSIONS.VIEW_ACADEMIC_YEAR,
        PERMISSIONS.VIEW_DEPARTMENT,
        PERMISSIONS.VIEW_CLASSROOM,
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_PERSONNEL_RECORDS,
        PERMISSIONS.VIEW_PERSONNEL_EVALUATION,
        PERMISSIONS.VIEW_YEAR_TARGET,
        PERMISSIONS.VIEW_EDUCATION_ACTIVITY,
        PERMISSIONS.CREATE_EDUCATION_ACTIVITY,
        PERMISSIONS.UPDATE_EDUCATION_ACTIVITY,
        PERMISSIONS.DELETE_EDUCATION_ACTIVITY,
        PERMISSIONS.VIEW_THEME_EVENT,
        PERMISSIONS.CREATE_THEME_EVENT,
        PERMISSIONS.UPDATE_THEME_EVENT,
        PERMISSIONS.DELETE_THEME_EVENT,
        PERMISSIONS.VIEW_SCHEDULE,
        PERMISSIONS.VIEW_THEME_PLAN,
        PERMISSIONS.CREATE_THEME_PLAN,
        PERMISSIONS.UPDATE_THEME_PLAN,
        PERMISSIONS.DELETE_THEME_PLAN,
        PERMISSIONS.VIEW_MONTHLY_PLAN,
        PERMISSIONS.CREATE_MONTHLY_PLAN,
        PERMISSIONS.UPDATE_MONTHLY_PLAN,
        PERMISSIONS.DELETE_MONTHLY_PLAN,
    ],
    [ROLES.KE_TOAN]: [PERMISSIONS.VIEW_SCHOOL_INFO, PERMISSIONS.VIEW_CLASSROOM, PERMISSIONS.VIEW_DASHBOARD],
    [ROLES.PHU_HUYNH]: [PERMISSIONS.VIEW_SCHOOL_INFO, PERMISSIONS.VIEW_DASHBOARD],
};
