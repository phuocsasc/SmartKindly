// client/src/pages/School/Personnel/PersonnelEvaluation/PersonnelEvaluationDialog.jsx

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    CircularProgress,
    Divider,
    TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { personnelEvaluationApi } from '~/apis/personnelEvaluationApi';
import { toast } from 'react-toastify';

// ✅ Constants
const OFFICIAL_EVALUATIONS = ['Xuất sắc', 'Hoàn thành tốt', 'Hoàn thành (hạn chế về NL)', 'Không hoàn thành nhiệm vụ'];

const REGULAR_TRAININGS = ['Tốt', 'Khá', 'Đạt', 'Chưa hoàn thành'];

const EXCELLENT_TEACHERS = ['Cấp Tỉnh', 'Cấp Huyện', 'Cấp trường'];

const EMULATION_TITLES = [
    'Chiến sĩ thi đua toàn quốc',
    'Chiến sĩ thi đua cấp tỉnh',
    'Chiến sĩ thi đua cơ sở',
    'Lao động tiên tiến',
];

function PersonnelEvaluationDialog({ open, mode, evaluation, isActiveYear, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        officialEvaluation: '',
        regularTraining: '',
        excellentTeacher: '',
        emulationTitle: '',
        notes: '',
    });

    const isViewMode = mode === 'view' || !isActiveYear;

    // ✅ Load data khi mở dialog
    useEffect(() => {
        if (open && evaluation) {
            setFormData({
                officialEvaluation: evaluation.officialEvaluation || '',
                regularTraining: evaluation.regularTraining || '',
                excellentTeacher: evaluation.excellentTeacher || '',
                emulationTitle: evaluation.emulationTitle || '',
                notes: evaluation.notes || '',
            });
        } else {
            setFormData({
                officialEvaluation: '',
                regularTraining: '',
                excellentTeacher: '',
                emulationTitle: '',
                notes: '',
            });
        }
    }, [open, evaluation]);

    // ✅ Submit
    const handleSubmit = async () => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể chỉnh sửa đánh giá trong năm học đang hoạt động!');
            return;
        }

        try {
            setLoading(true);
            await personnelEvaluationApi.update(evaluation._id, formData);
            toast.success('Cập nhật đánh giá thành công!');
            onSuccess();
        } catch (error) {
            console.error('Error updating evaluation:', error);
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đánh giá!');
        } finally {
            setLoading(false);
        }
    };

    const ModeIcon = isViewMode ? VisibilityIcon : EditIcon;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1,
                    position: 'relative',
                    mb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ModeIcon sx={{ fontSize: 28 }} />
                    <Typography variant="h6" fontWeight={600}>
                        {isViewMode ? 'Xem thông tin đánh giá' : 'Chỉnh sửa đánh giá'}
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
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    maxHeight: '70vh', // 👈 cần có để xuất hiện scroll
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                    /* ✅ Style chung cho input */
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,

                        // ✅ Khi hover viền sáng màu xanh nhạt
                        '&:hover fieldset': {
                            borderColor: '#0071bc',
                        },

                        // ✅ Khi focus viền đậm màu xanh biển
                        '&.Mui-focused fieldset': {
                            borderColor: '#0071bc',
                            borderWidth: 2,
                        },
                    },

                    // ✅ Đổi màu label khi focus
                    '& label.Mui-focused': {
                        color: '#0071bc',
                    },
                }}
            >
                {/* Thông tin cán bộ (Read-only) */}
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="primary" sx={{ mb: 1.5 }}>
                        📋 Thông tin cán bộ
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">
                                Họ và tên
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {evaluation?.fullName}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">
                                Mã cán bộ
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                                {evaluation?.personnelCode}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">
                                Năm học
                            </Typography>
                            <Typography variant="body1" fontWeight={600} color="success.main">
                                {evaluation?.academicYear}
                            </Typography>
                        </Grid>
                        {evaluation?.personnelRecordId && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Tổ bộ môn
                                    </Typography>
                                    <Typography variant="body1">{evaluation.personnelRecordId.department}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Nhóm chức vụ
                                    </Typography>
                                    <Typography variant="body1">
                                        {evaluation.personnelRecordId.positionGroup}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Trạng thái
                                    </Typography>
                                    <Typography variant="body1">{evaluation.personnelRecordId.workStatus}</Typography>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Form đánh giá */}
                <Typography variant="subtitle2" fontWeight={600} color="secondary" sx={{ mb: 2 }}>
                    📊 Đánh giá xếp loại
                </Typography>

                <Grid container spacing={2}>
                    {/* Đánh giá viên chức */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Đánh giá viên chức</InputLabel>
                            <Select
                                value={formData.officialEvaluation}
                                onChange={(e) => setFormData({ ...formData, officialEvaluation: e.target.value })}
                                label="Đánh giá viên chức"
                                disabled={isViewMode}
                            >
                                <MenuItem value="">-- Chọn --</MenuItem>
                                {OFFICIAL_EVALUATIONS.map((item) => (
                                    <MenuItem key={item} value={item}>
                                        {item}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Bồi dưỡng thường xuyên */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Bồi dưỡng thường xuyên</InputLabel>
                            <Select
                                value={formData.regularTraining}
                                onChange={(e) => setFormData({ ...formData, regularTraining: e.target.value })}
                                label="Bồi dưỡng thường xuyên"
                                disabled={isViewMode}
                            >
                                <MenuItem value="">-- Chọn --</MenuItem>
                                {REGULAR_TRAININGS.map((item) => (
                                    <MenuItem key={item} value={item}>
                                        {item}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Giáo viên dạy giỏi */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Giáo viên dạy giỏi</InputLabel>
                            <Select
                                value={formData.excellentTeacher}
                                onChange={(e) => setFormData({ ...formData, excellentTeacher: e.target.value })}
                                label="Giáo viên dạy giỏi"
                                disabled={isViewMode}
                            >
                                <MenuItem value="">-- Chọn --</MenuItem>
                                {EXCELLENT_TEACHERS.map((item) => (
                                    <MenuItem key={item} value={item}>
                                        {item}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Danh hiệu thi đua */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Danh hiệu thi đua</InputLabel>
                            <Select
                                value={formData.emulationTitle}
                                onChange={(e) => setFormData({ ...formData, emulationTitle: e.target.value })}
                                label="Danh hiệu thi đua"
                                disabled={isViewMode}
                            >
                                <MenuItem value="">-- Chọn --</MenuItem>
                                {EMULATION_TITLES.map((item) => (
                                    <MenuItem key={item} value={item}>
                                        {item}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Ghi chú */}
                    <Grid item xs={12}>
                        <TextField
                            label="Ghi chú"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            multiline
                            rows={3}
                            fullWidth
                            size="small"
                            disabled={isViewMode}
                            inputProps={{ maxLength: 500 }}
                            helperText={`${formData.notes.length}/500 ký tự`}
                        />
                    </Grid>
                </Grid>

                {/* Warning nếu năm cũ */}
                {!isActiveYear && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            bgcolor: '#fff3e0',
                            borderRadius: 1,
                            border: '1px solid #ff9800',
                        }}
                    >
                        <Typography variant="body2" color="warning.main">
                            ⚠️ Đây là dữ liệu của năm học đã kết thúc. Chỉ có thể xem, không thể chỉnh sửa.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 1.5 }}>
                    {isViewMode ? 'Đóng' : 'Hủy'}
                </Button>
                {!isViewMode && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        sx={{
                            borderRadius: 1.5,
                            px: 3,
                            background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                            '&:hover': {
                                boxShadow: 3,
                                background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                            },
                        }}
                    >
                        {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Cập nhật'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default PersonnelEvaluationDialog;
