// client/src/pages/School/Children/ChildrenAssessment/ChildrenAssessmentDialog.jsx

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
    Divider,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RateReviewIcon from '@mui/icons-material/RateReview';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { childrenDailyAssessmentApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function ChildrenAssessmentDialog({
    open,
    studentInfo,
    classId,
    academicYearId,
    date,
    existingAssessment,
    onClose,
    onSuccess,
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        healthStatus: '',
        emotionalBehavior: '',
        skillsKnowledge: '',
        notes: '',
    });

    const isEditMode = !!existingAssessment;

    // ✅ Initialize form data - Reset khi đổi học sinh hoặc ngày
    useEffect(() => {
        if (open) {
            if (existingAssessment) {
                // Edit mode: Load existing data
                setFormData({
                    healthStatus: existingAssessment.healthStatus || '',
                    emotionalBehavior: existingAssessment.emotionalBehavior || '',
                    skillsKnowledge: existingAssessment.skillsKnowledge || '',
                    notes: existingAssessment.notes || '',
                });
            } else {
                // Create mode: Reset to empty
                setFormData({
                    healthStatus: '',
                    emotionalBehavior: '',
                    skillsKnowledge: '',
                    notes: '',
                });
            }
        }
    }, [open, existingAssessment, studentInfo?._id, date]);

    // ✅ Reset form khi đóng dialog
    useEffect(() => {
        if (!open) {
            setFormData({
                healthStatus: '',
                emotionalBehavior: '',
                skillsKnowledge: '',
                notes: '',
            });
        }
    }, [open]);

    // ✅ Handle submit
    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.healthStatus.trim()) {
            toast.warning('Vui lòng nhập tình trạng sức khỏe!');
            return;
        }
        if (!formData.emotionalBehavior.trim()) {
            toast.warning('Vui lòng nhập trạng thái cảm xúc, thái độ hành vi!');
            return;
        }
        if (!formData.skillsKnowledge.trim()) {
            toast.warning('Vui lòng nhập kiến thức kỹ năng!');
            return;
        }

        try {
            setLoading(true);

            if (isEditMode) {
                await childrenDailyAssessmentApi.update(existingAssessment._id, formData);
                toast.success('Cập nhật đánh giá thành công!');
            } else {
                const payload = {
                    academicYearId,
                    classId,
                    studentId: studentInfo._id,
                    date: dayjs(date).toISOString(),
                    ...formData,
                };
                await childrenDailyAssessmentApi.create(payload);
                toast.success('Thêm đánh giá thành công!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving assessment:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle delete
    const handleDelete = async () => {
        if (!existingAssessment || !existingAssessment._id) return;

        try {
            setLoading(true);
            await childrenDailyAssessmentApi.delete(existingAssessment._id);
            toast.success('Xóa đánh giá thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting assessment:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi xóa đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle close with cleanup
    const handleClose = () => {
        setFormData({
            healthStatus: '',
            emotionalBehavior: '',
            skillsKnowledge: '',
            notes: '',
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <RateReviewIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {isEditMode ? 'Cập nhật đánh giá trẻ' : 'Đánh giá trẻ hằng ngày'}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
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
                        mt: 2,
                        mb: 3,
                        p: 2,
                        bgcolor: '#f5f5ff',
                        borderRadius: 2,
                        border: '1px solid #e0e0ff',
                    }}
                >
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                        <strong>Học sinh:</strong> {studentInfo?.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Mã HS:</strong> {studentInfo?.studentCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Ngày:</strong> {dayjs(date).format('DD/MM/YYYY')} ({dayjs(date).format('dddd')})
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 1. Tình trạng sức khỏe */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#667eea', fontWeight: 600 }}>
                        1. Tình trạng sức khỏe *
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ví dụ: Trẻ khỏe mạnh, ăn ngủ đầy đủ, không có dấu hiệu bất thường..."
                        value={formData.healthStatus}
                        onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />
                </Box>

                {/* 2. Trạng thái cảm xúc, thái độ hành vi */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#667eea', fontWeight: 600 }}>
                        2. Trạng thái cảm xúc, thái độ hành vi *
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ví dụ: Vui vẻ, hòa đồng với bạn bè, tham gia tích cực các hoạt động..."
                        value={formData.emotionalBehavior}
                        onChange={(e) => setFormData({ ...formData, emotionalBehavior: e.target.value })}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />
                </Box>

                {/* 3. Kiến thức kỹ năng */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#667eea', fontWeight: 600 }}>
                        3. Kiến thức kỹ năng *
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ví dụ: Trẻ đã biết đếm từ 1-10, nhận diện được các màu cơ bản..."
                        value={formData.skillsKnowledge}
                        onChange={(e) => setFormData({ ...formData, skillsKnowledge: e.target.value })}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />
                </Box>

                {/* 4. Lưu ý (Optional) */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#666', fontWeight: 600 }}>
                        4. Ghi chú lưu ý cần quan tâm hơn (nếu có)
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Ví dụ: Cần khuyến khích trẻ tự tin hơn khi phát biểu..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />
                </Box>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'space-between' }}>
                {/* ✅ Delete button - Only show in edit mode */}
                {isEditMode && existingAssessment?._id && (
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDelete}
                        disabled={loading}
                        startIcon={<DeleteOutlineIcon />}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            px: 2,
                            textTransform: 'none',
                        }}
                    >
                        Xóa đánh giá
                    </Button>
                )}

                <Box sx={{ flex: 1 }} />

                {/* Cancel button */}
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    disabled={loading}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 2.5,
                        textTransform: 'none',
                    }}
                >
                    Hủy
                </Button>

                {/* Save button */}
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Lưu đánh giá'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenAssessmentDialog;
