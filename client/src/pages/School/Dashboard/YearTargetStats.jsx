// client/src/pages/School/Dashboard/YearTargetStats.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

function YearTargetStats({ data }) {
    const chartData = data.map((item) => ({
        ageGroup: item.ageGroup,
        count: item.count,
    }));

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#e8eaf6', width: 56, height: 56 }}>
                    <TrackChangesIcon sx={{ fontSize: 32, color: '#5c6bc0' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Mục tiêu năm học
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
                    <Radar name="Mục tiêu" dataKey="count" stroke="#5c6bc0" fill="#5c6bc0" fillOpacity={0.6} />
                    <Tooltip />
                </RadarChart>
            </ResponsiveContainer>
        </Paper>
    );
}

export default YearTargetStats;
