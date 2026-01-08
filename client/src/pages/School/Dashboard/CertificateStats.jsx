// client/src/pages/School/Dashboard/CertificateStats.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const COLORS = ['#66bb6a', '#ef5350'];

function CertificateStats({ data, weekNumber, classInfo }) {
    const chartData = [
        { name: 'Đã đánh giá', value: data.assessed, color: COLORS[0] },
        { name: 'Chưa đánh giá', value: data.notAssessed, color: COLORS[1] },
    ];

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#fff3e0', width: 56, height: 56 }}>
                    <EmojiEventsIcon sx={{ fontSize: 32, color: '#ffa726' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Phiếu bé ngoan (Tuần {weekNumber})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Lớp {classInfo.name}
                    </Typography>
                </Box>
            </Box>

            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>

            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Đã đánh giá
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color={COLORS[0]}>
                        {data.assessed}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Chưa đánh giá
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color={COLORS[1]}>
                        {data.notAssessed}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}

export default CertificateStats;
