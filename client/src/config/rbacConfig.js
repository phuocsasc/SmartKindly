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

    VIEW_HISTORY: 'view_history',
    CREATE_HISTORY: 'create_history',
    DELETE_HISTORY: 'delete_history',

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

    // Quản lý thời khóa biểu
    VIEW_SCHEDULE: 'view_schedule',
    CREATE_SCHEDULE: 'create_schedule',
    UPDATE_SCHEDULE: 'update_schedule',
    DELETE_SCHEDULE: 'delete_schedule',

    // Quản lý kế hoạch giáo dục theo tháng / tuần
    VIEW_MONTHLY_PLAN: 'view_monthly_plan',
    CREATE_MONTHLY_PLAN: 'create_monthly_plan',
    UPDATE_MONTHLY_PLAN: 'update_monthly_plan',
    DELETE_MONTHLY_PLAN: 'delete_monthly_plan',

    //Quản lý hồ sơ trẻ em
    VIEW_CHILDREN_PROFILE: 'view_children_profile',
    CREATE_CHILDREN_PROFILE: 'create_children_profile',
    UPDATE_CHILDREN_PROFILE: 'update_children_profile',
    DELETE_CHILDREN_PROFILE: 'delete_children_profile',

    //Quản lý điểm danh trẻ em
    VIEW_CHILDREN_ATTENDANCE: 'view_children_attendance',
    CREATE_CHILDREN_ATTENDANCE: 'create_children_attendance',
    UPDATE_CHILDREN_ATTENDANCE: 'update_children_attendance',
    DELETE_CHILDREN_ATTENDANCE: 'delete_children_attendance',

    //Quản lý đánh giá trẻ em
    VIEW_CHILDREN_ASSESSMENT: 'view_children_assessment',
    CREATE_CHILDREN_ASSESSMENT: 'create_children_assessment',
    UPDATE_CHILDREN_ASSESSMENT: 'update_children_assessment',
    DELETE_CHILDREN_ASSESSMENT: 'delete_children_assessment',

    // Quản lý Phiếu bé ngoan
    VIEW_CHILDREN_CERTIFICATE: 'view_children_certificate',
    CREATE_CHILDREN_CERTIFICATE: 'create_children_certificate',
    UPDATE_CHILDREN_CERTIFICATE: 'update_children_certificate',
    DELETE_CHILDREN_CERTIFICATE: 'delete_children_certificate',

    // Quản lý Đánh giá trẻ hoàn thành chương trình
    VIEW_CHILDREN_PROGRAM_COMPLETE: 'view_children_program_complete',
    CREATE_CHILDREN_PROGRAM_COMPLETE: 'create_children_program_complete',
    UPDATE_CHILDREN_PROGRAM_COMPLETE: 'update_children_program_complete',
    DELETE_CHILDREN_PROGRAM_COMPLETE: 'delete_children_program_complete',

    // Quản lý thực phẩm
    VIEW_FOOD: 'view_food',
    CREATE_FOOD: 'create_food',
    UPDATE_FOOD: 'update_food',
    DELETE_FOOD: 'delete_food',

    // Quản lý định mức dinh dưỡng
    VIEW_NUTRITIONAL_STANDARDS: 'view_nutritional_standards',
    UPDATE_NUTRITIONAL_STANDARDS: 'update_nutritional_standards',

    // Quản lý tiền dịch vụ
    VIEW_SERVICE_CHARGE: 'view_service_charge',
    CREATE_SERVICE_CHARGE: 'create_service_charge',
    UPDATE_SERVICE_CHARGE: 'update_service_charge',
    DELETE_SERVICE_CHARGE: 'delete_service_charge',

    // Quản lý món ăn
    VIEW_MEAL: 'view_meal',
    CREATE_MEAL: 'create_meal',
    UPDATE_MEAL: 'update_meal',
    DELETE_MEAL: 'delete_meal',

    // Quản lý thực đơn
    VIEW_MENU: 'view_menu',
    CREATE_MENU: 'create_menu',
    UPDATE_MENU: 'update_menu',
    DELETE_MENU: 'delete_menu',

    // Quản lý thực đơn áp dụng
    VIEW_MENU_APPLY: 'view_menu_apply',
    CREATE_MENU_APPLY: 'create_menu_apply',
    UPDATE_MENU_APPLY: 'update_menu_apply',
    DELETE_MENU_APPLY: 'delete_menu_apply',
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
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_PERSONNEL_RECORDS,
        PERMISSIONS.VIEW_PERSONNEL_EVALUATION,
        PERMISSIONS.VIEW_YEAR_TARGET,
        PERMISSIONS.VIEW_EDUCATION_ACTIVITY,
        PERMISSIONS.CREATE_EDUCATION_ACTIVITY,
        PERMISSIONS.UPDATE_EDUCATION_ACTIVITY,
        PERMISSIONS.DELETE_EDUCATION_ACTIVITY,
        PERMISSIONS.VIEW_SCHEDULE,

        PERMISSIONS.CREATE_HISTORY,
        PERMISSIONS.VIEW_HISTORY,

        PERMISSIONS.VIEW_MONTHLY_PLAN,
        PERMISSIONS.CREATE_MONTHLY_PLAN,
        PERMISSIONS.UPDATE_MONTHLY_PLAN,
        PERMISSIONS.DELETE_MONTHLY_PLAN,

        PERMISSIONS.VIEW_CHILDREN_PROFILE,
        PERMISSIONS.CREATE_CHILDREN_PROFILE,
        PERMISSIONS.UPDATE_CHILDREN_PROFILE,
        PERMISSIONS.DELETE_CHILDREN_PROFILE,

        PERMISSIONS.VIEW_CHILDREN_ATTENDANCE,
        PERMISSIONS.CREATE_CHILDREN_ATTENDANCE,
        PERMISSIONS.UPDATE_CHILDREN_ATTENDANCE,
        PERMISSIONS.DELETE_CHILDREN_ATTENDANCE,

        PERMISSIONS.VIEW_CHILDREN_ASSESSMENT,
        PERMISSIONS.CREATE_CHILDREN_ASSESSMENT,
        PERMISSIONS.UPDATE_CHILDREN_ASSESSMENT,
        PERMISSIONS.DELETE_CHILDREN_ASSESSMENT,

        PERMISSIONS.VIEW_CHILDREN_CERTIFICATE,
        PERMISSIONS.CREATE_CHILDREN_CERTIFICATE,
        PERMISSIONS.UPDATE_CHILDREN_CERTIFICATE,
        PERMISSIONS.DELETE_CHILDREN_CERTIFICATE,

        PERMISSIONS.VIEW_CHILDREN_PROGRAM_COMPLETE,
        PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE,
        PERMISSIONS.UPDATE_CHILDREN_PROGRAM_COMPLETE,
        PERMISSIONS.DELETE_CHILDREN_PROGRAM_COMPLETE,

        PERMISSIONS.VIEW_FOOD,
        PERMISSIONS.VIEW_MEAL,
        PERMISSIONS.VIEW_MENU,
        PERMISSIONS.VIEW_MENU_APPLY,
        PERMISSIONS.VIEW_NUTRITIONAL_STANDARDS,
        PERMISSIONS.VIEW_SERVICE_CHARGE,
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
        PERMISSIONS.VIEW_SCHEDULE,

        PERMISSIONS.CREATE_HISTORY,
        PERMISSIONS.VIEW_HISTORY,

        PERMISSIONS.VIEW_MONTHLY_PLAN,
        PERMISSIONS.CREATE_MONTHLY_PLAN,
        PERMISSIONS.UPDATE_MONTHLY_PLAN,
        PERMISSIONS.DELETE_MONTHLY_PLAN,

        PERMISSIONS.VIEW_CHILDREN_PROFILE,
        PERMISSIONS.CREATE_CHILDREN_PROFILE,
        PERMISSIONS.UPDATE_CHILDREN_PROFILE,
        PERMISSIONS.DELETE_CHILDREN_PROFILE,

        PERMISSIONS.VIEW_CHILDREN_ATTENDANCE,
        PERMISSIONS.CREATE_CHILDREN_ATTENDANCE,
        PERMISSIONS.UPDATE_CHILDREN_ATTENDANCE,
        PERMISSIONS.DELETE_CHILDREN_ATTENDANCE,

        PERMISSIONS.VIEW_CHILDREN_ASSESSMENT,
        PERMISSIONS.CREATE_CHILDREN_ASSESSMENT,
        PERMISSIONS.UPDATE_CHILDREN_ASSESSMENT,
        PERMISSIONS.DELETE_CHILDREN_ASSESSMENT,

        PERMISSIONS.VIEW_CHILDREN_CERTIFICATE,
        PERMISSIONS.CREATE_CHILDREN_CERTIFICATE,
        PERMISSIONS.UPDATE_CHILDREN_CERTIFICATE,
        PERMISSIONS.DELETE_CHILDREN_CERTIFICATE,

        PERMISSIONS.VIEW_CHILDREN_PROGRAM_COMPLETE,
        PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE,
        PERMISSIONS.UPDATE_CHILDREN_PROGRAM_COMPLETE,
        PERMISSIONS.DELETE_CHILDREN_PROGRAM_COMPLETE,

        PERMISSIONS.VIEW_FOOD,
        PERMISSIONS.VIEW_MEAL,
        PERMISSIONS.VIEW_MENU,
        PERMISSIONS.VIEW_MENU_APPLY,
        PERMISSIONS.VIEW_NUTRITIONAL_STANDARDS,
        PERMISSIONS.VIEW_SERVICE_CHARGE,
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
