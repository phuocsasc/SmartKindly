import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
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
    Chip,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { schoolYearTargetApi } from '~/apis';
import { toast } from 'react-toastify';

const ALL_AGE_GROUPS = [
    { value: 'Nhà trẻ 3-12 tháng', label: 'Nhà trẻ 3-12 tháng' },
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function YearTargetCopySystemDialog({ open, currentYearId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [fetchingPreview, setFetchingPreview] = useState(false);
    const [previewData, setPreviewData] = useState({});
    const [tabValue, setTabValue] = useState(0);
    const [allowedAgeGroups, setAllowedAgeGroups] = useState([]);

    // ✅ Fetch preview từ hệ thống khi mở dialog
    useEffect(() => {
        if (open) {
            fetchSystemPreview();
        }
    }, [open]);

    const fetchSystemPreview = async () => {
        try {
            setFetchingPreview(true);
            console.log('🔍 [YearTargetCopySystemDialog] Fetching system targets...');

            // ✅ Gọi API mới từ schoolYearTargetApi
            const res = await schoolYearTargetApi.getSystemPreview();
            const targets = res.data.data.targets;

            console.log('🎯 System targets found:', targets.length);

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
            console.error('❌ Error fetching system preview:', error);
            toast.error('Lỗi khi tải thông tin xem trước từ hệ thống!');
        } finally {
            setFetchingPreview(false);
        }
    };

    const handleCopy = async () => {
        if (Object.keys(previewData).length === 0) {
            toast.error('Hệ thống chưa có dữ liệu mục tiêu mẫu!');
            return;
        }

        try {
            setLoading(true);

            await schoolYearTargetApi.copyFromSystem(currentYearId);

            toast.success('Copy mục tiêu từ hệ thống thành công!');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error copying from system:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi copy mục tiêu từ hệ thống!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
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
                        <CloudDownloadIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Copy mục tiêu từ hệ thống
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
                            Chức năng này sẽ <strong>copy toàn bộ mục tiêu mẫu</strong> từ hệ thống (Ngân hàng dữ liệu)
                            sang năm học đang hoạt động của trường.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            ⚠️ <strong>Lưu ý:</strong> Dữ liệu hiện tại của năm học đang hoạt động sẽ bị{' '}
                            <strong>ghi đè hoàn toàn</strong>.
                        </Typography>
                    </Alert>

                    {/* Preview data với Tabs */}
                    {fetchingPreview ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
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
                                Mục tiêu mẫu từ hệ thống ({allowedAgeGroups.length} nhóm tuổi)
                            </Typography>

                            {allowedAgeGroups.length === 0 ? (
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    Hệ thống chưa có dữ liệu mục tiêu mẫu nào!
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
                                                    color: '#667eea',
                                                    fontWeight: 600,
                                                },
                                                '& .MuiTabs-indicator': {
                                                    backgroundColor: '#667eea',
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
                                                    backgroundColor: '#667eea',
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
                                                                bgcolor: '#ede7f6',
                                                                width: '30%',
                                                            }}
                                                        >
                                                            Lĩnh vực phát triển
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 700,
                                                                bgcolor: '#ede7f6',
                                                                width: '30%',
                                                            }}
                                                        >
                                                            Kết quả mong đợi
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 700,
                                                                bgcolor: '#ede7f6',
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
                                                                                    bgcolor: '#ede7f6',
                                                                                    color: '#667eea',
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
                    disabled={loading || fetchingPreview || Object.keys(previewData).length === 0}
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

export default YearTargetCopySystemDialog;
