// client/src/pages/School/EducationPlan/EducationalActivity/EducationalActivityCopyDialog.jsx

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
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { schoolEducationalActivityApi, academicYearApi, schoolYearTargetApi } from '~/apis';
import { toast } from 'react-toastify';
import { useUser } from '~/contexts/UserContext';

const ALL_AGE_GROUPS = [
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function EducationalActivityCopyDialog({ open, currentYearId, onClose, onSuccess }) {
    const { user } = useUser(); // ✅ Get user info
    const [selectedFromYear, setSelectedFromYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingPreview, setFetchingPreview] = useState(false);
    const [previewData, setPreviewData] = useState({});
    const [yearTargets, setYearTargets] = useState({});
    const [tabValue, setTabValue] = useState(0);
    const [allowedAgeGroups, setAllowedAgeGroups] = useState([]);

    // ✅ Fetch các năm học inactive (đã qua)
    useEffect(() => {
        if (open && currentYearId) {
            fetchAvailableYears();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, currentYearId]);

    // ✅ Fetch preview khi chọn năm
    useEffect(() => {
        if (selectedFromYear) {
            fetchPreviewData();
        } else {
            setPreviewData({});
            setYearTargets({});
            setAllowedAgeGroups([]);
            setTabValue(0);
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
            console.log('🔍 [EducationalActivityCopyDialog] Fetching preview for year:', selectedFromYear);

            // 1. Fetch School Year Targets của năm nguồn
            const yearTargetsRes = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: selectedFromYear,
                ageGroup: '',
            });
            const yearTargetsData = yearTargetsRes.data.data.targets;

            const groupedYearTargets = {};
            yearTargetsData.forEach((item) => {
                groupedYearTargets[item.ageGroup] = item;
            });
            setYearTargets(groupedYearTargets);

            // 2. Fetch School Educational Activities của năm nguồn
            const activitiesRes = await schoolEducationalActivityApi.getAll({
                page: 1,
                limit: 1000,
                academicYearId: selectedFromYear,
                ageGroup: '',
            });
            const activitiesData = activitiesRes.data.data.activities;

            console.log(`📋 Found ${activitiesData.length} activities in source year`);

            if (activitiesData.length === 0) {
                setPreviewData({});
                setAllowedAgeGroups([]);
                toast.warning('Năm học nguồn không có hoạt động giáo dục nào!');
                return;
            }

            // Group activities by ageGroup
            const grouped = {};
            activitiesData.forEach((activity) => {
                if (!grouped[activity.ageGroup]) {
                    grouped[activity.ageGroup] = [];
                }
                grouped[activity.ageGroup].push(activity);
            });

            setPreviewData(grouped);

            // ✅ Update allowed age groups
            const fetchedAgeGroups = Object.keys(grouped);
            const filtered = ALL_AGE_GROUPS.filter((group) => fetchedAgeGroups.includes(group.value));
            setAllowedAgeGroups(filtered);

            if (filtered.length > 0) {
                setTabValue(0);
            }
        } catch (error) {
            console.error('❌ Error fetching preview:', error);
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

        if (Object.keys(previewData).length === 0) {
            toast.error('Năm học nguồn không có hoạt động giáo dục để copy!');
            return;
        }

        try {
            setLoading(true);

            const res = await schoolEducationalActivityApi.copyFromYear({
                fromAcademicYearId: selectedFromYear,
                toAcademicYearId: currentYearId,
            });

            // ✅ Hiển thị message từ server (có thông tin cho Tổ trưởng)
            const message = res.data.data.message || 'Copy hoạt động giáo dục từ năm học cũ thành công!';
            toast.success(message);

            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error copying activities:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi copy hoạt động giáo dục!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedFromYear('');
        setPreviewData({});
        setYearTargets({});
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

        const currentActivities = previewData[currentAgeGroup] || [];
        const currentYearTarget = yearTargets[currentAgeGroup];

        if (!currentYearTarget || !currentYearTarget.mainFields) return [];

        const rows = [];

        currentYearTarget.mainFields.forEach((mainField) => {
            if (mainField.subFields && mainField.subFields.length > 0) {
                mainField.subFields.forEach((subField) => {
                    subField.expectedResults?.forEach((expectedResult) => {
                        expectedResult.targets?.forEach((target) => {
                            // Tìm hoạt động tương ứng với target
                            const activity = currentActivities.find((act) => act.targetCode === target.code);

                            rows.push({
                                id: `${mainField.code}-${subField.code}-${expectedResult.code}-${target.code}`,
                                mainFieldCode: mainField.code,
                                mainFieldName: mainField.name,
                                subFieldCode: subField.code,
                                subFieldName: subField.name,
                                expectedResultCode: expectedResult.code,
                                expectedResultDescription: expectedResult.description,
                                targetCode: target.code,
                                targetContent: target.content,
                                activityContent: activity?.activityContent || null,
                            });
                        });
                    });
                });
            } else {
                mainField.expectedResults?.forEach((expectedResult) => {
                    expectedResult.targets?.forEach((target) => {
                        const activity = currentActivities.find((act) => act.targetCode === target.code);

                        rows.push({
                            id: `${mainField.code}-${expectedResult.code}-${target.code}`,
                            mainFieldCode: mainField.code,
                            mainFieldName: mainField.name,
                            subFieldCode: null,
                            subFieldName: null,
                            expectedResultCode: expectedResult.code,
                            expectedResultDescription: expectedResult.description,
                            targetCode: target.code,
                            targetContent: target.content,
                            activityContent: activity?.activityContent || null,
                        });
                    });
                });
            }
        });

        return rows;
    };

    const tableRows = getTableRows();

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
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
                        Copy hoạt động giáo dục từ năm học cũ
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
                            Chọn năm học nguồn để copy <strong>hoạt động giáo dục</strong> sang năm học đang hoạt động.
                        </Typography>
                        {/* ✅ Thông báo khác cho Tổ trưởng */}
                        {user?.role === 'to_truong' ? (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                ⚠️ <strong>Lưu ý:</strong> Bạn chỉ có thể copy hoạt động cho{' '}
                                <strong>các nhóm tuổi mà bạn được phân công quản lý</strong>.
                            </Typography>
                        ) : (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Lưu ý:</strong> Dữ liệu hiện tại của năm học đang hoạt động sẽ bị{' '}
                                <strong>ghi đè hoàn toàn</strong>.
                            </Typography>
                        )}
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

                    {/* Preview data với Tabs */}
                    {fetchingPreview ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedFromYear && Object.keys(previewData).length > 0 ? (
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
                                Xem trước hoạt động giáo dục ({allowedAgeGroups.length} nhóm tuổi)
                            </Typography>

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
                                        Chưa có dữ liệu hoạt động giáo dục cho nhóm tuổi này
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        maxHeight: 450,
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
                                                        width: '20%',
                                                    }}
                                                >
                                                    Lĩnh vực phát triển
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: '#ede7f6',
                                                        width: '20%',
                                                    }}
                                                >
                                                    Kết quả mong đợi
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: '#ede7f6',
                                                        width: '25%',
                                                    }}
                                                >
                                                    Mục tiêu
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: '#ede7f6',
                                                        width: '35%',
                                                    }}
                                                >
                                                    Hoạt động giáo dục
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {tableRows.map((row) => (
                                                <TableRow key={row.id} hover>
                                                    {/* Lĩnh vực phát triển */}
                                                    <TableCell
                                                        sx={{
                                                            verticalAlign: 'top',
                                                            borderRight: '1px solid #e0e0e0',
                                                        }}
                                                    >
                                                        <Typography variant="body2" fontWeight={600} color="primary">
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

                                                    {/* Kết quả mong đợi */}
                                                    <TableCell
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

                                                    {/* Mục tiêu */}
                                                    <TableCell
                                                        sx={{
                                                            verticalAlign: 'top',
                                                            borderRight: '1px solid #e0e0e0',
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip
                                                                label={row.targetCode}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: '#e3f2fd',
                                                                    color: '#1976d2',
                                                                    fontWeight: 600,
                                                                }}
                                                            />
                                                            <Typography variant="body2">{row.targetContent}</Typography>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Hoạt động giáo dục */}
                                                    <TableCell sx={{ verticalAlign: 'top' }}>
                                                        {row.activityContent ? (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    wordBreak: 'break-word',
                                                                }}
                                                            >
                                                                {row.activityContent}
                                                            </Typography>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ fontStyle: 'italic' }}
                                                            >
                                                                Chưa có hoạt động
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    ) : (
                        selectedFromYear && (
                            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                Năm học nguồn không có hoạt động giáo dục nào!
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
                    disabled={loading || fetchingPreview || !selectedFromYear || Object.keys(previewData).length === 0}
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

export default EducationalActivityCopyDialog;
