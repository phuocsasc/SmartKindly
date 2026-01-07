// client/src/pages/School/Children/ChildrenCertificate/ChildrenCertificateDialog.jsx

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
    FormControlLabel,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { childrenCertificateApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function ChildrenCertificateDialog({
    open,
    studentInfo,
    classId,
    academicYearId,
    weekNumber,
    existingCertificate,
    onClose,
    onSuccess,
}) {
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [formData, setFormData] = useState({
        isGoodChild: false,
        comment: '',
    });

    const isEditMode = !!existingCertificate;

    // ✅ Initialize form data
    useEffect(() => {
        if (open) {
            if (existingCertificate) {
                setFormData({
                    isGoodChild: existingCertificate.isGoodChild || false,
                    comment: existingCertificate.comment || '',
                });
            } else {
                setFormData({
                    isGoodChild: false,
                    comment: '',
                });
            }
        }
    }, [open, existingCertificate]);

    // ✅ Fetch preview data when dialog opens
    useEffect(() => {
        if (open && studentInfo && academicYearId && classId && weekNumber) {
            fetchPreviewData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, studentInfo, academicYearId, classId, weekNumber]);

    // ✅ Reset form when closing
    useEffect(() => {
        if (!open) {
            setFormData({
                isGoodChild: false,
                comment: '',
            });
            setPreviewData(null);
        }
    }, [open]);

    // ✅ Fetch preview data
    const fetchPreviewData = async () => {
        try {
            setPreviewLoading(true);
            const res = await childrenCertificateApi.getPreviewData({
                academicYearId,
                classId,
                studentId: studentInfo._id,
                weekNumber,
            });
            setPreviewData(res.data.data);
        } catch (error) {
            console.error('Error fetching preview data:', error);
            toast.error('Lỗi khi tải dữ liệu xem trước!');
        } finally {
            setPreviewLoading(false);
        }
    };

    // ✅ Handle submit
    const handleSubmit = async () => {
        // Validate required field
        if (!formData.comment.trim()) {
            toast.warning('Vui lòng nhập nhận xét!');
            return;
        }

        try {
            setLoading(true);

            if (isEditMode) {
                await childrenCertificateApi.update(existingCertificate._id, formData);
                toast.success('Cập nhật phiếu bé ngoan thành công!');
            } else {
                const payload = {
                    academicYearId,
                    classId,
                    studentId: studentInfo._id,
                    weekNumber,
                    ...formData,
                };
                await childrenCertificateApi.create(payload);
                toast.success('Thêm phiếu bé ngoan thành công!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving certificate:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi lưu phiếu bé ngoan!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle close with cleanup
    const handleClose = () => {
        setFormData({
            isGoodChild: false,
            comment: '',
        });
        setPreviewData(null);
        onClose();
    };

    // ✅ Get day label
    const getDayLabel = (dateStr) => {
        const date = dayjs(dateStr);
        const dayOfWeek = date.day();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return `${dayNames[dayOfWeek]} (${date.format('DD/MM')})`;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #ff4081 0%, #f50057 100%)',
                    color: 'white',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <LocalFloristRoundedIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {isEditMode ? 'Cập nhật phiếu bé ngoan' : 'Thêm phiếu bé ngoan'}
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
                        bgcolor: '#fff0f5',
                        borderRadius: 2,
                        border: '1px solid #ffcce0',
                    }}
                >
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                        <strong>Học sinh:</strong> {studentInfo?.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Mã HS:</strong> {studentInfo?.studentCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Tuần:</strong> Tuần {weekNumber}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* ✅ Preview Data Section */}
                {previewLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : previewData ? (
                    <Accordion defaultExpanded sx={{ mb: 3, boxShadow: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssessmentOutlinedIcon color="primary" />
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Thông tin tham khảo (Tuần {weekNumber})
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            {/* Attendance Summary */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#667eea' }}>
                                    Tổng hợp điểm danh
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`Có mặt: ${previewData.attendanceSummary.present}/${previewData.attendanceSummary.totalDays}`}
                                        color="success"
                                        size="small"
                                    />
                                    <Chip
                                        label={`Vắng có phép: ${previewData.attendanceSummary.absentWithPermission}/${previewData.attendanceSummary.totalDays}`}
                                        color="warning"
                                        size="small"
                                    />
                                    <Chip
                                        label={`Vắng không phép: ${previewData.attendanceSummary.absentWithoutPermission}/${previewData.attendanceSummary.totalDays}`}
                                        color="error"
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Assessment Table */}
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#667eea' }}>
                                    Tổng hợp Đánh giá hằng ngày
                                </Typography>
                                <TableContainer component={Paper} sx={{ maxHeight: 300, border: '1px solid #e0e0e0' }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    sx={{
                                                        bgcolor: '#e3f2fd',
                                                        fontWeight: 600,
                                                        minWidth: 150,
                                                    }}
                                                >
                                                    Tiêu chí
                                                </TableCell>
                                                {previewData.weekDays.map((day) => (
                                                    <TableCell
                                                        key={day.date}
                                                        align="center"
                                                        sx={{
                                                            bgcolor: '#e3f2fd',
                                                            fontWeight: 600,
                                                            minWidth: 120,
                                                        }}
                                                    >
                                                        {getDayLabel(day.date)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {/* Điểm danh */}
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>
                                                    Điểm danh
                                                </TableCell>
                                                {previewData.weekDays.map((day) => (
                                                    <TableCell
                                                        key={day.date}
                                                        align="center"
                                                        sx={{ fontSize: '0.8rem' }}
                                                    >
                                                        <Chip
                                                            label={day.attendance}
                                                            size="small"
                                                            color={
                                                                day.attendance === 'Có mặt'
                                                                    ? 'success'
                                                                    : day.attendance === 'Vắng có phép'
                                                                      ? 'warning'
                                                                      : day.attendance === 'Vắng không phép'
                                                                        ? 'error'
                                                                        : 'default'
                                                            }
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    </TableCell>
                                                ))}
                                            </TableRow>

                                            {/* Tình trạng sức khỏe */}
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>
                                                    Sức khỏe
                                                </TableCell>
                                                {previewData.weekDays.map((day) => (
                                                    <TableCell
                                                        key={day.date}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            whiteSpace: 'pre-line',
                                                            maxWidth: 150,
                                                        }}
                                                    >
                                                        {day.assessment?.healthStatus || (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontStyle="italic"
                                                            >
                                                                {day.isHoliday ? 'Ngày nghỉ' : 'Chưa đánh giá'}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>

                                            {/* Cảm xúc/Hành vi */}
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>
                                                    Cảm xúc/Hành vi
                                                </TableCell>
                                                {previewData.weekDays.map((day) => (
                                                    <TableCell
                                                        key={day.date}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            whiteSpace: 'pre-line',
                                                            maxWidth: 150,
                                                        }}
                                                    >
                                                        {day.assessment?.emotionalBehavior || (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontStyle="italic"
                                                            >
                                                                {day.isHoliday ? 'Ngày nghỉ' : 'Chưa đánh giá'}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>

                                            {/* Kiến thức/Kỹ năng */}
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>
                                                    Kiến thức/Kỹ năng
                                                </TableCell>
                                                {previewData.weekDays.map((day) => (
                                                    <TableCell
                                                        key={day.date}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            whiteSpace: 'pre-line',
                                                            maxWidth: 150,
                                                        }}
                                                    >
                                                        {day.assessment?.skillsKnowledge || (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontStyle="italic"
                                                            >
                                                                {day.isHoliday ? 'Ngày nghỉ' : 'Chưa đánh giá'}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>

                                            {/* Lưu ý */}
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>
                                                    Lưu ý
                                                </TableCell>
                                                {previewData.weekDays.map((day) => (
                                                    <TableCell
                                                        key={day.date}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            whiteSpace: 'pre-line',
                                                            maxWidth: 150,
                                                        }}
                                                    >
                                                        {day.assessment?.notes || (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontStyle="italic"
                                                            >
                                                                {day.isHoliday ? 'Ngày nghỉ' : 'Không có'}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ) : null}

                {/* Hoa bé ngoan */}
                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData.isGoodChild}
                                onChange={(e) => setFormData({ ...formData, isGoodChild: e.target.checked })}
                                icon={<LocalFloristRoundedIcon sx={{ fontSize: 32, color: '#bdbdbd' }} />}
                                checkedIcon={<LocalFloristRoundedIcon sx={{ fontSize: 32, color: '#ff4081' }} />}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    variant="body1"
                                    fontWeight={600}
                                    sx={{
                                        color: formData.isGoodChild ? '#ff4081' : '#000',
                                    }}
                                >
                                    Trao hoa bé ngoan Tuần {weekNumber}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: formData.isGoodChild ? '#ff4081' : '#757575',
                                    }}
                                >
                                    ({formData.isGoodChild ? 'Bé ngoan' : 'Chưa chọn'})
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Nhận xét */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#ff4081', fontWeight: 600 }}>
                        Nhận xét Tuần {weekNumber} *
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        placeholder="Nhập nhận xét về học sinh trong tuần này..."
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                            },
                        }}
                    />
                </Box>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
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
                        background: 'linear-gradient(135deg, #ff4081 0%, #f50057 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #e91e63 0%, #c51162 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Lưu phiếu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenCertificateDialog;
