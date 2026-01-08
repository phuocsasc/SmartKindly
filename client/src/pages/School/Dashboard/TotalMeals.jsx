// client/src/pages/School/Dashboard/TotalMeals.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';

function TotalMeals({ data }) {
    return (
        <Paper
            sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                height: '100%',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <RestaurantIcon sx={{ fontSize: 32, color: '#fff' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Tổng số món ăn
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                        {data}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}

export default TotalMeals;
