import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '~/hooks/usePermission';
import { roles } from '~/config/rbacConfig';

function RbacRoute({ requiredPermission, redirectTo = '/access-denied', children }) {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const userRole = user?.role || roles.CLIENT;

    const { hasPermission } = usePermission(userRole);

    // Nếu như user không có quyền hạn, điều hướng tới trang Access Denied
    if (!hasPermission(requiredPermission)) {
        return <Navigate to={redirectTo} replace={true} />;
    }

    // Dùng Outlet (cách này thường dùng cho dự án xài react-router-dom ver mới từ 6.x.x trở lên) hiện đại và dễ bảo trì
    return <Outlet />;

    // Dùng children (cách này thường dùng cho dự án xài react-router-dom ver cũ từ 5.x.x trở xuống)
    // return children;
}

export default RbacRoute;
