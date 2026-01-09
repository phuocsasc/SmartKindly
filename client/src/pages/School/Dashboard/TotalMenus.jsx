// client/src/pages/School/Dashboard/TotalMenus.jsx

import { Paper, Typography, Box, Avatar, Divider, LinearProgress, Stack } from '@mui/material';

// Icons
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RestaurantIcon from '@mui/icons-material/Restaurant';

// Bộ màu Gradient ấm áp (Food Theme)
const COLORS = [
    { bg: '#FFF3E0', text: '#EF6C00', bar: '#FF9800' }, // Orange
    { bg: '#FBE9E7', text: '#D84315', bar: '#FF5722' }, // Deep Orange
    { bg: '#FFF8E1', text: '#F9A825', bar: '#FFC107' }, // Amber
    { bg: '#E0F2F1', text: '#00695C', bar: '#009688' }, // Teal
    { bg: '#F3E5F5', text: '#6A1B9A', bar: '#9C27B0' }, // Purple
];

function TotalMenus({ data }) {
    const totalMenus = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 4,
                bgcolor: 'white',
                boxShadow: '3',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* --- Decorative Blobs --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 152, 0, 0.1) 0%, rgba(255,255,255,0) 70%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #FFB74D 0%, #F57C00 100%)',
                            color: 'white',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(245, 124, 0, 0.3)',
                        }}
                    >
                        <MenuBookIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2, color: '#E65100' }}>
                            Thực đơn dự kiến
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Phân bổ theo nhóm tuổi
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#EF6C00', lineHeight: 1 }}>
                        {totalMenus}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        TỔNG SỐ
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2, borderStyle: 'dashed', opacity: 0.6 }} />

            {/* --- BODY: LIST WITH PROGRESS BARS --- */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, zIndex: 1 }}>
                <Stack spacing={2}>
                    {data.map((item, index) => {
                        const colorSet = COLORS[index % COLORS.length];
                        const percent = totalMenus > 0 ? (item.count / totalMenus) * 100 : 0;

                        return (
                            <Box key={index}>
                                {/* Info Row */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 0.5,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 1.5,
                                                bgcolor: colorSet.bg,
                                                color: colorSet.text,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <RestaurantIcon sx={{ fontSize: 14 }} />
                                        </Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                            {item.ageGroup}
                                        </Typography>
                                    </Box>

                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: colorSet.text }}>
                                        {item.count}
                                    </Typography>
                                </Box>

                                {/* Progress Bar */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percent}
                                        sx={{
                                            flex: 1,
                                            height: 6,
                                            borderRadius: 5,
                                            bgcolor: '#f5f5f5',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: colorSet.bar,
                                                borderRadius: 5,
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={600}
                                        sx={{ minWidth: 35, textAlign: 'right' }}
                                    >
                                        {percent.toFixed(0)}%
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>
        </Paper>
    );
}

export default TotalMenus;
