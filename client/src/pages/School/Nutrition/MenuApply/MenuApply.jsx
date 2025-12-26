// client/src/pages/School/Personnel/PersonnelRecord/PersonnelRecord.jsx
import { Box, Typography, Paper } from '@mui/material';

import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';

function MenuApply() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Dinh dưỡng', icon: RestaurantOutlinedIcon }, { text: 'Thực đơn áp dụng' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Thực đơn áp dụng
                        </Typography>
                    </Box>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default MenuApply;
