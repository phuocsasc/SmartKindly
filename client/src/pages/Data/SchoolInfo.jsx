import { Box, Typography, Paper, Breadcrumbs, Link } from '@mui/material';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import MainLayout from '~/layouts/MainLayout';
import { useUser } from '~/contexts/UserContext';

function SchoolInfo() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <Box sx={{ p: 2 }}>
                {/* Breadcrumb */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="/dashboard"
                        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        <StorageOutlinedIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Khai báo dữ liệu
                    </Link>
                    <Typography color="text.primary">Thông tin nhà trường</Typography>
                </Breadcrumbs>

                {/* Page Content */}
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Thông tin nhà trường
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Nội dung trang thông tin nhà trường sẽ được phát triển tại đây.
                    </Typography>
                </Paper>
            </Box>
        </MainLayout>
    );
}

export default SchoolInfo;
