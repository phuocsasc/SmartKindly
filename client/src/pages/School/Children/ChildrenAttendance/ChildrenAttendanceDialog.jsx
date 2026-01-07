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
    Avatar,
    Grid,
    Paper,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person'; // Icon học sinh theo yêu cầu
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { childrenAttendanceApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

// Cấu hình hiển thị theo yêu cầu: ✓, P, K
const STATUS_CONFIG = {
    'Có mặt': {
        symbol: '✓',
        color: '#2e7d32', // Xanh lá đậm
        bgColor: '#e8f5e9', // Nền xanh nhạt
        borderColor: '#a5d6a7',
    },
    'Vắng có phép': {
        symbol: 'P',
        color: '#ed6c02', // Cam đậm
        bgColor: '#fff3e0', // Nền cam nhạt
        borderColor: '#ffcc80',
    },
    'Vắng không phép': {
        symbol: 'K',
        color: '#d32f2f', // Đỏ đậm
        bgColor: '#ffebee', // Nền đỏ nhạt
        borderColor: '#ef9a9a',
    },
};

const ATTENDANCE_STATUS = [
    { value: 'Có mặt', label: 'Có mặt' },
    { value: 'Vắng có phép', label: 'Vắng có phép' },
    { value: 'Vắng không phép', label: 'Vắng không phép' },
];

function ChildrenAttendanceDialog({
    open,
    studentInfo,
    classId,
    academicYearId,
    date,
    existingAttendance,
    onClose,
    onSuccess,
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: 'Có mặt',
        note: '',
    });

    useEffect(() => {
        if (open && existingAttendance) {
            setFormData({
                status: existingAttendance.status || 'Có mặt',
                note: existingAttendance.note || '',
            });
        } else if (open) {
            setFormData({
                status: 'Có mặt',
                note: '',
            });
        }
    }, [open, existingAttendance]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (existingAttendance && existingAttendance._id) {
                await childrenAttendanceApi.update(existingAttendance._id, {
                    status: formData.status,
                    note: formData.note,
                });
                toast.success('Cập nhật điểm danh thành công!');
            } else {
                await childrenAttendanceApi.bulkAttendance({
                    academicYearId,
                    classId,
                    date,
                    items: [
                        {
                            studentId: studentInfo.studentId,
                            status: formData.status,
                            note: formData.note,
                        },
                    ],
                });
                toast.success('Điểm danh thành công!');
            }
            onSuccess?.();
            onClose?.();
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error(error?.response?.data?.message || 'Lỗi khi lưu điểm danh!');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingAttendance || !existingAttendance._id) return;
        try {
            setLoading(true);
            await childrenAttendanceApi.delete(existingAttendance._id);
            toast.success('Xóa điểm danh thành công!');
            onSuccess?.();
            onClose?.();
        } catch (error) {
            console.error('Error deleting attendance:', error);
            toast.error(error?.response?.data?.message || 'Lỗi khi xóa điểm danh!');
        } finally {
            setLoading(false);
        }
    };

    if (!studentInfo) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2, overflow: 'hidden' },
            }}
        >
            {/* 1. Header có màu nền (Gradient) */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    px: 3,
                }}
            >
                <Typography variant="h6" fontWeight={600}>
                    Điểm danh trẻ
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 3, mt: 2 }}>
                {/* 2. Thông tin học sinh dùng PersonIcon */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: '#f5f7fa',
                        borderRadius: 2,
                        border: '1px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    {/* Avatar chứa PersonIcon */}
                    <Avatar
                        sx={{
                            width: 50,
                            height: 50,
                            bgcolor: 'white',
                            border: '1px solid #ddd',
                            color: 'primary.main',
                        }}
                    >
                        <PersonIcon fontSize="medium" />
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                            {studentInfo.fullName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption">Mã HS: {studentInfo.studentCode}</Typography>
                            <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarMonthIcon sx={{ fontSize: 20 }} />
                                <Typography variant="caption">{dayjs(date).format('DD/MM/YYYY')}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* 3. Trạng thái điểm danh (✓, P, K) */}
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Chọn trạng thái
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {ATTENDANCE_STATUS.map((item) => {
                        const isSelected = formData.status === item.value;
                        const config = STATUS_CONFIG[item.value];

                        return (
                            <Grid item xs={4} key={item.value}>
                                <Box
                                    onClick={() => setFormData({ ...formData, status: item.value })}
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: 2,
                                        p: 1.5,
                                        height: 100, // Cố định chiều cao cho đều
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1,
                                        bgcolor: isSelected ? config.bgColor : '#fff',
                                        border: `2px solid ${isSelected ? config.color : '#eee'}`,
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? `0 4px 8px ${config.bgColor}` : 'none',
                                        '&:hover': {
                                            borderColor: config.color,
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {/* Vòng tròn chứa ký tự ✓, P, K */}
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: config.color,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }}
                                    >
                                        {config.symbol}
                                    </Box>

                                    <Typography
                                        variant="caption"
                                        fontWeight={isSelected ? 700 : 500}
                                        align="center"
                                        color={isSelected ? config.color : 'text.secondary'}
                                    >
                                        {item.label}
                                    </Typography>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Ghi chú */}
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Ghi chú"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Nhập ghi chú..."
                    InputLabelProps={{ shrink: true }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #eee' }}>
                {existingAttendance?._id && (
                    <Button
                        variant="outlined" // 4. Nút xóa có border
                        color="error"
                        onClick={handleDelete}
                        disabled={loading}
                        sx={{ mr: 'auto', borderRadius: 1.5, fontWeight: 600 }}
                    >
                        Xóa
                    </Button>
                )}

                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    disabled={loading}
                    sx={{ borderRadius: 1.5 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        bgcolor: '#1976d2', // Dùng màu xanh dương cho đồng bộ với Header
                        '&:hover': { bgcolor: '#1565c0' },
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenAttendanceDialog;
