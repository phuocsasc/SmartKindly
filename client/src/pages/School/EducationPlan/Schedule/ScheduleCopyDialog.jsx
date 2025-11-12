// client/src/pages/School/EducationPlan/Schedule/ScheduleCopyDialog.jsx

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    IconButton,
    Avatar,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { scheduleApi, academicYearApi } from '~/apis';
import { toast } from 'react-toastify';

function ScheduleCopyDialog({ open, currentYearId, onClose, onSuccess }) {
    const [selectedFromYear, setSelectedFromYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingPreview, setFetchingPreview] = useState(false);
    const [previewPeriods, setPreviewPeriods] = useState([]);

    useEffect(() => {
        if (open && currentYearId) {
            fetchAvailableYears();
        }
    }, [open, currentYearId]);

    useEffect(() => {
        if (selectedFromYear) {
            fetchPreviewData();
        } else {
            setPreviewPeriods([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFromYear]);

    const fetchAvailableYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;

            // Lọc các năm học đã kết thúc (inactive) và khác năm hiện tại
            const inactiveYears = years.filter((year) => year.status === 'inactive' && year._id !== currentYearId);

            setAvailableYears(inactiveYears);
        } catch (error) {
            console.error('Error fetching available years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    const fetchPreviewData = async () => {
        try {
            setFetchingPreview(true);

            const res = await scheduleApi.getByAcademicYear(selectedFromYear);
            const schedule = res.data.data;

            if (!schedule || !schedule.weeks || schedule.weeks.length === 0) {
                setPreviewPeriods([]);
                toast.warning('Năm học này chưa có thời khóa biểu!');
                return;
            }

            // Get activity periods from first week
            const firstWeek = schedule.weeks[0];
            if (firstWeek.activityPeriods && firstWeek.activityPeriods.length > 0) {
                setPreviewPeriods(firstWeek.activityPeriods);
            } else {
                setPreviewPeriods([]);
                toast.warning('Năm học này chưa có mốc hoạt động nào!');
            }
        } catch (error) {
            console.error('Error fetching preview:', error);
            setPreviewPeriods([]);
            toast.error('Lỗi khi tải thông tin xem trước!');
        } finally {
            setFetchingPreview(false);
        }
    };

    const handleCopy = async () => {
        if (!selectedFromYear) {
            toast.error('Vui lòng chọn năm học nguồn!');
            return;
        }

        if (previewPeriods.length === 0) {
            toast.error('Năm học nguồn không có mốc hoạt động nào để copy!');
            return;
        }

        try {
            setLoading(true);

            const res = await scheduleApi.copyFromYear({
                fromAcademicYearId: selectedFromYear,
                toAcademicYearId: currentYearId,
            });

            const message = res.data.data.message || 'Copy thời khóa biểu từ năm học cũ thành công!';
            toast.success(message);

            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error copying schedule:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi copy thời khóa biểu!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedFromYear('');
        setPreviewPeriods([]);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            width: 32,
                            height: 32,
                        }}
                    >
                        <ContentCopyIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Copy mốc hoạt động từ năm học cũ
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
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Thông báo */}
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                            Chọn năm học nguồn để copy <strong>các mốc hoạt động</strong> sang toàn bộ tuần trong năm
                            học đang hoạt động.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            ⚠️ <strong>Lưu ý:</strong> Các mốc hoạt động hiện tại sẽ bị{' '}
                            <strong>ghi đè hoàn toàn</strong>.
                        </Typography>
                    </Alert>

                    {/* Select năm học nguồn */}
                    <FormControl fullWidth size="small">
                        <InputLabel>Chọn năm học nguồn</InputLabel>
                        <Select
                            value={selectedFromYear}
                            onChange={(e) => setSelectedFromYear(e.target.value)}
                            label="Chọn năm học nguồn"
                        >
                            <MenuItem value="">
                                <em>-- Chọn năm học --</em>
                            </MenuItem>
                            {availableYears.map((year) => (
                                <MenuItem key={year._id} value={year._id}>
                                    Năm học {year.fromYear}-{year.toYear}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Preview data */}
                    {fetchingPreview ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedFromYear && previewPeriods.length > 0 ? (
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 1.5,
                                    color: '#667eea',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 3, height: 14, bgcolor: '#667eea', borderRadius: 1 }} />
                                Xem trước mốc hoạt động ({previewPeriods.length} mốc)
                            </Typography>

                            <TableContainer
                                component={Paper}
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    maxHeight: 400,
                                }}
                            >
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, bgcolor: '#ede7f6', width: '10%' }}>
                                                STT
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, bgcolor: '#ede7f6', width: '30%' }}>
                                                Thời gian
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, bgcolor: '#ede7f6', width: '60%' }}>
                                                Mô tả hoạt động
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {previewPeriods.map((period, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600} color="primary">
                                                        {period.startTime} - {period.endTime}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{period.description}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        selectedFromYear && (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                Năm học nguồn không có mốc hoạt động nào!
                            </Alert>
                        )
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleCopy}
                    disabled={loading || fetchingPreview || !selectedFromYear || previewPeriods.length === 0}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4d5bc9 0%, #5a3680 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang copy...' : 'Xác nhận copy'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ScheduleCopyDialog;
