// client/src/pages/Parent/ParentRequest/ParentRequestDialog.jsx

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
    Divider,
    Paper,
} from '@mui/material';
import {
    Close as CloseIcon,
    Send as SendIcon,
    Edit as EditIcon,
    Description as FormIcon,
    EventNote as CalendarIcon,
    ChatBubbleOutline as NoteIcon,
    ReplyAll as ReplyIcon,
} from '@mui/icons-material';
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
        if (!formData.requestName.trim()) return toast.warning('Vui lòng nhập tên phiếu');
        if (!formData.fromDate || !formData.toDate) return toast.warning('Vui lòng chọn ngày áp dụng');
        if (formData.fromDate.isAfter(formData.toDate)) return toast.warning('Ngày bắt đầu phải trước ngày kết thúc');
        if (!formData.parentNote.trim()) return toast.warning('Vui lòng nhập nội dung dặn dò');

        try {
            setLoading(true);
            const payload = {
                academicYearId: formData.academicYearId,
                requestName: formData.requestName.trim(),
                fromDate: formData.fromDate.toDate(),
                toDate: formData.toDate.toDate(),
                parentNote: formData.parentNote.trim(),
            };

            if (mode === 'create') {
                await parentRequestApi.create(payload);
                toast.success('Gửi phiếu thành công!');
            } else {
                await parentRequestApi.update(requestData._id, payload);
                toast.success('Cập nhật thành công!');
            }
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            scroll="body"
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    bgcolor: '#f4f7f6', // Màu nền nhẹ nhàng phía sau "tờ đơn"
                    backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
            }}
        >
            {/* Header cách điệu */}
            <DialogTitle sx={{ p: 0 }}>
                <Box
                    sx={{
                        bgcolor: '#2d3436',
                        color: 'white',
                        px: 3,
                        py: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FormIcon sx={{ color: '#00d2ff' }} />
                        <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: 1 }}>
                            {mode === 'create' ? 'TẠO PHIẾU DẶN DÒ MỚI' : 'CHỈNH SỬA PHIẾU'}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
                {/* Giả lập hiệu ứng tờ giấy chồng lên nhau */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 4 },
                        borderRadius: '4px',
                        position: 'relative',
                        bgcolor: '#fff',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                        '&::before': {
                            // Viền đỏ bên trái giả sổ ghi chép
                            content: '""',
                            position: 'absolute',
                            left: '10px',
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            bgcolor: '#ff7675',
                            opacity: 0.3,
                        },
                    }}
                >
                    {mode === 'edit' && requestData?.status !== 'Chờ duyệt' && (
                        <Alert severity="info" variant="outlined" sx={{ mb: 3, borderRadius: '8px' }}>
                            Phiếu đã ở trạng thái <b>{requestData?.status}</b>.
                        </Alert>
                    )}

                    <Grid container spacing={4}>
                        {/* Tiêu đề đơn */}
                        <Grid item xs={12} textAlign="center" sx={{ mb: 2 }}>
                            <Typography
                                variant="h5"
                                color="primary"
                                fontWeight={600}
                                sx={{ fontFamily: '"Roboto Condensed", sans-serif' }}
                            >
                                PHIẾU DẶN DÒ TỪ PHỤ HUYNH
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Ngày tạo: {dayjs().format('DD/MM/YYYY')}
                            </Typography>
                            <Divider
                                sx={{
                                    mt: 1,
                                    width: '100px',
                                    mx: 'auto',
                                    borderBottomWidth: 3,
                                    borderColor: 'primary.main',
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <EditIcon fontSize="small" color="action" />
                                <Typography variant="body2" fontWeight={600}>
                                    Tiêu đề phiếu *
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                variant="standard"
                                placeholder="Ví dụ: Xin nghỉ, Dặn uống thuốc..."
                                value={formData.requestName}
                                onChange={(e) => setFormData({ ...formData, requestName: e.target.value })}
                                InputProps={{ sx: { fontSize: '1.1rem', fontWeight: 500 } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <CalendarIcon fontSize="small" color="action" />
                                <Typography variant="body2" fontWeight={600}>
                                    Áp dụng từ ngày *
                                </Typography>
                            </Box>
                            <DatePicker
                                value={formData.fromDate}
                                onChange={(newValue) => setFormData({ ...formData, fromDate: newValue })}
                                format="DD/MM/YYYY"
                                slotProps={{ textField: { fullWidth: true, variant: 'standard' } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <CalendarIcon fontSize="small" color="action" />
                                <Typography variant="body2" fontWeight={600}>
                                    Áp dụng đến ngày *
                                </Typography>
                            </Box>
                            <DatePicker
                                value={formData.toDate}
                                onChange={(newValue) => setFormData({ ...formData, toDate: newValue })}
                                format="DD/MM/YYYY"
                                minDate={formData.fromDate}
                                slotProps={{ textField: { fullWidth: true, variant: 'standard' } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <NoteIcon fontSize="small" color="action" />
                                <Typography variant="body2" fontWeight={600}>
                                    Nội dung chi tiết *
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                placeholder="Viết nội dung dặn dò tại đây..."
                                value={formData.parentNote}
                                onChange={(e) => setFormData({ ...formData, parentNote: e.target.value })}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        lineHeight: '1.8',
                                        backgroundImage: 'linear-gradient(transparent, transparent 30px, #e5e7eb 30px)',
                                        backgroundSize: '100% 31px',
                                        alignItems: 'flex-start',
                                    },
                                }}
                            />
                        </Grid>

                        {/* Phản hồi từ giáo viên */}
                        {mode === 'edit' && requestData?.teacherReply && (
                            <Grid item xs={12}>
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 2,
                                        bgcolor: '#fff9c4',
                                        borderRadius: '8px',
                                        borderLeft: '5px solid #fbc02d',
                                        position: 'relative',
                                    }}
                                >
                                    <ReplyIcon
                                        sx={{
                                            position: 'absolute',
                                            right: 10,
                                            top: 10,
                                            color: '#fbc02d',
                                            opacity: 0.5,
                                        }}
                                    />
                                    <Typography variant="subtitle2" color="#af8b00" fontWeight={700} gutterBottom>
                                        PHẢN HỒI TỪ GIÁO VIÊN:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#5d4037' }}>
                                        "{requestData.teacherReply}"
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'space-between', bgcolor: 'transparent' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Đóng lại
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                    sx={{
                        borderRadius: '30px',
                        px: 4,
                        py: 1,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                        background: 'linear-gradient(135deg, #0070f3 0%, #00d2ff 100%)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(0,118,255,0.23)',
                        },
                    }}
                >
                    {loading ? 'Đang gửi...' : mode === 'create' ? 'Gửi phiếu' : 'Lưu thay đổi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ParentRequestDialog;
