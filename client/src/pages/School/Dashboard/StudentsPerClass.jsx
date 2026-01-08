// client/src/pages/School/Dashboard/StudentsPerClass.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

const COLORS = ['#2196F3', '#F06292'];

function StudentsPerClass({ data, classInfo }) {
    const chartData = [
        { name: 'Nam', value: data.male, color: COLORS[0] },
        { name: 'Nữ', value: data.female, color: COLORS[1] },
    ];

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#e1f5fe', width: 56, height: 56 }}>
                    <PeopleAltIcon sx={{ fontSize: 32, color: '#0288d1' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Học sinh lớp {classInfo.name}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="primary">
                        {data.total}
                    </Typography>
                </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Nhóm tuổi: {classInfo.ageGroup}
            </Typography>

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

export default StudentsPerClass;
