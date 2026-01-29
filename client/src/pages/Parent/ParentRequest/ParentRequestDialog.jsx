// client/src/pages/Parent/ViewInfo/ParentRequestDialog.jsx

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
    Grid,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon, Edit as EditIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parentRequestApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function ParentRequestDialog({ open, mode, requestData, academicYearId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        academicYearId: academicYearId || '',
        requestName: '',
        fromDate: null,
        toDate: null,
        parentNote: '',
    });

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && requestData) {
                setFormData({
                    academicYearId: requestData.academicYearId._id,
                    requestName: requestData.requestName,
                    fromDate: dayjs(requestData.fromDate),
                    toDate: dayjs(requestData.toDate),
                    parentNote: requestData.parentNote,
                });
            } else {
                resetForm();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, requestData]);

    const resetForm = () => {
        setFormData({
            academicYearId: academicYearId || '',
            requestName: '',
            fromDate: null,
            toDate: null,
            parentNote: '',
        });
    };

    const handleSubmit = async () => {
        try {
            // Validate
            if (!formData.requestName.trim()) {
                toast.warning('Vui lòng nhập tên phiếu');
                return;
            }
            if (!formData.fromDate || !formData.toDate) {
                toast.warning('Vui lòng chọn ngày áp dụng');
                return;
            }
            if (formData.fromDate.isAfter(formData.toDate)) {
                toast.warning('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
                return;
            }
            if (!formData.parentNote.trim()) {
                toast.warning('Vui lòng nhập nội dung dặn dò');
                return;
            }

            setLoading(true);

            const payload = {
                academicYearId: formData.academicYearId,
                // ✅ REMOVE: classId (backend tự động lấy)
                requestName: formData.requestName.trim(),
                fromDate: formData.fromDate.toDate(),
                toDate: formData.toDate.toDate(),
                parentNote: formData.parentNote.trim(),
            };

            if (mode === 'create') {
                await parentRequestApi.create(payload);
                toast.success('Tạo phiếu dặn dò thành công!');
            } else {
                await parentRequestApi.update(requestData._id, payload);
                toast.success('Cập nhật phiếu dặn dò thành công!');
            }

            onSuccess();
        } catch (error) {
            console.error('❌ Error submitting request:', error);
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {mode === 'create' ? <SendIcon /> : <EditIcon />}
                    <Typography variant="h6" fontWeight={700}>
                        {mode === 'create' ? 'Tạo phiếu dặn dò mới' : 'Chỉnh sửa phiếu dặn dò'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ p: 3 }}>
                {mode === 'edit' && requestData?.status !== 'Chờ duyệt' && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Phiếu đã được duyệt hoặc từ chối, không thể chỉnh sửa.
                    </Alert>
                )}

                <Grid container spacing={2.5}>
                    {/* Tên phiếu */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Tên phiếu"
                            value={formData.requestName}
                            onChange={(e) => setFormData({ ...formData, requestName: e.target.value })}
                            required
                            inputProps={{ maxLength: 200 }}
                        />
                    </Grid>

                    {/* Ngày áp dụng */}
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Từ ngày"
                            value={formData.fromDate}
                            onChange={(newValue) => setFormData({ ...formData, fromDate: newValue })}
                            format="DD/MM/YYYY"
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    required: true,
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Đến ngày"
                            value={formData.toDate}
                            onChange={(newValue) => setFormData({ ...formData, toDate: newValue })}
                            format="DD/MM/YYYY"
                            minDate={formData.fromDate}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    required: true,
                                },
                            }}
                        />
                    </Grid>

                    {/* Dặn dò */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Nội dung dặn dò"
                            value={formData.parentNote}
                            onChange={(e) => setFormData({ ...formData, parentNote: e.target.value })}
                            required
                            placeholder="Nhập nội dung dặn dò cho giáo viên..."
                            inputProps={{ maxLength: 2000 }}
                            helperText={`${formData.parentNote.length}/2000 ký tự`}
                        />
                    </Grid>

                    {/* Phản hồi từ giáo viên (chỉ xem) */}
                    {mode === 'edit' && requestData?.teacherReply && (
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Phản hồi từ giáo viên"
                                value={requestData.teacherReply}
                                disabled
                                sx={{ bgcolor: '#f5f5f5' }}
                            />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2, px: 3 }}>
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={
                        loading ? <CircularProgress size={16} /> : mode === 'create' ? <SendIcon /> : <EditIcon />
                    }
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    {loading ? 'Đang xử lý...' : mode === 'create' ? 'Gửi phiếu' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ParentRequestDialog;
