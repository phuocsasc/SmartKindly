// client/src/pages/School/EducationPlan/Schedule/ScheduleDialog.jsx

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
    List,
    Paper,
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { toast } from 'react-toastify';
import { scheduleApi } from '~/apis';

function ScheduleDialog({ open, scheduleId, existingPeriods, totalWeeks, onClose, onSuccess }) {
    const [activityPeriods, setActivityPeriods] = useState([
        { startTime: '07:30', endTime: '08:00', description: '', order: 1 },
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            if (existingPeriods && existingPeriods.length > 0) {
                setActivityPeriods(existingPeriods.map((p, idx) => ({ ...p, order: idx + 1 })));
            } else {
                setActivityPeriods([{ startTime: '07:30', endTime: '08:00', description: '', order: 1 }]);
            }
        }
    }, [open, existingPeriods]);

    const handleAddPeriod = () => {
        const lastPeriod = activityPeriods[activityPeriods.length - 1];
        const newStartTime = lastPeriod.endTime;

        const [hours, minutes] = newStartTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + 30;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        const newEndTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;

        setActivityPeriods([
            ...activityPeriods,
            {
                startTime: newStartTime,
                endTime: newEndTime,
                description: '',
                order: activityPeriods.length + 1,
            },
        ]);
    };

    const handleRemovePeriod = (index) => {
        if (activityPeriods.length === 1) {
            toast.warning('Phải có ít nhất 1 mốc hoạt động!');
            return;
        }
        const newPeriods = activityPeriods.filter((_, idx) => idx !== index);
        setActivityPeriods(newPeriods.map((p, idx) => ({ ...p, order: idx + 1 })));
    };

    const handlePeriodChange = (index, field, value) => {
        const newPeriods = [...activityPeriods];
        newPeriods[index][field] = value;

        if (field === 'endTime' && index < newPeriods.length - 1) {
            newPeriods[index + 1].startTime = value;
        }

        setActivityPeriods(newPeriods);
    };

    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const validatePeriods = () => {
        for (let period of activityPeriods) {
            if (!period.startTime || !period.endTime || !period.description.trim()) {
                toast.error('Vui lòng điền đầy đủ thông tin cho tất cả các mốc hoạt động!');
                return false;
            }
        }

        for (let i = 0; i < activityPeriods.length; i++) {
            const startMinutes = timeToMinutes(activityPeriods[i].startTime);
            const endMinutes = timeToMinutes(activityPeriods[i].endTime);

            if (endMinutes <= startMinutes) {
                toast.error(`Mốc ${i + 1}: Thời gian kết thúc phải sau thời gian bắt đầu!`);
                return false;
            }
        }

        for (let i = 0; i < activityPeriods.length - 1; i++) {
            if (activityPeriods[i].endTime !== activityPeriods[i + 1].startTime) {
                toast.error(
                    `Thời gian kết thúc của mốc ${i + 1} (${activityPeriods[i].endTime}) phải bằng thời gian bắt đầu của mốc ${i + 2} (${activityPeriods[i + 1].startTime})!`,
                );
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validatePeriods()) return;

        try {
            setLoading(true);

            // eslint-disable-next-line no-unused-vars
            const periodsToSubmit = activityPeriods.map(({ _id, ...rest }) => rest);

            await scheduleApi.updateActivityPeriods(scheduleId, {
                activityPeriods: periodsToSubmit,
            });

            toast.success(`Cập nhật mốc hoạt động cho ${totalWeeks} tuần thành công!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating activity periods:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật mốc hoạt động!');
        } finally {
            setLoading(false);
        }
    };

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
                        <AccessTimeIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Cấu hình mốc hoạt động
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* ✅ Thông báo áp dụng cho tất cả tuần */}
                    <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                        <Typography variant="body2">
                            Mốc hoạt động này sẽ được áp dụng cho <strong>TẤT CẢ {totalWeeks} tuần</strong> trong năm
                            học.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Các mốc hoạt động phải có thời gian liên tiếp nhau (không ngắt quãng).
                        </Typography>
                    </Alert>

                    <List sx={{ p: 0 }}>
                        {activityPeriods.map((period, index) => (
                            <Paper
                                key={index}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1.5,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: '#667eea',
                                            width: 32,
                                            height: 32,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        {index + 1}
                                    </Avatar>

                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <TextField
                                                label="Thời gian bắt đầu"
                                                type="time"
                                                value={period.startTime}
                                                onChange={(e) => handlePeriodChange(index, 'startTime', e.target.value)}
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ step: 300 }}
                                                sx={{ flex: 1 }}
                                            />
                                            <Typography sx={{ color: '#667eea', fontWeight: 600 }}>→</Typography>
                                            <TextField
                                                label="Thời gian kết thúc"
                                                type="time"
                                                value={period.endTime}
                                                onChange={(e) => handlePeriodChange(index, 'endTime', e.target.value)}
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ step: 300 }}
                                                sx={{ flex: 1 }}
                                            />
                                        </Box>

                                        <TextField
                                            label="Mô tả hoạt động"
                                            placeholder="VD: Đón trẻ, thể dục sáng, vệ sinh cá nhân..."
                                            multiline
                                            rows={2}
                                            value={period.description}
                                            onChange={(e) => handlePeriodChange(index, 'description', e.target.value)}
                                            size="small"
                                        />
                                    </Box>

                                    <IconButton
                                        onClick={() => handleRemovePeriod(index)}
                                        size="small"
                                        color="error"
                                        disabled={activityPeriods.length === 1}
                                    >
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                </Box>
                            </Paper>
                        ))}
                    </List>

                    <Button
                        variant="outlined"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={handleAddPeriod}
                        sx={{
                            borderColor: '#667eea',
                            color: '#667eea',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#4d5bc9',
                                bgcolor: 'rgba(102, 126, 234, 0.04)',
                            },
                        }}
                    >
                        Thêm mốc hoạt động
                    </Button>
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

export default ScheduleDialog;
