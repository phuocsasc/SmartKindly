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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { childrenCertificateApi } from '~/apis';
import { toast } from 'react-toastify';

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

    // ✅ Handle delete
    const handleDelete = async () => {
        if (!existingCertificate || !existingCertificate._id) return;

        try {
            setLoading(true);
            await childrenCertificateApi.delete(existingCertificate._id);
            toast.success('Xóa phiếu bé ngoan thành công!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting certificate:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi xóa phiếu bé ngoan!');
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
                                        label={`Đi trễ: ${previewData.attendanceSummary.late}/${previewData.attendanceSummary.totalDays}`}
                                        color="info"
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

                            {/* Assessment Grid */}
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
                                                        {day.dayLabel}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {previewData.assessmentGrid.map((row, idx) => (
                                                <TableRow key={idx} hover>
                                                    <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>
                                                        {row.criteria}
                                                    </TableCell>
                                                    {row.days.map((dayData, dayIdx) => (
                                                        <TableCell
                                                            key={dayIdx}
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                whiteSpace: 'pre-line',
                                                                maxWidth: 150,
                                                                minHeight: 60,
                                                            }}
                                                        >
                                                            {dayData.content || (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    fontStyle="italic"
                                                                >
                                                                    Chưa đánh giá
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
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
                                    Hoa bé ngoan
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: formData.isGoodChild ? '#ff4081' : '#000',
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
                        Nhận xét *
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={5}
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
            <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'space-between' }}>
                {/* Delete button - Only show in edit mode */}
                {isEditMode && existingCertificate?._id && (
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
                        Xóa phiếu
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
