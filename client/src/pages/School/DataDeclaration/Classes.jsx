import { Typography, Paper } from '@mui/material';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';

function Classes() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* Breadcrumb */}
                <PageBreadcrumb
                    items={[{ text: 'Khai báo dữ liệu', icon: StorageOutlinedIcon, href: '/#' }, { text: 'Lớp học' }]}
                />

                {/* Page Content */}
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Lớp học
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Nội dung trang lớp học sẽ được phát triển tại đây.
                    </Typography>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default Classes;
