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

    // Common style for inputs
    const commonInputStyle = {
        '& .MuiInputLabel-root.Mui-focused': { color: '#0071bc' },
        '& .MuiInput-underline:after': { borderBottomColor: '#0071bc' }, // For standard variant
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
                        bgcolor: '#0071bc',
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
                            // Viền bên trái giả sổ ghi chép đổi thành màu xanh chủ đạo
                            content: '""',
                            position: 'absolute',
                            left: '10px',
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            bgcolor: '#0071bc',
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
                                fontWeight={600}
                                sx={{ fontFamily: '"Roboto Condensed", sans-serif', color: '#0071bc' }}
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
                                    borderColor: '#0071bc',
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <EditIcon fontSize="small" sx={{ color: '#0071bc' }} />
                                <Typography variant="body2" fontWeight={600} sx={{ color: '#0071bc' }}>
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
                                sx={commonInputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <CalendarIcon fontSize="small" sx={{ color: '#0071bc' }} />
                                <Typography variant="body2" fontWeight={600} sx={{ color: '#0071bc' }}>
                                    Áp dụng từ ngày *
                                </Typography>
                            </Box>
                            <DatePicker
                                value={formData.fromDate}
                                onChange={(newValue) => setFormData({ ...formData, fromDate: newValue })}
                                format="DD/MM/YYYY"
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'standard',
                                        sx: commonInputStyle,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                <CalendarIcon fontSize="small" sx={{ color: '#0071bc' }} />
                                <Typography variant="body2" fontWeight={600} sx={{ color: '#0071bc' }}>
                                    Áp dụng đến ngày *
                                </Typography>
                            </Box>
                            <DatePicker
                                value={formData.toDate}
                                onChange={(newValue) => setFormData({ ...formData, toDate: newValue })}
                                format="DD/MM/YYYY"
                                minDate={formData.fromDate}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'standard',
                                        sx: commonInputStyle,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <NoteIcon fontSize="small" sx={{ color: '#0071bc' }} />
                                    <Typography variant="body2" fontWeight={600} sx={{ color: '#0071bc' }}>
                                        Nội dung chi tiết *
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    color={formData.parentNote.length >= 1000 ? 'error' : 'text.secondary'}
                                >
                                    {formData.parentNote.length}/1000 ký tự
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={5} // Cố định chiều cao hiển thị đúng 5 dòng
                                placeholder="Viết nội dung dặn dò tại đây..."
                                value={formData.parentNote}
                                onChange={(e) => {
                                    // Giới hạn không cho nhập quá 1000 ký tự
                                    if (e.target.value.length <= 1000) {
                                        setFormData({ ...formData, parentNote: e.target.value });
                                    }
                                }}
                                inputProps={{ maxLength: 1000 }} // Hỗ trợ chặn copy-paste lố ký tự
                                sx={{
                                    '& .MuiInputBase-root': {
                                        padding: '4px 8px',
                                        alignItems: 'flex-start',
                                    },
                                    '& .MuiInputBase-input': {
                                        lineHeight: '28px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        // Đưa background vào thẳng thẻ input (textarea) và dùng 'local' để dòng kẻ cuộn theo chữ
                                        backgroundImage: 'linear-gradient(transparent, transparent 27px, #e5e7eb 27px)',
                                        backgroundSize: '100% 28px',
                                        backgroundAttachment: 'local',

                                        // Tùy chỉnh thanh cuộn (scrollbar) cho đẹp và đồng bộ màu
                                        '&::-webkit-scrollbar': { width: '6px' },
                                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                                        '&::-webkit-scrollbar-thumb': { background: '#0071bc', borderRadius: '4px' },
                                        '&::-webkit-scrollbar-thumb:hover': { background: '#005a9e' },
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': { borderColor: '#0071bc' },
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
                                        bgcolor: '#e3f2fd',
                                        borderRadius: '8px',
                                        borderLeft: '5px solid #0071bc',
                                        position: 'relative',
                                    }}
                                >
                                    <ReplyIcon
                                        sx={{
                                            position: 'absolute',
                                            right: 10,
                                            top: 10,
                                            color: '#0071bc',
                                            opacity: 0.5,
                                        }}
                                    />
                                    <Typography variant="subtitle2" color="#0071bc" fontWeight={700} gutterBottom>
                                        PHẢN HỒI TỪ GIÁO VIÊN:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#1a202c' }}>
                                        "{requestData.teacherReply}"
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </DialogContent>

            {/* Điều chỉnh DialogActions để chứa các nút nhỏ lại và dồn về phía bên phải */}
            <DialogActions
                sx={{ p: 2, px: { xs: 2, md: 4 }, bgcolor: 'transparent', justifyContent: 'flex-end', gap: 1 }}
            >
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                    sx={{
                        color: '#0071bc',
                        borderColor: '#0071bc',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '20px',
                        px: 3,
                        '&:hover': {
                            borderColor: '#005a9e',
                            bgcolor: 'rgba(0, 113, 188, 0.08)',
                        },
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    size="small"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
                    sx={{
                        borderRadius: '20px',
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#0071bc',
                        boxShadow: '0 2px 8px 0 rgba(0, 113, 188, 0.3)',
                        '&:hover': {
                            bgcolor: '#005a9e',
                            boxShadow: '0 4px 12px rgba(0, 113, 188, 0.4)',
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
