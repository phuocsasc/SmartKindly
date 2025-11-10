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
    Chip,
    Avatar,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { schoolYearTargetApi, academicYearApi } from '~/apis';
import { toast } from 'react-toastify';

function YearTargetCopyDialog({ open, currentYearId, onClose, onSuccess }) {
    const [selectedFromYear, setSelectedFromYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState([]);

    // ✅ Fetch các năm học inactive (đã kết thúc)
    useEffect(() => {
        if (open && currentYearId) {
            fetchAvailableYears();
        }
    }, [open, currentYearId]);

    // ✅ Fetch preview khi chọn năm
    useEffect(() => {
        if (selectedFromYear) {
            fetchPreviewData();
        } else {
            setPreviewData([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFromYear]);

    const fetchAvailableYears = async () => {
        try {
            console.log('🔍 [YearTargetCopyDialog] Fetching inactive years...');

            // Lấy tất cả năm học inactive (đã kết thúc)
            const academicYearsRes = await academicYearApi.getAll({ page: 1, limit: 100, status: 'inactive' });
            const inactiveYears = academicYearsRes.data.data.academicYears;

            console.log('📅 Inactive years:', inactiveYears.length);

            if (inactiveYears.length === 0) {
                setAvailableYears([]);
                return;
            }

            setAvailableYears(inactiveYears);

            // Tự động chọn năm gần nhất
            if (inactiveYears.length > 0) {
                setSelectedFromYear(inactiveYears[0]._id);
            }
        } catch (error) {
            console.error('❌ Error fetching available years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    const fetchPreviewData = async () => {
        try {
            console.log('🔍 [YearTargetCopyDialog] Fetching preview data for year:', selectedFromYear);

            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: selectedFromYear,
                ageGroup: '',
            });

            const targets = res.data.data.targets;
            console.log('🎯 Targets found:', targets.length);

            // Group by ageGroup
            const preview = targets.map((target) => ({
                ageGroup: target.ageGroup,
                totalMainFields: target.mainFields?.length || 0,
                totalTargets: countTargets(target.mainFields || []),
            }));

            setPreviewData(preview);
        } catch (error) {
            console.error('❌ Error fetching preview:', error);
            toast.error('Lỗi khi tải thông tin xem trước!');
        }
    };

    const countTargets = (mainFields) => {
        let count = 0;
        mainFields.forEach((mainField) => {
            if (mainField.subFields && mainField.subFields.length > 0) {
                mainField.subFields.forEach((subField) => {
                    subField.expectedResults?.forEach((er) => {
                        count += er.targets?.length || 0;
                    });
                });
            } else {
                mainField.expectedResults?.forEach((er) => {
                    count += er.targets?.length || 0;
                });
            }
        });
        return count;
    };

    const handleCopy = async () => {
        if (!selectedFromYear) {
            toast.error('Vui lòng chọn năm học cần copy!');
            return;
        }

        if (previewData.length === 0) {
            toast.error('Năm học được chọn không có dữ liệu mục tiêu!');
            return;
        }

        try {
            setLoading(true);

            await schoolYearTargetApi.copyFromYear({
                fromAcademicYearId: selectedFromYear,
                toAcademicYearId: currentYearId,
            });

            toast.success('Copy mục tiêu từ năm học cũ thành công!');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error copying year targets:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi copy mục tiêu năm học!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedFromYear('');
        setPreviewData([]);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
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
                        Copy mục tiêu từ năm học cũ
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
                            Chức năng này sẽ <strong>copy toàn bộ mục tiêu</strong> (bao gồm cả các mục tiêu cụ thể) từ
                            năm học đã kết thúc sang năm học đang hoạt động.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            ⚠️ <strong>Lưu ý:</strong> Dữ liệu hiện tại của năm học đang hoạt động sẽ bị{' '}
                            <strong>ghi đè hoàn toàn</strong>.
                        </Typography>
                    </Alert>

                    {/* Chọn năm học nguồn */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: '#764ba2',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#764ba2', borderRadius: 1 }} />
                            Chọn năm học nguồn
                        </Typography>

                        {availableYears.length === 0 ? (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                Không có năm học nào đã kết thúc để copy!
                            </Alert>
                        ) : (
                            <FormControl fullWidth size="small">
                                <InputLabel>Chọn năm học *</InputLabel>
                                <Select
                                    value={selectedFromYear}
                                    onChange={(e) => setSelectedFromYear(e.target.value)}
                                    label="Chọn năm học *"
                                    sx={{ borderRadius: 1.5 }}
                                >
                                    {availableYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {year.fromYear}-{year.toYear}
                                                </Typography>
                                                <Chip label="Đã kết thúc" size="small" color="default" />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                    {/* Preview data */}
                    {selectedFromYear && (
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 1.5,
                                    color: '#764ba2',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 3, height: 14, bgcolor: '#764ba2', borderRadius: 1 }} />
                                Thông tin xem trước ({previewData.length} nhóm tuổi)
                            </Typography>

                            {previewData.length === 0 ? (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    Năm học này chưa có dữ liệu mục tiêu nào!
                                </Alert>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Nhóm tuổi</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                                    Số lĩnh vực
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                                    Số mục tiêu
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {previewData.map((item, index) => (
                                                <TableRow key={index} hover>
                                                    <TableCell>{item.ageGroup}</TableCell>
                                                    <TableCell align="center">{item.totalMainFields}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={item.totalTargets}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
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
                    disabled={loading || !selectedFromYear || previewData.length === 0}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5a3680 0%, #4d5bc9 100%)',
                        },
                    }}
                >
                    {loading ? 'Đang copy...' : 'Xác nhận copy'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default YearTargetCopyDialog;
