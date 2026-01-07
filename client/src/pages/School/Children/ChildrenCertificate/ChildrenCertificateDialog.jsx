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
    Divider,
    CircularProgress,
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
    Grid,
    Card,
    CardActionArea,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { childrenCertificateApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import HoaBeNgon from '/hoa_be_ngoan.png'; // Import hình ảnh

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

    // Toggle Hoa bé ngoan
    const toggleGoodChild = () => {
        setFormData((prev) => ({ ...prev, isGoodChild: !prev.isGoodChild }));
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md" // Thu nhỏ lại chút cho gọn, nếu cần rộng thì để lg
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden' },
            }}
        >
            {/* Header: Modern Gradient */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', // Màu pastel trẻ trung
                    color: '#4a4a4a',
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Hình ảnh logo nhỏ ở header */}
                    <Box
                        component="img"
                        src={HoaBeNgon}
                        sx={{ width: 40, height: 40, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            {isEditMode ? 'Cập nhật phiếu bé ngoan' : 'Phiếu bé ngoan tuần'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {studentInfo?.fullName} - {studentInfo?.studentCode}
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.4)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.7)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    p: 0,
                    bgcolor: '#f8f9fa', // --- STYLE THANH CUỘN (SCROLLBAR) ---
                    '&::-webkit-scrollbar': {
                        width: '8px', // Độ rộng của thanh cuộn
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1', // Màu nền rãnh trượt (xám nhạt)
                        borderLeft: '1px solid #e0e0e0',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#ff4081', // ✅ Màu chính đồng bộ với Header
                        borderRadius: '4px', // Bo tròn góc
                        border: '2px solid #ff4081', // Viền trắng tạo khoảng cách giúp thanh cuộn đẹp hơn
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: '#c60055', // Màu đậm hơn khi rê chuột vào
                    },
                    // Dành cho Firefox (nếu cần hỗ trợ)
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ff4081 #f1f1f1',
                }}
            >
                <Box sx={{ p: 3 }}>
                    {/* SECTION 1: Dữ liệu tham khảo (Accordion) */}
                    {previewLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={30} color="inherit" />
                        </Box>
                    ) : previewData ? (
                        <Accordion
                            defaultExpanded={false} // Mặc định đóng để tập trung vào việc đánh giá, user cần thì mở ra
                            sx={{
                                mb: 3,
                                boxShadow: 'none',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px !important',
                                '&:before': { display: 'none' },
                                overflow: 'hidden',
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#fff' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AssessmentOutlinedIcon color="action" />
                                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                                        Xem dữ liệu tham khảo Tuần {weekNumber} (Điểm danh & Đánh giá hằng ngày)
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: '#fff', borderTop: '1px solid #f0f0f0', p: 2 }}>
                                {/* Attendance Summary Chips */}
                                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={`Có mặt: ${previewData.attendanceSummary.present}`}
                                        color="success"
                                        size="large"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Vắng có phép: ${previewData.attendanceSummary.absentWithPermission}`}
                                        color="warning"
                                        size="large"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Vắng không phép: ${previewData.attendanceSummary.absentWithoutPermission}`}
                                        color="error"
                                        size="large"
                                        variant="outlined"
                                    />
                                </Box>

                                {/* Assessment Table */}
                                <TableContainer
                                    component={Paper}
                                    elevation={0}
                                    sx={{ border: '1px solid #eee', borderRadius: 2 }}
                                >
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                                                    Tiêu chí
                                                </TableCell>
                                                {previewData.weekDays.map((day) => (
                                                    <TableCell
                                                        key={day.date}
                                                        align="center"
                                                        sx={{ fontWeight: 600, color: '#475569' }}
                                                    >
                                                        {getDayLabel(day.date)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[
                                                'Điểm danh',
                                                'Tình hình sức khỏe',
                                                'Cảm xúc, Hành vi',
                                                'Kiến thức, Kỹ năng',
                                                'Ghi chú lưu ý',
                                            ].map((criteria, index) => (
                                                <TableRow key={index} hover>
                                                    <TableCell
                                                        sx={{ fontWeight: 500, color: '#334155', bgcolor: '#fafafa' }}
                                                    >
                                                        {criteria}
                                                    </TableCell>
                                                    {previewData.weekDays.map((day) => {
                                                        let content = '';
                                                        if (criteria === 'Điểm danh') content = day.attendance;
                                                        if (criteria === 'Tình hình sức khỏe')
                                                            content = day.assessment?.healthStatus;
                                                        if (criteria === 'Cảm xúc, Hành vi')
                                                            content = day.assessment?.emotionalBehavior;
                                                        if (criteria === 'Kiến thức, Kỹ năng')
                                                            content = day.assessment?.skillsKnowledge;
                                                        if (criteria === 'Ghi chú lưu ý')
                                                            content = day.assessment?.notes;

                                                        if (criteria === 'Điểm danh') {
                                                            return (
                                                                <TableCell key={day.date} align="center">
                                                                    <Chip
                                                                        label={content}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.7rem',
                                                                            bgcolor:
                                                                                content === 'Có mặt'
                                                                                    ? '#dcfce7'
                                                                                    : content?.includes('Vắng')
                                                                                      ? '#fee2e2'
                                                                                      : '#f3f4f6',
                                                                            color:
                                                                                content === 'Có mặt'
                                                                                    ? '#166534'
                                                                                    : content?.includes('Vắng')
                                                                                      ? '#991b1b'
                                                                                      : '#374151',
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                            );
                                                        }

                                                        return (
                                                            <TableCell
                                                                key={day.date}
                                                                sx={{ fontSize: '0.75rem', maxWidth: 120 }}
                                                            >
                                                                {content || (
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="text.secondary"
                                                                        fontStyle="italic"
                                                                    >
                                                                        {day.isHoliday ? '-' : '...'}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                    ) : null}

                    {/* SECTION 2: Trao Phiếu & Nhận xét (Main Interaction) */}
                    <Grid container spacing={3}>
                        {/* Cột trái: Nút trao phiếu (Big Visual Toggle) */}
                        <Grid item xs={12} md={4}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    border: formData.isGoodChild ? '2px solid #ff4081' : '2px dashed #e0e0e0',
                                    borderRadius: 3,
                                    position: 'relative',
                                    overflow: 'visible',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <CardActionArea
                                    onClick={toggleGoodChild}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 2,
                                        bgcolor: formData.isGoodChild ? '#fff0f5' : '#fff',
                                    }}
                                >
                                    {/* Hiệu ứng checkmark khi chọn */}
                                    {formData.isGoodChild && (
                                        <CheckCircleRoundedIcon
                                            sx={{
                                                position: 'absolute',
                                                top: -10,
                                                right: -10,
                                                color: '#ff4081',
                                                bgcolor: '#fff',
                                                borderRadius: '50%',
                                                fontSize: 32,
                                            }}
                                        />
                                    )}

                                    {/* Hình ảnh chính */}
                                    <Box
                                        component="img"
                                        src={HoaBeNgon}
                                        sx={{
                                            width: 100, // Ảnh to rõ
                                            height: 100,
                                            objectFit: 'contain',
                                            mb: 2,
                                            filter: formData.isGoodChild ? 'none' : 'grayscale(100%) opacity(0.5)',
                                            transform: formData.isGoodChild ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy effect
                                        }}
                                    />

                                    <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        color={formData.isGoodChild ? '#ff4081' : 'text.disabled'}
                                    >
                                        {formData.isGoodChild ? 'ĐẠT BÉ NGOAN' : 'CHƯA ĐẠT'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" align="center">
                                        {formData.isGoodChild ? 'Bấm để hủy phiếu' : 'Bấm để trao phiếu'}
                                    </Typography>
                                </CardActionArea>
                            </Card>
                        </Grid>

                        {/* Cột phải: Nhập nhận xét */}
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                    <InfoOutlinedIcon fontSize="small" color="primary" />
                                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                        Lời nhận xét của giáo viên
                                    </Typography>
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6} // Cao hơn để dễ nhập
                                    placeholder="Nhập lời khen ngợi, động viên hoặc nhắc nhở học sinh..."
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#fff',
                                            borderRadius: 2,
                                            fontSize: '0.95rem',
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                            '&:hover fieldset': { borderColor: '#b3b3b3' },
                                            '&.Mui-focused fieldset': { borderColor: '#ff4081', borderWidth: 1 },
                                        },
                                    }}
                                />
                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {formData.comment.length} ký tự
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fff' }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    disabled={loading}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 3, borderColor: '#e0e0e0' }}
                >
                    Đóng
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 4,
                        bgcolor: '#ff4081',
                        boxShadow: '0 4px 10px rgba(255, 64, 129, 0.3)',
                        '&:hover': { bgcolor: '#f50057' },
                        fontWeight: 600,
                    }}
                >
                    {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật phiếu' : 'Lưu phiếu'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChildrenCertificateDialog;
