// client/src/pages/School/Personnel/PersonnelRecord/PersonnelRecord.jsx
import { Box, Typography, Paper } from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';

function PersonnelEvaluation() {
    const { user } = useUser();

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Quản lý cán bộ', icon: PeopleIcon, href: '#' }, { text: 'Đánh giá xếp loại' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Đánh giá xếp loại cán bộ
                        </Typography>
                    </Box>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default PersonnelEvaluation;
