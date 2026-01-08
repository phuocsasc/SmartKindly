// client/src/pages/School/Dashboard/TotalMenus.jsx

import { Paper, Typography, Box, Avatar, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

function TotalMenus({ data }) {
    const chartData = data.map((item, index) => ({
        ageGroup: item.ageGroup,
        count: item.count,
        color: COLORS[index % COLORS.length],
    }));

    const totalMenus = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#fff3e0', width: 56, height: 56 }}>
                    <MenuBookIcon sx={{ fontSize: 32, color: '#ff9800' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Tổng thực đơn
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                        {totalMenus}
                    </Typography>
                </Box>
            </Box>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {data.map((item, index) => (
                    <Chip
                        key={index}
                        label={`${item.ageGroup}: ${item.count}`}
                        size="small"
                        sx={{ bgcolor: COLORS[index % COLORS.length], color: '#fff' }}
                    />
                ))}
            </Box>
        </Paper>
    );
}

export default TotalMenus;
