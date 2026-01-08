// client/src/pages/School/Dashboard/AssessmentStats.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import dayjs from 'dayjs';

const COLORS = ['#00C49F', '#FFBB28'];

function AssessmentStats({ data, weekNumber, classInfo }) {
    // Map data with day names
    const chartData = data.map((item) => ({
        day: dayjs(item.date).format('dddd'),
        'Đã đánh giá': item.assessed,
        'Chưa đánh giá': item.notAssessed,
    }));

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#e0f2f1', width: 56, height: 56 }}>
                    <AssignmentTurnedInIcon sx={{ fontSize: 32, color: '#00897b' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Đánh giá hằng ngày (Tuần {weekNumber})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Lớp {classInfo.name}
                    </Typography>
                </Box>
            </Box>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Đã đánh giá" stackId="a" fill={COLORS[0]} />
                    <Bar dataKey="Chưa đánh giá" stackId="a" fill={COLORS[1]} />
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    );
}

export default AssessmentStats;
