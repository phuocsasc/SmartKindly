import { Typography, Paper } from '@mui/material';
import AdminLayout from '~/layouts/AdminLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';

function AdminUserManagement() {
    const { user } = useUser();

    return (
        <AdminLayout user={user}>
            <PageContainer>
                {/* Breadcrumb */}
                <PageBreadcrumb items={[{ text: 'Quản lý người dùng' }]} />

                {/* Page Content */}
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Quản lý người dùng
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Nội dung trang quản lý người dùng sẽ được phát triển tại đây.
                    </Typography>
                </Paper>
            </PageContainer>
        </AdminLayout>
    );
}

export default AdminUserManagement;
