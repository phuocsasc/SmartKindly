import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from '~/pages/Login';
import Dashboard from '~/pages/Dashboard';
import NotFound from '~/pages/NotFound';
import AccessDenied from '~/pages/AccessDenied';
import RbacRoute from '~/components/core/RbacRoute';
import { permissions } from '~/config/rbacConfig';

/**
 * Giải pháp Clean Code trong việc xác định các route nào cần đăng nhập tài khoản xong thì mới cho truy cập
 * Sử dụng <Outlet /> của react-router-dom để hiển thị các Child Route
 */
const ProtectedRoutes = () => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    console.log('user: ', user);
    if (!user) {
        return <Navigate to="/login" replace={true} />;
    }
    return <Outlet />;
};

const UnauthorizedRoutes = () => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    console.log('user: ', user);
    if (user) {
        return <Navigate to="/dashboard" replace={true} />;
    }
    return <Outlet />;
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace={true} />} />

            <Route element={<UnauthorizedRoutes />}>
                {/* <Outlet /> của react-router-dom sẽ chạy vào các child route trong này */}
                <Route path="/login" element={<Login />} />
                {/* Sau này sẽ còn nhiều Route nữa ở đây ...v.v */}
            </Route>

            <Route element={<ProtectedRoutes />}>
                {/* <Outlet /> của react-router-dom sẽ chạy vào các child route trong này */}
                {/* Tất cả elemennt ở đây đều gọi tới cùng component Dashboard vì chúng ta đang gom chung
                    các pages dưới dạng tabs và code hết trong component Dashboard này để test cho gọn, 
                    thực tế có thể tách pages vào các component khác nhau tùy dự án */}

                {/* Nếu RbacRoute viết code theo cách Dùng Outlet  */}
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_DASHBOARD} />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route element={<RbacRoute requiredPermission={permissions.VIEW_SUPPORT} />}>
                    <Route path="/support" element={<Dashboard />} />
                    {/* <Route path="/support/create" element={<Dashboard />} />
                    <Route path="/support/delete" element={<Dashboard />} />
                    <Route path="/support/update" element={<Dashboard />} /> */}
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

                {/* Nếu RbacRoute viết code theo cách Dùng children  */}
                {/* <Route
                    path="/dashboard"
                    element={
                        <RbacRoute requiredPermission={permissions.VIEW_DASHBOARD}>
                            <Dashboard />
                        </RbacRoute>
                    }
                /> */}
            </Route>
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
