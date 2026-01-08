// client/src/pages/School/Dashboard/ActivityStats.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import ExtensionIcon from '@mui/icons-material/Extension';

function ActivityStats({ data }) {
    const chartData = data.map((item) => ({
        ageGroup: item.ageGroup,
        count: item.count,
    }));

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#fce4ec', width: 56, height: 56 }}>
                    <ExtensionIcon sx={{ fontSize: 32, color: '#ec407a' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Hoạt động giáo dục
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Theo nhóm tuổi
                    </Typography>
                </Box>
            </Box>

            <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis />
                    <Radar name="Hoạt động" dataKey="count" stroke="#ec407a" fill="#ec407a" fillOpacity={0.6} />
                    <Tooltip />
                </RadarChart>
            </ResponsiveContainer>
        </Paper>
    );
}

export default ActivityStats;
