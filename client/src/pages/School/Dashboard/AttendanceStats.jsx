// client/src/pages/School/Dashboard/AttendanceStats.jsx

import { Paper, Typography, Box, Avatar } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import dayjs from 'dayjs';

function AttendanceStats({ data, weekNumber, classInfo }) {
    // Map data with day names
    const chartData = data.map((item) => ({
        day: dayjs(item.date).format('dddd'), // Thứ Hai, Thứ Ba...
        'Có mặt': item.present,
        'Vắng có phép': item.absentWithPermission,
        'Vắng không phép': item.absentWithoutPermission,
        'Chưa điểm danh': item.notMarked,
    }));

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#f3e5f5', width: 56, height: 56 }}>
                    <FactCheckIcon sx={{ fontSize: 32, color: '#9c27b0' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Điểm danh tuần {weekNumber}
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
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Có mặt" fill="#4caf50" />
                    <Bar dataKey="Vắng có phép" fill="#ff9800" />
                    <Bar dataKey="Vắng không phép" fill="#f44336" />
                    <Bar dataKey="Chưa điểm danh" fill="#9e9e9e" />
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    );
}

export default AttendanceStats;
