import { Box, Typography, Paper } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
function MonthlyPlan() {
    const { user } = useUser();
    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Kế hoạch giáo dục', icon: PeopleIcon, href: '#' },
                        { text: 'Kế hoạch giáo dục theo tháng - tuần' },
                    ]}
                />
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Kế hoạch giáo dục chi tiết theo tuần
                        </Typography>
                    </Box>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}
export default MonthlyPlan;
