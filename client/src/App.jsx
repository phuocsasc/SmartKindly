import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from '~/pages/Auth/Login';
import Dashboard from '~/pages/School/Dashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import NotFound from '~/pages/ErrorPage/NotFound';
import AccessDenied from '~/pages/ErrorPage/AccessDenied';
import RbacRoute from '~/components/core/RbacRoute';
import { PERMISSIONS } from '~/config/rbacConfig';
import { UserProvider, useUser } from '~/contexts/UserContext';

// Admin
import AdminInfo from '~/pages/Admin/AdminInfo';
import AdminSchoolManagement from '~/pages/Admin/SchoolsManagement/AdminSchoolManagement';
import AdminUserManagement from '~/pages/Admin/UsersManagement/AdminUserManagement';

// Users
import UserManagement from '~/pages/School/Users/UserManagement';
import UserInfo from '~/pages/School/Users/UserInfo';
import ForgotPassword from '~/pages/Auth/ForgotPassword';

// Data-Declaration
import SchoolInfo from '~/pages/School/DataDeclaration/SchoolInfo';
import AcademicYear from '~/pages/School/DataDeclaration/AcademicYear';
import Department from '~/pages/School/DataDeclaration/Department';
import Classes from '~/pages/School/DataDeclaration/Classes';

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
    return (
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
                <Route path="/admin/user-info" element={<AdminInfo />} />

                {/* School Routes - Các role trong trường */}
                <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD} />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                {/* Chỉ cho phép xem nếu có quyền VIEW_USERS */}
                <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_USERS} />}>
                    <Route path="/users" element={<UserManagement />} />
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
                <Route path="/data-declaration/department" element={<Department />} />
                <Route path="/data-declaration/classes" element={<Classes />} />
                {/* End - Data-Declaration */}
            </Route>

            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
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
