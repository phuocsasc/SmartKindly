// client/src/pages/School/Dashboard/TotalClasses.jsx

import { Paper, Typography, Box, Avatar, Stack, Chip, Divider, keyframes } from '@mui/material';

// Icons
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';

// --- 1. Animation Keyframes ---
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- 2. Helper Color Function ---
const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
};

function TotalClasses({ data, classesList }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 4,
                bgcolor: 'white',
                boxShadow: '3', // Bóng đổ sâu hơn
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative', // Để chứa các hình trang trí tuyệt đối
            }}
        >
            {/* --- Decorative Background Blobs (Trang trí nền) --- */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(165, 214, 167, 0.1) 100%)',
                    zIndex: 0,
                }}
            />

            {/* --- HEADER --- */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                    flexShrink: 0,
                    zIndex: 1, // Nổi lên trên hình trang trí
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)', // Gradient Green
                            color: 'white',
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                        }}
                    >
                        <ClassOutlinedIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: '#2e7d32' }}>
                            Danh sách lớp
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Thống kê lớp học toàn trường
                        </Typography>
                    </Box>
                </Box>

                {/* Số tổng với hiệu ứng Gradient Text */}
                <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{
                        background: 'linear-gradient(45deg, #2e7d32 30%, #66bb6a 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1,
                    }}
                >
                    {data}
                </Typography>
            </Box>

            <Divider sx={{ mb: 2, opacity: 0.6 }} />

            {/* --- BODY (Scrollable) --- */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pr: 1,
                    zIndex: 1,
                    // Custom Scrollbar
                    '&::-webkit-scrollbar': { width: '5px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#bdbdbd',
                        borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#9e9e9e' },
                }}
            >
                <Stack spacing={1.5} sx={{ py: 0.5 }}>
                    {classesList.map((cls, index) => {
                        const classColor = stringToColor(cls.name);
                        return (
                            <Box
                                key={cls._id}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 3,
                                    bgcolor: 'white',
                                    // Viền trái màu theo lớp
                                    borderLeft: `5px solid ${classColor}`,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    // Animation xuất hiện
                                    animation: `${slideIn} 0.4s ease-out both`,
                                    animationDelay: `${index * 0.05}s`, // Delay từng dòng
                                    '&:hover': {
                                        transform: 'translateX(5px)',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                                    },
                                }}
                            >
                                {/* Info Area */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: `${classColor}20`, // Màu nhạt (alpha 20%)
                                            color: classColor,
                                            width: 42,
                                            height: 42,
                                            fontSize: 18,
                                            fontWeight: 800,
                                            border: `1px solid ${classColor}40`,
                                        }}
                                    >
                                        {cls.name.charAt(0).toUpperCase()}
                                    </Avatar>

                                    <Box>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={700}
                                            color="text.primary"
                                            sx={{ lineHeight: 1.2 }}
                                        >
                                            {cls.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                                            <SupervisorAccountOutlinedIcon
                                                sx={{ fontSize: 15, color: 'text.secondary', mt: '-4px' }}
                                            />
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                {cls.homeRoomTeacher}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Chip & Arrow */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        label={cls.ageGroup}
                                        size="small"
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            color: '#616161',
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                            height: 24,
                                            border: '1px solid #eeeeee',
                                        }}
                                    />
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>
        </Paper>
    );
}

export default TotalClasses;
