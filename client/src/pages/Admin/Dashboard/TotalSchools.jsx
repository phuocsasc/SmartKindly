// client/src/pages/Admin/Dashboard/TotalSchools.jsx

import { Paper, Typography, Box, Avatar, Divider, Stack, keyframes } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Animation
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const COLORS = {
    active: '#4CAF50', // Green
    inactive: '#F44336', // Red
    bgActive: '#E8F5E9',
    bgInactive: '#FFEBEE',
};

function TotalSchools({ data }) {
    const chartData = [
        { name: 'Hoạt động', value: data.active, color: COLORS.active },
        { name: 'Không hoạt động', value: data.inactive, color: COLORS.inactive },
    ];

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <Box
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                        p: 1.5,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={700}>
                        {data.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Số lượng: <strong>{data.value}</strong>
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 4,
                bgcolor: 'white',
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative Blob */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(76, 175, 80, 0.15) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(56, 142, 60, 0.3)',
                        }}
                    >
                        <SchoolIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#2E7D32' }}>
                            Trường học
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Thống kê trạng thái
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#388E3C', lineHeight: 1 }}>
                        {data.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG SỐ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* Chart Area */}
            <Box sx={{ flex: 1, position: 'relative', minHeight: 180, width: '100%', zIndex: 1 }}>
                {/* Center Total */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#388E3C', lineHeight: 1 }}>
                        {data.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        TRƯỜNG HỌC
                    </Typography>
                </Box>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.1))' }}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </Box>

            {/* Footer Statistics */}
            <Stack direction="row" spacing={2} mt={2} sx={{ zIndex: 1 }}>
                {/* Active */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: COLORS.bgActive,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.3s ease',
                        animation: `${fadeInUp} 0.5s ease both`,
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 5px 15px rgba(76, 175, 80, 0.2)',
                        },
                    }}
                >
                    <Avatar sx={{ bgcolor: COLORS.active, width: 36, height: 36 }}>
                        <CheckCircleIcon fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Hoạt động
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ color: COLORS.active, lineHeight: 1 }}>
                            {data.active}
                        </Typography>
                    </Box>
                </Box>

                {/* Inactive */}
                <Box
                    sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: COLORS.bgInactive,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.3s ease',
                        animation: `${fadeInUp} 0.6s ease both`,
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 5px 15px rgba(244, 67, 54, 0.2)',
                        },
                    }}
                >
                    <Avatar sx={{ bgcolor: COLORS.inactive, width: 36, height: 36 }}>
                        <CancelIcon fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Không hoạt động
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ color: COLORS.inactive, lineHeight: 1 }}>
                            {data.inactive}
                        </Typography>
                    </Box>
                </Box>
            </Stack>
        </Paper>
    );
}

export default TotalSchools;
