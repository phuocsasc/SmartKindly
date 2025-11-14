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
    Tabs,
    Tab,
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

const ALL_AGE_GROUPS = [
    { value: 'Nhà trẻ 3-12 tháng', label: 'Nhà trẻ 3-12 tháng' },
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function YearTargetCopyDialog({ open, currentYearId, onClose, onSuccess }) {
    const [selectedFromYear, setSelectedFromYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState({});
    const [tabValue, setTabValue] = useState(0);
    const [allowedAgeGroups, setAllowedAgeGroups] = useState([]);

    // ✅ Fetch các năm học inactive
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
            setPreviewData({});
            setAllowedAgeGroups([]);
            setTabValue(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFromYear]);

    const fetchAvailableYears = async () => {
        try {
            console.log('🔍 [YearTargetCopyDialog] Fetching inactive years...');

            const academicYearsRes = await academicYearApi.getAll({ page: 1, limit: 100, status: 'inactive' });
            const inactiveYears = academicYearsRes.data.data.academicYears;

            console.log('📅 Inactive years:', inactiveYears.length);
            setAvailableYears(inactiveYears);

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

            if (targets.length === 0) {
                setPreviewData({});
                setAllowedAgeGroups([]);
                return;
            }

            // ✅ Group targets by ageGroup
            const grouped = {};
            targets.forEach((target) => {
                grouped[target.ageGroup] = target;
            });

            setPreviewData(grouped);

            // ✅ Update allowed age groups
            const fetchedAgeGroups = targets.map((t) => t.ageGroup);
            const filtered = ALL_AGE_GROUPS.filter((group) => fetchedAgeGroups.includes(group.value));
            setAllowedAgeGroups(filtered);
            setTabValue(0);
        } catch (error) {
            console.error('❌ Error fetching preview:', error);
            toast.error('Lỗi khi tải thông tin xem trước!');
        }
    };

    const handleCopy = async () => {
        if (!selectedFromYear) {
            toast.error('Vui lòng chọn năm học cần copy!');
            return;
        }

        if (Object.keys(previewData).length === 0) {
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
        setPreviewData({});
        setAllowedAgeGroups([]);
        setTabValue(0);
        onClose();
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // ✅ Convert data to table rows for current tab
    const getTableRows = () => {
        const currentAgeGroup = allowedAgeGroups[tabValue]?.value;
        if (!currentAgeGroup) return [];

        const currentData = previewData[currentAgeGroup];
        if (!currentData || !currentData.mainFields) return [];

        const rows = [];
        let globalMtNumber = 1;

        currentData.mainFields.forEach((mainField) => {
            if (mainField.subFields && mainField.subFields.length > 0) {
                mainField.subFields.forEach((subField) => {
                    subField.expectedResults?.forEach((expectedResult) => {
                        const targets = expectedResult.targets || [];
                        const targetCount = Math.max(targets.length, 1);

                        targets.forEach((target, targetIdx) => {
                            rows.push({
                                id: `${mainField.code}-${subField.code}-${expectedResult.code}-${globalMtNumber}`,
                                mtNumber: globalMtNumber++,
                                mainFieldCode: mainField.code,
                                mainFieldName: mainField.name,
                                subFieldCode: subField.code,
                                subFieldName: subField.name,
                                expectedResultCode: expectedResult.code,
                                expectedResultDescription: expectedResult.description,
                                targetCode: target.code,
                                targetContent: target.content,
                                isFirstInExpectedResult: targetIdx === 0,
                                expectedResultRowSpan: targetCount,
                            });
                        });

                        if (targets.length === 0) {
                            rows.push({
                                id: `${mainField.code}-${subField.code}-${expectedResult.code}-empty`,
                                mtNumber: null,
                                mainFieldCode: mainField.code,
                                mainFieldName: mainField.name,
                                subFieldCode: subField.code,
                                subFieldName: subField.name,
                                expectedResultCode: expectedResult.code,
                                expectedResultDescription: expectedResult.description,
                                targetCode: null,
                                targetContent: null,
                                isEmpty: true,
                                isFirstInExpectedResult: true,
                                expectedResultRowSpan: 1,
                            });
                        }
                    });
                });
            } else {
                mainField.expectedResults?.forEach((expectedResult) => {
                    const targets = expectedResult.targets || [];
                    const targetCount = Math.max(targets.length, 1);

                    targets.forEach((target, targetIdx) => {
                        rows.push({
                            id: `${mainField.code}-${expectedResult.code}-${globalMtNumber}`,
                            mtNumber: globalMtNumber++,
                            mainFieldCode: mainField.code,
                            mainFieldName: mainField.name,
                            subFieldCode: null,
                            subFieldName: null,
                            expectedResultCode: expectedResult.code,
                            expectedResultDescription: expectedResult.description,
                            targetCode: target.code,
                            targetContent: target.content,
                            isFirstInExpectedResult: targetIdx === 0,
                            expectedResultRowSpan: targetCount,
                        });
                    });

                    if (targets.length === 0) {
                        rows.push({
                            id: `${mainField.code}-${expectedResult.code}-empty`,
                            mtNumber: null,
                            mainFieldCode: mainField.code,
                            mainFieldName: mainField.name,
                            subFieldCode: null,
                            subFieldName: null,
                            expectedResultCode: expectedResult.code,
                            expectedResultDescription: expectedResult.description,
                            targetCode: null,
                            targetContent: null,
                            isEmpty: true,
                            isFirstInExpectedResult: true,
                            expectedResultRowSpan: 1,
                        });
                    }
                });
            }
        });

        return rows;
    };

    const tableRows = getTableRows();

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: 'white',
                    py: 1,
                    mb: 2,
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
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    maxHeight: '75vh',
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                    },
                    '& label.Mui-focused': { color: '#667eea' },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Thông báo */}
                    <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                        <Typography variant="body2">
                            Chức năng này sẽ <strong>copy toàn bộ mục tiêu</strong> (bao gồm cả các mục tiêu cụ thể) từ
                            năm học đã kết thúc sang năm học đang hoạt động.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Lưu ý:</strong> Dữ liệu hiện tại của năm học đang hoạt động sẽ bị{' '}
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

                    {/* Preview data với Tabs */}
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
                                Thông tin xem trước ({allowedAgeGroups.length} nhóm tuổi)
                            </Typography>

                            {allowedAgeGroups.length === 0 ? (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    Năm học này chưa có dữ liệu mục tiêu nào!
                                </Alert>
                            ) : (
                                <>
                                    {/* Tabs */}
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                        <Tabs
                                            value={tabValue}
                                            onChange={handleTabChange}
                                            variant="scrollable"
                                            scrollButtons="auto"
                                            sx={{
                                                '& .MuiTab-root': {
                                                    textTransform: 'none',
                                                    fontWeight: 500,
                                                    fontSize: '0.85rem',
                                                },
                                                '& .Mui-selected': {
                                                    color: '#764ba2',
                                                    fontWeight: 600,
                                                },
                                                '& .MuiTabs-indicator': {
                                                    backgroundColor: '#764ba2',
                                                    height: 3,
                                                },
                                            }}
                                        >
                                            {allowedAgeGroups.map((group, index) => (
                                                <Tab key={index} label={group.label} />
                                            ))}
                                        </Tabs>
                                    </Box>

                                    {/* Table Preview */}
                                    {tableRows.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Chưa có dữ liệu mục tiêu cho nhóm tuổi này
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <TableContainer
                                            component={Paper}
                                            sx={{
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                maxHeight: 400,
                                                overflowY: 'auto',
                                                '&::-webkit-scrollbar': { width: 6 },
                                                '&::-webkit-scrollbar-thumb': {
                                                    backgroundColor: '#764ba2',
                                                    borderRadius: 4,
                                                },
                                            }}
                                        >
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 700,
                                                                bgcolor: '#f3e5f5',
                                                                width: '30%',
                                                            }}
                                                        >
                                                            Lĩnh vực phát triển
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 700,
                                                                bgcolor: '#f3e5f5',
                                                                width: '30%',
                                                            }}
                                                        >
                                                            Kết quả mong đợi
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 700,
                                                                bgcolor: '#f3e5f5',
                                                                width: '40%',
                                                            }}
                                                        >
                                                            Mục tiêu
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>

                                                <TableBody>
                                                    {tableRows.map((row, index) => {
                                                        const showDevelopmentField =
                                                            index === 0 ||
                                                            tableRows[index - 1].mainFieldCode !== row.mainFieldCode ||
                                                            tableRows[index - 1].subFieldCode !== row.subFieldCode;

                                                        const developmentFieldRowSpan = tableRows.filter(
                                                            (r) =>
                                                                r.mainFieldCode === row.mainFieldCode &&
                                                                r.subFieldCode === row.subFieldCode,
                                                        ).length;

                                                        return (
                                                            <TableRow key={row.id} hover>
                                                                {/* Lĩnh vực phát triển (Merged) */}
                                                                {showDevelopmentField && (
                                                                    <TableCell
                                                                        rowSpan={developmentFieldRowSpan}
                                                                        sx={{
                                                                            verticalAlign: 'top',
                                                                            borderRight: '1px solid #e0e0e0',
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            variant="body2"
                                                                            fontWeight={600}
                                                                            color="primary"
                                                                        >
                                                                            {row.mainFieldCode}. {row.mainFieldName}
                                                                        </Typography>
                                                                        {row.subFieldCode && (
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="secondary"
                                                                                sx={{ fontStyle: 'italic', mt: 0.5 }}
                                                                            >
                                                                                {row.subFieldCode} {row.subFieldName}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                )}

                                                                {/* Kết quả mong đợi (Merged) */}
                                                                {row.isFirstInExpectedResult && (
                                                                    <TableCell
                                                                        rowSpan={row.expectedResultRowSpan}
                                                                        sx={{
                                                                            verticalAlign: 'top',
                                                                            borderRight: '1px solid #e0e0e0',
                                                                        }}
                                                                    >
                                                                        <Typography variant="body2">
                                                                            <strong>{row.expectedResultCode}.</strong>{' '}
                                                                            {row.expectedResultDescription}
                                                                        </Typography>
                                                                    </TableCell>
                                                                )}

                                                                {/* Mục tiêu */}
                                                                <TableCell>
                                                                    {row.isEmpty ? (
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="text.secondary"
                                                                            sx={{ fontStyle: 'italic' }}
                                                                        >
                                                                            Chưa có mục tiêu
                                                                        </Typography>
                                                                    ) : (
                                                                        <Box
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 1,
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label={row.targetCode}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: '#f3e5f5',
                                                                                    color: '#764ba2',
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            />
                                                                            <Typography variant="body2">
                                                                                {row.targetContent}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </>
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
                    disabled={loading || !selectedFromYear || Object.keys(previewData).length === 0}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 2,
                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                        '&:hover': {
                            boxShadow: 3,
                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
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
