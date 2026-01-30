// client/src/pages/School/ParentRequest/SchoolParentRequestDialog.jsx

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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Divider,
    Chip,
    Paper,
    Avatar,
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    History as HistoryIcon,
    AssignmentOutlined as FormIcon,
    CalendarMonth as DateIcon,
    Message as MessageIcon,
} from '@mui/icons-material';
import { parentRequestApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function SchoolParentRequestDialog({ open, requestData, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        teacherReply: '',
        status: '',
    });

    useEffect(() => {
        if (open && requestData) {
            setFormData({
                teacherReply: requestData.teacherReply || '',
                status: requestData.status || 'Chờ duyệt',
            });
        }
    }, [open, requestData]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                teacherReply: formData.teacherReply.trim(),
                status: formData.status,
            };
            await parentRequestApi.update(requestData._id, payload);
            toast.success('Cập nhật phản hồi thành công!');
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Đã duyệt':
                return { color: '#2e7d32', bg: '#e8f5e9' };
            case 'Từ chối':
                return { color: '#d32f2f', bg: '#ffebee' };
            default:
                return { color: '#ed6c02', bg: '#fff3e0' };
        }
    };

    if (!requestData) return null;

    const statusStyle = getStatusStyles(formData.status);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="body"
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    bgcolor: '#f8fafc',
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                },
            }}
        >
            {/* Thanh tiêu đề hiện đại */}
            <DialogTitle sx={{ p: 0 }}>
                <Box
                    sx={{
                        bgcolor: '#1e293b',
                        color: '#fff',
                        px: 3,
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTopLeftRadius: 'inherit',
                        borderTopRightRadius: 'inherit',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#38bdf8', width: 32, height: 32 }}>
                            <FormIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                            PHẢN HỒI PHIẾU DẶN DÒ
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={3}>
                    {/* Cột trái: Thông tin phiếu (Dạng tờ giấy) */}
                    <Grid item xs={12} md={7}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                position: 'relative',
                                minHeight: '100%',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                        >
                            {/* Tem trạng thái */}
                            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                                <Chip
                                    label={formData.status.toUpperCase()}
                                    size="small"
                                    sx={{
                                        fontWeight: 400,
                                        bgcolor: statusStyle.bg,
                                        color: statusStyle.color,
                                        border: `1px solid ${statusStyle.color}`,
                                    }}
                                />
                            </Box>

                            {/* Info học sinh */}
                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 56, height: 56, bgcolor: '#e2e8f0', color: '#475569' }}>
                                    {requestData.studentId?.fullName?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={600} color="#1e293b">
                                        {requestData.studentId?.fullName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {requestData.studentId?.studentCode} • Lớp: <b>{requestData.classId?.name}</b>
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3, borderStyle: 'dashed' }} />

                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Tiêu đề phiếu dặn dò
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#0f172a', mb: 2, fontWeight: 600 }}>
                                {requestData.requestName}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                                <Box>
                                    <Typography variant="overline" display="block" color="text.secondary">
                                        TỪ NGÀY
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <DateIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                        <Typography variant="body2" fontWeight={600}>
                                            {dayjs(requestData.fromDate).format('DD/MM/YYYY')}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="overline" display="block" color="text.secondary">
                                        ĐẾN NGÀY
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <DateIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                        <Typography variant="body2" fontWeight={600}>
                                            {dayjs(requestData.toDate).format('DD/MM/YYYY')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ bgcolor: '#fffbeb', p: 2, borderRadius: 2, borderLeft: '4px solid #f59e0b' }}>
                                <Typography
                                    variant="caption"
                                    color="#b45309"
                                    fontWeight={600}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
                                >
                                    <MessageIcon sx={{ fontSize: 14 }} /> NỘI DUNG DẶN DÒ TỪ PHỤ HUYNH
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#451a03' }}>
                                    {requestData.parentNote}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Cột phải: Thao tác của Giáo viên */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Form Phản hồi */}
                            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                                <Typography variant="subtitle2" gutterBottom fontWeight={700} color="#1e293b">
                                    PHẢN HỒI CỦA GIÁO VIÊN
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    placeholder="Nhập lời nhắn gửi đến phụ huynh..."
                                    value={formData.teacherReply}
                                    onChange={(e) => setFormData({ ...formData, teacherReply: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc', borderRadius: 2 },
                                        mb: 2,
                                    }}
                                    inputProps={{ maxLength: 2000 }}
                                    helperText={`${formData.teacherReply.length}/2000 ký tự`}
                                />

                                <FormControl fullWidth size="small">
                                    <InputLabel>Quyết định trạng thái</InputLabel>
                                    <Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        label="Quyết định trạng thái"
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="Chờ duyệt">Chờ duyệt (Đang xem xét)</MenuItem>
                                        <MenuItem value="Đã duyệt">Đã duyệt (Chấp thuận)</MenuItem>
                                        <MenuItem value="Từ chối">Từ chối (Không chấp thuận)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Paper>

                            {/* Lịch sử/Thông tin thêm */}
                            <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#f1f5f9', border: '1px dashed #cbd5e1' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <HistoryIcon sx={{ fontSize: 18, color: '#64748b' }} />
                                    <Typography variant="caption" fontWeight={600} color="#475569">
                                        NGƯỜI TẠO PHIẾU
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" component="div">
                                    • <b>Phụ huynh bé:</b> {requestData.createdBy?.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" component="div">
                                    • <b>Vào lúc:</b> {dayjs(requestData.createdAt).format('HH:mm - DD/MM/YYYY')}
                                </Typography>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button
                    onClick={onClose}
                    variant="text"
                    sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none' }}
                >
                    Đóng cửa sổ
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    sx={{
                        borderRadius: '12px',
                        px: 4,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.25)',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        '&:hover': { background: '#0f172a' },
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Xác nhận & Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SchoolParentRequestDialog;
