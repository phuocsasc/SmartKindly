// client/src/pages/School/EducationPlan/WeeklyPlan/WeeklyPlanDialog.jsx

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    IconButton,
    Divider,
    Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { toast } from 'react-toastify';
import { weeklyPlanApi } from '~/apis';

const DAY_MAPPING = {
    'Thứ 2': 'monday',
    'Thứ 3': 'tuesday',
    'Thứ 4': 'wednesday',
    'Thứ 5': 'thursday',
    'Thứ 6': 'friday',
};

function WeeklyPlanDialog({ open, data, onClose, onSuccess }) {
    const [detailedContent, setDetailedContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && data) {
            console.log('📋 Dialog data:', data);
            setDetailedContent(data.detailedContent || '');
        }
    }, [open, data]);

    const handleSubmit = async () => {
        if (!data) return;

        try {
            setLoading(true);

            const dayOfWeek = DAY_MAPPING[data.dayName];

            console.log('📤 Submitting with data:', {
                classId: data.classId,
                weekNumber: data.weekNumber,
                dayOfWeek,
                activityPeriodId: data.activityPeriodId,
            });

            // ✅ Map tất cả activities của ngày đó, update content cho activity hiện tại
            const allActivities = data.allActivitiesOfDay.map((activity) => {
                const activityId = activity.activityPeriodId?._id || activity.activityPeriodId;
                const targetId = data.activityPeriodId?._id || data.activityPeriodId;

                if (activityId.toString() === targetId.toString()) {
                    // ✅ Update content cho activity hiện tại
                    return {
                        activityPeriodId: activityId,
                        startTime: activity.startTime,
                        endTime: activity.endTime,
                        description: activity.description,
                        detailedContent: detailedContent, // ✅ Content mới
                    };
                }

                // ✅ Giữ nguyên activities khác
                return {
                    activityPeriodId: activityId,
                    startTime: activity.startTime,
                    endTime: activity.endTime,
                    description: activity.description,
                    detailedContent: activity.detailedContent || '',
                };
            });

            console.log('📤 Sending activities:', allActivities);

            await weeklyPlanApi.updateDailyPlan({
                classId: data.classId,
                weekNumber: data.weekNumber,
                dayOfWeek,
                activities: allActivities,
            });

            toast.success('Cập nhật kế hoạch giáo dục thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('❌ Error updating weekly plan:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật kế hoạch!');
        } finally {
            setLoading(false);
        }
    };

    if (!data) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: 'white',
                    py: 1,
                    mb: 2,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 32,
                            height: 32,
                        }}
                    >
                        <EditNoteIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Kế hoạch giáo dục chi tiết
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    maxHeight: '75vh',
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                    '& label.Mui-focused': { color: '#667eea' },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Context Info */}
                    <Box
                        sx={{
                            p: 2,
                            mt: 2,
                            bgcolor: '#e3f2fd',
                            borderRadius: 1.5,
                            border: '1px solid #90caf9',
                        }}
                    >
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            <strong>📚 Tên Lớp:</strong> {data.className}
                        </Typography>

                        <Typography variant="body2" color="text.primary" sx={{ mt: 1, fontWeight: 500 }}>
                            <strong>Tuần {data.weekNumber}:</strong> {data.dayName} ({data.date})
                        </Typography>

                        <Typography variant="body2" color="text.primary" sx={{ mt: 1, fontWeight: 500 }}>
                            <strong>Mốc hoạt động:</strong> {data.startTime} - {data.endTime}
                        </Typography>

                        <Typography variant="body2" color="text.primary" sx={{ mt: 1, fontWeight: 500 }}>
                            <strong>Mô tả:</strong> {data.description}
                        </Typography>
                    </Box>

                    {/* Detailed Content Input */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: '#667eea',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#667eea', borderRadius: 1 }} />
                            Kế hoạch giáo dục chi tiết *
                        </Typography>

                        <TextField
                            fullWidth
                            multiline
                            rows={12}
                            value={detailedContent}
                            onChange={(e) => setDetailedContent(e.target.value)}
                            inputProps={{ spellCheck: false }} // ⬅️ Tắt gạch đỏ
                            placeholder={`Nhập nội dung kế hoạch giáo dục chi tiết cho mốc hoạt động này...\n\nVí dụ:\n- Mục tiêu: Giúp trẻ làm quen với các động tác cơ bản\n- Nội dung:\n  + Khởi động: Giơ cao tay, đưa ra phía trước (5 phút)\n  + Thực hành: Bắt chước động tác theo nhạc (10 phút)\n  + Kết thúc: Thả lỏng cơ thể (5 phút)\n- Đồ dùng: Nhạc, không gian thoáng\n- Lưu ý: Quan sát trẻ, điều chỉnh động tác phù hợp`}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    // fontFamily: 'monospace',
                                },
                            }}
                        />

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            💡 <strong>Lưu ý:</strong> Định dạng văn bản (dấu cách, xuống dòng) sẽ được giữ nguyên.
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 2,
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default WeeklyPlanDialog;
