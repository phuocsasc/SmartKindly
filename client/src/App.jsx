import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from '~/pages/Auth/Login';
import Dashboard from '~/pages/School/Dashboard/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import NotFound from '~/pages/ErrorPage/NotFound';
import AccessDenied from '~/pages/ErrorPage/AccessDenied';
import RbacRoute from '~/components/core/RbacRoute';
import { PERMISSIONS } from '~/config/rbacConfig';
import { UserProvider, useUser } from '~/contexts/UserContext';
import { NotificationProvider } from '~/contexts/NotificationContext';

// Admin
import AdminInfo from '~/pages/Admin/AdminInfo';
import AdminSchoolManagement from '~/pages/Admin/SchoolsManagement/AdminSchoolManagement';
import AdminUserManagement from '~/pages/Admin/UsersManagement/AdminUserManagement';
import AdminYearTarget from '~/pages/Admin/DataBank/YearTarget/AdminYearTarget';
import EducationalActivity from '~/pages/Admin/DataBank/ThemePlan/EducationalActivity';
import AdminFood from '~/pages/Admin/DataBank/Food/AdminFood';
import AdminMeal from '~/pages/Admin/DataBank/Meal/AdminMeal';
import AdminMenu from '~/pages/Admin/DataBank/Menu/AdminMenu';
import AdminNutritionalStandards from '~/pages/Admin/DataBank/NutritionalStandards/AdminNutritionalStandards';

// Users
import UserManagement from '~/pages/School/Users/UserManagement';
import UsersParents from '~/pages/School/UsersParents/UsersParents';
import UserInfo from '~/pages/School/Users/UserInfo';
import ForgotPassword from '~/pages/Auth/ForgotPassword';

// Data-Declaration
import SchoolInfo from '~/pages/School/DataDeclaration/SchoolInfo';
import AcademicYear from '~/pages/School/DataDeclaration/AcademicYear/AcademicYear';
import Department from '~/pages/School/DataDeclaration/Department/Department';
import Classes from '~/pages/School/DataDeclaration/Classes/Classes';
import History from '~/pages/School/DataDeclaration/History';

// ✅ Quản lý cán bộ
import PersonnelRecord from '~/pages/School/Personnel/PersonnelRecord/PersonnelRecord';
import PersonnelEvaluation from '~/pages/School/Personnel/PersonnelEvaluation/PersonnelEvaluation';

// Quản lý kế hoạch giáo dục
import YearTarget from '~/pages/School/EducationPlan/YearTarget/YearTarget';
import SchoolEducationalActivity from '~/pages/School/EducationPlan/EducationalActivity/EducationalActivity';
import Schedule from '~/pages/School/EducationPlan/Schedule/Schedule';
import WeeklyPlan from './pages/School/EducationPlan/WeeklyPlan/WeeklyPlan';

// Quản lý trẻ em
import ChildrenManagement from '~/pages/School/Children/ChildrenManagement/ChildrenManagement';
import ChildrenByClass from './pages/School/Children/ChildrenByClass/ChildrenByClass';
import ChildrenProfile from '~/pages/School/Children/ChildrenProfile/ChildrenProfile';
import ChildrenAttendance from '~/pages/School/Children/ChildrenAttendance/ChildrenAttendance';
import ChildrenAssessment from '~/pages/School/Children/ChildrenAssessment/ChildrenAssessment';
import ChildrenCertificate from '~/pages/School/Children/ChildrenCertificate/ChildrenCertificate';
import ChildrenProgramComplete from '~/pages/School/Children/ChildrenProgramComplete/ChildrenProgramComplete';

// Dinh dưỡng
import Food from '~/pages/School/Nutrition/Food/Food';
import Meal from '~/pages/School/Nutrition/Meal/Meal';
import Menu from '~/pages/School/Nutrition/Menu/Menu';
import MenuApply from '~/pages/School/Nutrition/MenuApply/MenuApply';
import NutritionalStandards from '~/pages/School/Nutrition/Standard/NutritionalStandards';
import ServiceCharge from '~/pages/School/Nutrition/ServiceCharge/ServiceCharge';

import SchoolParentRequest from '~/pages/School/ParentRequest/SchoolParentRequest';

// Parent
import ParentDashboard from '~/pages/Parent/Dashboard/Dashboard';
import ParentInfo from './pages/Parent/ParentInfo';
import Attendance from './pages/Parent/ViewInfo/Attendance';
import Children from './pages/Parent/ViewInfo/Children';
import CompletionAssessment from './pages/Parent/ViewInfo/CompletionAssessment';
import DailyAssessment from './pages/Parent/ViewInfo/DailyAssessment';
import ParentSchedule from './pages/Parent/ViewInfo/Schedule';
import School from './pages/Parent/ViewInfo/School';
import WeeklyCertificate from './pages/Parent/ViewInfo/WeeklyCertificate';
import WeeklyMenu from './pages/Parent/ViewInfo/WeeklyMenu';
import ParentRequest from './pages/Parent/ParentRequest/ParentRequest';
import Chatbot from './pages/Parent/Chatbot';

/**
 * Protected Routes với UserContext
 */
const ProtectedRoutes = () => {
    const { user } = useUser();

    if (!user) {
        return <Navigate to="/login" replace={true} />;
    }
    return <Outlet />;
};

const UnauthorizedRoutes = () => {
    const { user } = useUser();

    if (user) {
        return <Navigate to="/dashboard" replace={true} />;
    }
    return <Outlet />;
};

function AppContent() {
    const { user } = useUser();
    return (
        <NotificationProvider user={user}>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace={true} />} />

                <Route element={<UnauthorizedRoutes />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                <Route element={<ProtectedRoutes />}>
                    {/* Admin Routes - Chỉ cho phép role ADMIN */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.ADMIN_DASHBOARD} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.ADMIN_MANAGE_SCHOOLS} />}>
                        <Route path="/admin/school-management" element={<AdminSchoolManagement />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.ADMIN_MANAGE_USERS} />}>
                        <Route path="/admin/users-management" element={<AdminUserManagement />} />
                    </Route>

                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.ADMIN_DATA_BANK} />}>
                        <Route path="/admin/edu-plan/year-target" element={<AdminYearTarget />} />
                        <Route path="/admin/edu-plan/theme-plan" element={<EducationalActivity />} />
                        <Route path="/admin/nutrition/food" element={<AdminFood />} />
                        <Route path="/admin/nutrition/meal" element={<AdminMeal />} />
                        <Route path="/admin/nutrition/menu" element={<AdminMenu />} />
                        <Route path="/admin/nutrition/standards" element={<AdminNutritionalStandards />} />
                    </Route>

                    <Route path="/admin/user-info" element={<AdminInfo />} />

                    {/* School Routes - Các role trong trường */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD} />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>

                    {/* Chỉ cho phép xem nếu có quyền VIEW_USERS */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_USERS} />}>
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/users-parents" element={<UsersParents />} />
                    </Route>
                    <Route path="/user-info" element={<UserInfo />} />
                    {/* Các route khác... */}

                    {/* Data-Declaration */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_SCHOOL_INFO} />}>
                        <Route path="/data-declaration/school-info" element={<SchoolInfo />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_ACADEMIC_YEAR} />}>
                        <Route path="/data-declaration/school-year" element={<AcademicYear />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_DEPARTMENT} />}>
                        <Route path="/data-declaration/department" element={<Department />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CLASSROOM} />}>
                        <Route path="/data-declaration/classes" element={<Classes />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_HISTORY} />}>
                        <Route path="/data-declaration/history" element={<History />} />
                    </Route>
                    {/* End - Data-Declaration */}

                    {/* ✅ Personnel Management - Quản lý cán bộ */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_PERSONNEL_RECORDS} />}>
                        <Route path="/staff/profile" element={<PersonnelRecord />} />
                        <Route path="/staff/evaluation" element={<PersonnelEvaluation />} />
                    </Route>

                    {/* ✅ Personnel Management - Quản lý kế hoạch giáo dục */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_YEAR_TARGET} />}>
                        <Route path="/edu-plan/year-target" element={<YearTarget />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_EDUCATION_ACTIVITY} />}>
                        <Route path="/edu-plan/activities" element={<SchoolEducationalActivity />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_SCHEDULE} />}>
                        <Route path="/edu-plan/schedule" element={<Schedule />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_MONTHLY_PLAN} />}>
                        <Route path="/edu-plan/weekly-plan" element={<WeeklyPlan />} />
                    </Route>

                    {/* Quản lý trẻ em */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILDREN_MANAGEMENT} />}>
                        <Route path="/children/management" element={<ChildrenManagement />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILDREN_BY_CLASS} />}>
                        <Route path="/children/class" element={<ChildrenByClass />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILDREN_PROFILE} />}>
                        <Route path="/children/profile" element={<ChildrenProfile />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILDREN_ATTENDANCE} />}>
                        <Route path="/children/attendance" element={<ChildrenAttendance />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILDREN_ASSESSMENT} />}>
                        <Route path="/children/assessment" element={<ChildrenAssessment />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILDREN_CERTIFICATE} />}>
                        <Route path="/children/certificate" element={<ChildrenCertificate />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILDREN_PROGRAM_COMPLETE} />}>
                        <Route path="/children/program-complete" element={<ChildrenProgramComplete />} />
                    </Route>

                    {/* Dinh dưỡng */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_NUTRITIONAL_STANDARDS} />}>
                        <Route path="/nutrition/standards" element={<NutritionalStandards />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_SERVICE_CHARGE} />}>
                        <Route path="/nutrition/service-charge" element={<ServiceCharge />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_FOOD} />}>
                        <Route path="/nutrition/food" element={<Food />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_MEAL} />}>
                        <Route path="/nutrition/meal" element={<Meal />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_MENU} />}>
                        <Route path="/nutrition/menu" element={<Menu />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_MENU_APPLY} />}>
                        <Route path="/nutrition/menu-apply" element={<MenuApply />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_MENU_APPLY} />}>
                        <Route path="/parent-requests" element={<SchoolParentRequest />} />
                    </Route>

                    {/* Các Route phụ huynh */}
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_PARENT_DASHBOARD} />}>
                        <Route path="/parent/dashboard" element={<ParentDashboard />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.UPDATE_PARENT_PROFILE} />}>
                        <Route path="/parent/user-info" element={<ParentInfo />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_SCHOOL_INFO} />}>
                        <Route path="/parent/school-info" element={<School />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILD_PROFILE} />}>
                        <Route path="/parent/child-info" element={<Children />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CLASS_SCHEDULE} />}>
                        <Route path="/parent/schedule" element={<ParentSchedule />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_WEEKLY_MENU} />}>
                        <Route path="/parent/weekly-menu" element={<WeeklyMenu />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_CHILD_ATTENDANCE} />}>
                        <Route path="/parent/attendance" element={<Attendance />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_DAILY_ASSESSMENT} />}>
                        <Route path="/parent/daily-assessment" element={<DailyAssessment />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_WEEKLY_CERTIFICATE} />}>
                        <Route path="/parent/children-certificate" element={<WeeklyCertificate />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_PROGRAM_COMPLETION_ASSESSMENT} />}>
                        <Route path="/parent/age-completion" element={<CompletionAssessment />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_PROGRAM_COMPLETION_ASSESSMENT} />}>
                        <Route path="/parent/requests" element={<ParentRequest />} />
                    </Route>
                    <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_PROGRAM_COMPLETION_ASSESSMENT} />}>
                        <Route path="/parent/chatbot" element={<Chatbot />} />
                    </Route>
                </Route>
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </NotificationProvider>
    );
}

function App() {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
}

export default App;
