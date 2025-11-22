import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
    IconButton,
    Avatar,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { childrenAttendanceApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

const ATTENDANCE_STATUS = [
    { value: 'Có mặt', label: 'Có mặt', color: 'success' },
    { value: 'Vắng có phép', label: 'Vắng có phép', color: 'warning' },
    { value: 'Vắng không phép', label: 'Vắng không phép', color: 'error' },
    { value: 'Đi trễ', label: 'Đi trễ', color: 'info' },
];

function ChildrenAttendanceDialog({ open, studentInfo, classId, date, existingAttendance, onClose, onSuccess }) {
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
                // Update existing attendance
                await childrenAttendanceApi.update(existingAttendance._id, formData);
                toast.success('Cập nhật điểm danh thành công!');
            } else {
                // ✅ FIX: Sử dụng classId từ props thay vì studentInfo.classId
                await childrenAttendanceApi.bulkAttendance({
                    classId: classId, // ✅ Sử dụng classId từ props
                    date: date,
                    attendances: [
                        {
                            studentId: studentInfo._id,
                            status: formData.status,
                            note: formData.note,
                        },
                    ],
                });
                toast.success('Điểm danh thành công!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi điểm danh!');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingAttendance || !existingAttendance._id) return;

        if (!window.confirm('Bạn có chắc muốn xóa điểm danh này?')) return;

        try {
            setLoading(true);
            await childrenAttendanceApi.delete(existingAttendance._id);
            toast.success('Xóa điểm danh thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting attendance:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi xóa điểm danh!');
        } finally {
            setLoading(false);
        }
    };

    if (!studentInfo) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <CheckCircleIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Điểm danh học sinh
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
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ px: 3, py: 3 }}>
                {/* Student Info */}
                <Box
                    sx={{
                        mb: 3,
                        p: 2,
                        bgcolor: '#f5f5ff',
                        borderRadius: 2,
                        border: '1px solid #e0e0ff',
                    }}
                >
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                        <strong>Học sinh:</strong> {studentInfo.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Mã HS:</strong> {studentInfo.studentCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Ngày:</strong> {dayjs(date).format('DD/MM/YYYY')} ({dayjs(date).format('dddd')})
                    </Typography>
                </Box>

                {/* Status Selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Trạng thái điểm danh *</InputLabel>
                    <Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        label="Trạng thái điểm danh *"
                    >
                        {ATTENDANCE_STATUS.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label={status.label} color={status.color} size="small" />
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Note */}
                <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={3}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Nhập ghi chú (không bắt buộc)..."
                />
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'space-between' }}>
                {/* Delete button (only if editing) */}
                {existingAttendance && existingAttendance._id && (
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDelete}
                        disabled={loading}
                        size="small"
                        sx={{ borderRadius: 1.5 }}
                    >
                        Xóa
                    </Button>
                )}

                <Box sx={{ flex: 1 }} />

                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    disabled={loading}
                    size="small"
                    sx={{ borderRadius: 1.5 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenAttendanceDialog;
