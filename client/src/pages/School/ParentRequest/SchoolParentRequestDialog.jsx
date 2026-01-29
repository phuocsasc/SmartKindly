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
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
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
            console.error('❌ Error updating request:', error);
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    if (!requestData) return null;

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
                    <PersonIcon />
                    <Typography variant="h6" fontWeight={700}>
                        Phản hồi phiếu dặn dò
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Thông tin học sinh */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Học sinh:
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {requestData.studentId?.fullName || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {requestData.studentId?.studentCode || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Lớp:
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                        {requestData.classId?.name || 'N/A'} - {requestData.classId?.ageGroup || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Tên phiếu */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Tên phiếu:
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {requestData.requestName}
                        </Typography>
                    </Grid>

                    {/* Ngày áp dụng */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Từ ngày:
                        </Typography>
                        <Chip label={dayjs(requestData.fromDate).format('DD/MM/YYYY')} color="primary" size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            <CalendarIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            Đến ngày:
                        </Typography>
                        <Chip label={dayjs(requestData.toDate).format('DD/MM/YYYY')} color="secondary" size="small" />
                    </Grid>

                    {/* Dặn dò từ phụ huynh */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Dặn dò từ phụ huynh:
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#fff9c4', borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                {requestData.parentNote}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    {/* Phản hồi từ giáo viên */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Phản hồi từ giáo viên"
                            value={formData.teacherReply}
                            onChange={(e) => setFormData({ ...formData, teacherReply: e.target.value })}
                            placeholder="Nhập phản hồi cho phụ huynh..."
                            inputProps={{ maxLength: 2000 }}
                            helperText={`${formData.teacherReply.length}/2000 ký tự`}
                        />
                    </Grid>

                    {/* Trạng thái */}
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                label="Trạng thái"
                            >
                                <MenuItem value="Chờ duyệt">
                                    <Chip label="Chờ duyệt" color="warning" size="small" />
                                </MenuItem>
                                <MenuItem value="Đã duyệt">
                                    <Chip label="Đã duyệt" color="success" size="small" />
                                </MenuItem>
                                <MenuItem value="Từ chối">
                                    <Chip label="Từ chối" color="error" size="small" />
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Thông tin tạo/sửa */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Phụ huynh tạo: <strong>{requestData.createdBy?.fullName || 'N/A'}</strong> -{' '}
                                {dayjs(requestData.createdAt).format('HH:mm DD/MM/YYYY')}
                            </Typography>
                            {requestData.lastUpdatedBy && (
                                <>
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                        Cập nhật cuối: <strong>{requestData.lastUpdatedBy.fullName}</strong> -{' '}
                                        {dayjs(requestData.updatedAt).format('HH:mm DD/MM/YYYY')}
                                    </Typography>
                                </>
                            )}
                        </Paper>
                    </Grid>
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
                    startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu phản hồi'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SchoolParentRequestDialog;
