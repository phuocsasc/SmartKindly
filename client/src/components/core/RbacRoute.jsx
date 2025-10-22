import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '~/hooks/usePermission';
import { ROLES } from '~/config/rbacConfig';

function RbacRoute({ requiredPermission, redirectTo = '/access-denied' }) {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const userRole = user?.role || ROLES.CLIENT;

    const { hasPermission } = usePermission(userRole);

    // Nếu như user không có quyền hạn, điều hướng tới trang Access Denied
    if (!hasPermission(requiredPermission)) {
        return <Navigate to={redirectTo} replace={true} />;
    }

    // Dùng Outlet (cách này thường dùng cho dự án xài react-router-dom ver mới từ 6.x.x trở lên) hiện đại và dễ bảo trì
    return <Outlet />;
}

export default RbacRoute;
