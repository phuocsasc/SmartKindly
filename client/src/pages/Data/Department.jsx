import { Typography, Paper } from '@mui/material';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import MainLayout from '~/layouts/MainLayout';
import PageContainer from '~/components/layout/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';

function Department() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* Breadcrumb */}
                <PageBreadcrumb
                    items={[{ text: 'Khai báo dữ liệu', icon: StorageOutlinedIcon, href: '/#' }, { text: 'Tổ bộ môn' }]}
                />

                {/* Page Content */}
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Tổ bộ môn
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Nội dung trang tổ bộ môn sẽ được phát triển tại đây.
                    </Typography>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default Department;
