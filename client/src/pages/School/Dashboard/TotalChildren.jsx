// client/src/pages/School/Dashboard/TotalChildren.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ChildCareIcon from '@mui/icons-material/ChildCare';

const COLORS = ['#2196F3', '#F06292'];

function TotalChildren({ data }) {
    const chartData = [
        { name: 'Nam', value: data.male, color: COLORS[0] },
        { name: 'Nữ', value: data.female, color: COLORS[1] },
    ];

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#e3f2fd', width: 56, height: 56 }}>
                    <ChildCareIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Tổng số trẻ
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="primary">
                        {data.total}
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
                        Bé trai
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color={COLORS[0]}>
                        {data.male}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Bé gái
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color={COLORS[1]}>
                        {data.female}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}

export default TotalChildren;
