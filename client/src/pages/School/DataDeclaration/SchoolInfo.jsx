import { Typography, Paper } from '@mui/material';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import { useUser } from '~/contexts/UserContext';

function SchoolInfo() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* Breadcrumb */}
                <PageBreadcrumb
                    items={[
                        { text: 'Khai báo dữ liệu', icon: StorageOutlinedIcon, href: '/#' },
                        { text: 'Thông tin nhà trường' },
                    ]}
                />

                {/* Page Content */}
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Thông tin nhà trường
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Nội dung trang thông tin nhà trường sẽ được phát triển tại đây. Nội dung trang thông tin nhà
                        trường sẽ được phát triển tại đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại
                        đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại đây.Nội dung trang thông tin nhà
                        trường sẽ được phát triển tại đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại
                        đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại đây.Nội dung trang thông tin nhà
                        trường sẽ được phát triển tại đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại
                        đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại đây.Nội dung trang thông tin nhà
                        trường sẽ được phát triển tại đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại
                        đây.Nội dung trang thông tin nhà trường sẽ được phát triển tại đây.
                    </Typography>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default SchoolInfo;
