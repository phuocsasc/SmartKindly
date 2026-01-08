import { Box, Typography } from '@mui/material';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import { useUser } from '~/contexts/UserContext';

export default function Dashboard() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* Header khu vực trang */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Tổng quan nhà trường
                        </Typography>
                    </Box>
                </Box>
            </PageContainer>
        </MainLayout>
    );
}
