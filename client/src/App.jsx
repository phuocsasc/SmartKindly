import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from '~/pages/Login';
import Dashboard from '~/pages/Dashboard';
import NotFound from '~/pages/NotFound';
import AccessDenied from '~/pages/AccessDenied';
import RbacRoute from '~/components/core/RbacRoute';
import { permissions } from '~/config/rbacConfig';
import { UserProvider, useUser } from '~/contexts/UserContext';
import { PERMISSIONS } from '~/config/rbacConfig';
// Users
import UserManagement from '~/pages/Users/UserManagement';

// Data
import SchoolInfo from '~/pages/Data/SchoolInfo';
import AcademicYear from '~/pages/Data/AcademicYear';
import Department from '~/pages/Data/Department';
import Classes from '~/pages/Data/Classes';

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
            </Route>

            <Route element={<ProtectedRoutes />}>
                {/* Users - Chỉ cho phép xem nếu có quyền VIEW_USERS */}
                <Route element={<RbacRoute requiredPermission={PERMISSIONS.VIEW_USERS} />}>
                    <Route path="/users" element={<UserManagement />} />
                </Route>

                {/* Các route khác... */}

                {/* Data */}
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_SCHOOL_INFO} />}>
                    <Route path="/data/school-info" element={<SchoolInfo />} />
                </Route>
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_ACADEMIC_YEAR} />}>
                    <Route path="/data/school-year" element={<AcademicYear />} />
                </Route>
                <Route path="/data/department" element={<Department />} />
                <Route path="/data/classes" element={<Classes />} />
                {/* Data */}

                <Route element={<RbacRoute requiredPermission={permissions.VIEW_DASHBOARD} />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_SUPPORT} />}>
                    <Route path="/support" element={<Dashboard />} />
                </Route>
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_MESSAGES} />}>
                    <Route path="/messages" element={<Dashboard />} />
                </Route>
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_REVENUE} />}>
                    <Route path="/revenue" element={<Dashboard />} />
                </Route>
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_ADMIN_TOOLS} />}>
                    <Route path="/admin-tools" element={<Dashboard />} />
                </Route>
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
