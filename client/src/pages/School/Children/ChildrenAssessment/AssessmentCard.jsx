// File: src/pages/School/Children/ChildrenAssessment/AssessmentCard.jsx
import React from 'react';
import { Box, Typography, Paper, Tooltip, Stack, alpha } from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SchoolIcon from '@mui/icons-material/School';
import NoteIcon from '@mui/icons-material/Note';

// Component con hiển thị từng dòng
const AssessmentRow = ({ icon, color, label, value }) => {
    if (!value || !value.trim()) return null;

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Tooltip title={label} arrow>
                <Box
                    sx={{
                        // Style icon: Hình vuông bo góc, màu nền đậm hơn xíu
                        color: (theme) => theme.palette[color]?.main || theme.palette.text.secondary,
                        bgcolor: (theme) => alpha(theme.palette[color]?.main || theme.palette.text.secondary, 0.12),
                        minWidth: 28, // Kích thước cố định để thẳng hàng
                        height: 28,
                        borderRadius: '8px', // Bo góc vuông mềm mại (Modern style)
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 0.2, // Căn chỉnh với dòng text đầu tiên
                    }}
                >
                    {/* Clone icon để chỉnh size thống nhất */}
                    {React.cloneElement(icon, { sx: { fontSize: 18 } })}
                </Box>
            </Tooltip>

            <Box sx={{ flex: 1, minWidth: 0, pt: 0.3 }}>
                <Tooltip title={value} placement="top-start" arrow>
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: '0.8125rem',
                            lineHeight: 1.5,
                            fontWeight: 600,
                            color: 'text.secondary', // Màu chữ dịu hơn
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            // Khi hover vào dòng thì chữ đậm lên xíu
                            transition: 'color 0.2s',
                            '&:hover': {
                                color: 'text.primary',
                            },
                        }}
                    >
                        {value}
                    </Typography>
                </Tooltip>
            </Box>
        </Box>
    );
};

// Component chính hiển thị Card
const AssessmentCard = ({ assessment }) => {
    if (!assessment) return null;

    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                p: 1.5,
                // Chuyển sang nền trắng để nổi bật trên nền bảng
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 3, // Bo góc Card nhiều hơn (12px)
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                // Hiệu ứng Hover xịn xò hơn
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    transform: 'translateY(-2px)', // Nhấc nhẹ thẻ lên
                },

                // (Tùy chọn) Một thanh màu trang trí nhỏ bên trái để tạo điểm nhấn
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    bgcolor: 'primary.main',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                },
                '&:hover::before': {
                    opacity: 1,
                },
            }}
        >
            <Stack spacing={1.2}>
                {' '}
                {/* Tăng khoảng cách giữa các dòng cho thoáng */}
                <AssessmentRow
                    icon={<HealthAndSafetyIcon />}
                    color="error"
                    label="Tình trạng sức khỏe"
                    value={assessment.healthStatus}
                />
                <AssessmentRow
                    icon={<SentimentSatisfiedAltIcon />}
                    color="warning"
                    label="Trạng thái cảm xúc, thái độ hành vi"
                    value={assessment.emotionalBehavior}
                />
                <AssessmentRow
                    icon={<SchoolIcon />}
                    color="info"
                    label="Kiến thức kỹ năng"
                    value={assessment.skillsKnowledge}
                />
                {!!(assessment.notes || '').trim() && (
                    <AssessmentRow
                        icon={<NoteIcon />}
                        color="primary"
                        label="Ghi chú giáo viên"
                        value={assessment.notes}
                    />
                )}
            </Stack>
        </Paper>
    );
};

export default AssessmentCard;
