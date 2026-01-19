//client/src/pages/School/EducationPlan/YearTarget/YearTarget.jsx
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    IconButton,
    Button,
    Tooltip,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';

import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { schoolYearTargetApi, academicYearApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import YearTargetDialog from './YearTargetDialog';
import YearTargetCopyDialog from './YearTargetCopyDialog';
import YearTargetCopySystemDialog from './YearTargetCopySystemDialog'; // ✅ Import new dialog
import ConfirmDialog from '~/components/common/ConfirmDialog';

const ALL_AGE_GROUPS = [
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function YearTarget() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [yearTargets, setYearTargets] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);
    const [tableRows, setTableRows] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [openCopyDialog, setOpenCopyDialog] = useState(false);
    const [dialogState, setDialogState] = useState({
        open: false,
        title: '',
        content: '',
        onConfirm: null,
    });
    const [allowedAgeGroups, setAllowedAgeGroups] = useState(ALL_AGE_GROUPS); // ✅ Danh sách tabs được phép hiển thị

    const currentAgeGroup = allowedAgeGroups[tabValue]?.value;
    const isActiveYear = selectedYear === activeYearId;

    // ✅ Check permissions
    const canCreate = hasPermission(PERMISSIONS.CREATE_YEAR_TARGET);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_YEAR_TARGET);
    const canDelete = hasPermission(PERMISSIONS.DELETE_YEAR_TARGET);
    const canView = hasPermission(PERMISSIONS.VIEW_YEAR_TARGET);

    const [openCopySystemDialog, setOpenCopySystemDialog] = useState(false); // ✅ Add new state

    // ✅ Fetch Academic Years
    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;
            setAcademicYears(years);

            const activeYear = years.find((y) => y.status === 'active');
            if (activeYear) {
                setActiveYearId(activeYear._id);
                setSelectedYear(activeYear._id);
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    // ✅ Fetch Year Targets
    const fetchYearTargets = async () => {
        if (!selectedYear) return;

        try {
            setLoading(true);
            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: selectedYear,
                ageGroup: '',
            });
            const data = res.data.data.targets;

            // ✅ Nếu chưa có dữ liệu và là năm học đang hoạt động, tự động khởi tạo
            if (data.length === 0 && isActiveYear && canCreate) {
                try {
                    await schoolYearTargetApi.initializeDefaults(selectedYear);
                    toast.success('Đã khởi tạo mục tiêu mặc định cho năm học!');
                    // Fetch lại sau khi khởi tạo
                    const res2 = await schoolYearTargetApi.getAll({
                        page: 1,
                        limit: 100,
                        academicYearId: selectedYear,
                        ageGroup: '',
                    });
                    const data2 = res2.data.data.targets;
                    const grouped = {};
                    data2.forEach((item) => {
                        grouped[item.ageGroup] = item;
                    });
                    setYearTargets(grouped);

                    // ✅ Cập nhật allowed age groups
                    updateAllowedAgeGroups(data2);
                } catch (initError) {
                    console.error('Error initializing defaults:', initError);
                    toast.error('Lỗi khi khởi tạo dữ liệu mặc định!');
                }
                return;
            }

            const grouped = {};
            data.forEach((item) => {
                grouped[item.ageGroup] = item;
            });

            setYearTargets(grouped);

            // ✅ Cập nhật danh sách tabs được phép hiển thị
            updateAllowedAgeGroups(data);
        } catch (error) {
            console.error('Error fetching year targets:', error);
            if (error.response?.status === 403) {
                toast.error('Bạn không có quyền xem mục tiêu này!');
            } else {
                toast.error('Lỗi khi tải dữ liệu mục tiêu năm học!');
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ Cập nhật danh sách age groups được phép hiển thị dựa trên dữ liệu trả về
    const updateAllowedAgeGroups = (targets) => {
        if (!targets || targets.length === 0) {
            setAllowedAgeGroups([]);
            return;
        }

        // Lấy danh sách ageGroup từ targets đã fetch được
        const fetchedAgeGroups = targets.map((t) => t.ageGroup);

        // Lọc ALL_AGE_GROUPS theo thứ tự ban đầu
        const filtered = ALL_AGE_GROUPS.filter((group) => fetchedAgeGroups.includes(group.value));

        console.log('✅ Allowed age groups:', filtered);
        setAllowedAgeGroups(filtered);

        // ✅ Reset tab về 0 nếu tab hiện tại không hợp lệ
        if (tabValue >= filtered.length) {
            setTabValue(0);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchYearTargets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Convert data to table rows
    useEffect(() => {
        if (!currentAgeGroup) {
            setTableRows([]);
            return;
        }

        const currentData = yearTargets[currentAgeGroup];
        if (!currentData || !currentData.mainFields) {
            setTableRows([]);
            return;
        }

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
                                _mainFieldCode: mainField.code,
                                _subFieldCode: subField.code,
                                _expectedResultCode: expectedResult.code,
                                _targetIndex: targetIdx,
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
                                _mainFieldCode: mainField.code,
                                _subFieldCode: subField.code,
                                _expectedResultCode: expectedResult.code,
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
                            _mainFieldCode: mainField.code,
                            _subFieldCode: null,
                            _expectedResultCode: expectedResult.code,
                            _targetIndex: targetIdx,
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
                            _mainFieldCode: mainField.code,
                            _subFieldCode: null,
                            _expectedResultCode: expectedResult.code,
                            isFirstInExpectedResult: true,
                            expectedResultRowSpan: 1,
                        });
                    }
                });
            }
        });

        setTableRows(rows);
    }, [yearTargets, currentAgeGroup]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleAddTarget = (row) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể thêm mục tiêu cho năm học đang hoạt động!');
            return;
        }

        const currentData = yearTargets[currentAgeGroup];
        setDialogData({
            ageGroup: currentAgeGroup,
            mainFieldCode: row._mainFieldCode,
            subFieldCode: row._subFieldCode,
            expectedResultCode: row._expectedResultCode,
            yearTargetId: currentData?._id || null,
        });
        setOpenDialog(true);
    };

    const handleEditTarget = (row) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể chỉnh sửa mục tiêu trong năm học đang hoạt động!');
            return;
        }

        const currentData = yearTargets[currentAgeGroup];
        setDialogData({
            ageGroup: currentAgeGroup,
            mainFieldCode: row._mainFieldCode,
            subFieldCode: row._subFieldCode,
            expectedResultCode: row._expectedResultCode,
            targetIndex: row._targetIndex,
            yearTargetId: currentData?._id || null,
            mode: 'edit',
        });
        setOpenDialog(true);
    };

    const renumberAllTargets = (mainFields) => {
        let globalMtNumber = 1;

        mainFields.forEach((mainField) => {
            if (mainField.subFields && mainField.subFields.length > 0) {
                mainField.subFields.forEach((subField) => {
                    subField.expectedResults?.forEach((expectedResult) => {
                        if (expectedResult.targets) {
                            expectedResult.targets.forEach((target) => {
                                target.code = `MT${globalMtNumber++}`;
                            });
                        }
                    });
                });
            } else {
                mainField.expectedResults?.forEach((expectedResult) => {
                    if (expectedResult.targets) {
                        expectedResult.targets.forEach((target) => {
                            target.code = `MT${globalMtNumber++}`;
                        });
                    }
                });
            }
        });

        return mainFields;
    };

    const handleDeleteTarget = (row) => {
        setDialogState({
            open: true,
            title: 'Xác nhận xóa mục tiêu',
            content: `Bạn có chắc chắn muốn xóa mục tiêu "${row.targetCode}"?`,
            severity: 'error', // ✅ Thêm severity
            confirmText: 'Xóa', // ✅ Thêm confirmText
            onConfirm: () => confirmDelete(row),
        });
    };

    const confirmDelete = async (row) => {
        try {
            const currentData = yearTargets[currentAgeGroup];
            if (!currentData) return;

            const updatedMainFields = JSON.parse(JSON.stringify(currentData.mainFields));
            const mainField = updatedMainFields.find((mf) => mf.code === row._mainFieldCode);
            if (!mainField) return;

            if (row._subFieldCode) {
                const subField = mainField.subFields?.find((sf) => sf.code === row._subFieldCode);
                const expectedResult = subField?.expectedResults?.find((er) => er.code === row._expectedResultCode);
                if (expectedResult?.targets) {
                    expectedResult.targets.splice(row._targetIndex, 1);
                }
            } else {
                const expectedResult = mainField.expectedResults?.find((er) => er.code === row._expectedResultCode);
                if (expectedResult?.targets) {
                    expectedResult.targets.splice(row._targetIndex, 1);
                }
            }

            const renumberedMainFields = renumberAllTargets(updatedMainFields);

            await schoolYearTargetApi.update(currentData._id, { mainFields: renumberedMainFields });
            toast.success('Xóa mục tiêu thành công!');

            // ✅ Đóng dialog sau khi xóa thành công
            handleCancel();

            // Refresh data
            fetchYearTargets();
        } catch (error) {
            console.error('Error deleting target:', error);
            toast.error('Lỗi khi xóa mục tiêu!');

            // ✅ Đóng dialog ngay cả khi có lỗi
            handleCancel();
        }
    };

    const handleCancel = () => {
        setDialogState({
            open: false,
            title: '',
            content: '',
            severity: 'warning',
            confirmText: 'Xác nhận',
            onConfirm: null,
        });
    };

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Kế hoạch giáo dục', icon: HistoryEduOutlinedIcon, href: '#' },
                        { text: 'Mục tiêu năm học theo từng độ tuổi' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Mục tiêu năm học theo từng độ tuổi
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {/* Select năm học */}
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    label="Năm học"
                                >
                                    {academicYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: year.status === 'active' ? 600 : 400,
                                                        color:
                                                            year.status === 'active' ? 'success.main' : 'text.primary',
                                                    }}
                                                >
                                                    {year.fromYear}-{year.toYear}
                                                </Typography>
                                                {year.status === 'active' && (
                                                    <DoneOutlinedIcon color="success" fontSize="small" />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Nút Copy từ năm học cũ */}
                            {canCreate && isActiveYear && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={() => setOpenCopyDialog(true)}
                                    sx={{
                                        borderColor: '#764ba2',
                                        color: '#764ba2',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: 1,
                                        px: 1,
                                        py: 1,
                                        '&:hover': {
                                            borderColor: '#5a3680',
                                            bgcolor: 'rgba(118, 75, 162, 0.04)',
                                        },
                                    }}
                                >
                                    Copy từ năm học cũ
                                </Button>
                            )}

                            {/* ✅ Nút Copy từ hệ thống */}
                            {canCreate && isActiveYear && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={() => setOpenCopySystemDialog(true)}
                                    sx={{
                                        borderColor: '#667eea',
                                        color: '#667eea',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: 1,
                                        px: 1,
                                        py: 1,
                                        '&:hover': {
                                            borderColor: '#4d5bc9',
                                            bgcolor: 'rgba(102, 126, 234, 0.04)',
                                        },
                                    }}
                                >
                                    Copy từ hệ thống
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {/* Thông báo năm học */}
                    {selectedYear && (
                        <Box
                            sx={{
                                mb: 2,
                                p: 1.5,
                                bgcolor: isActiveYear ? '#e8f5e9' : '#fff3e0',
                                borderRadius: 1,
                                border: `1px solid ${isActiveYear ? '#4caf50' : '#ff9800'}`,
                            }}
                        >
                            <Typography variant="body2" color={isActiveYear ? 'success.main' : 'warning.main'}>
                                {isActiveYear ? (
                                    <strong>Năm học đang hoạt động</strong>
                                ) : (
                                    <strong>Năm học đã kết thúc</strong>
                                )}
                            </Typography>
                        </Box>
                    )}

                    {/* Tabs - Chỉ hiển thị các nhóm tuổi được phép */}
                    {allowedAgeGroups.length > 0 && (
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
                                        fontSize: '0.95rem',
                                    },
                                    '& .Mui-selected': {
                                        color: '#0071bc',
                                        fontWeight: 600,
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#0071bc',
                                        height: 3,
                                    },
                                }}
                            >
                                {allowedAgeGroups.map((group, index) => (
                                    <Tab key={index} label={group.label} />
                                ))}
                            </Tabs>
                        </Box>
                    )}

                    {/* Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : !canView ? (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            Bạn không có quyền xem mục tiêu của nhóm tuổi này!
                        </Alert>
                    ) : allowedAgeGroups.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Bạn chưa được phân công quản lý hoặc giảng dạy khối nào trong năm học này.
                            </Alert>
                        </Box>
                    ) : tableRows.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                Chưa có dữ liệu mục tiêu cho nhóm tuổi này
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                overflowX: 'auto',
                                '&::-webkit-scrollbar': { height: 8 },
                                '&::-webkit-scrollbar-thumb': { backgroundColor: '#90caf9', borderRadius: 4 },
                            }}
                        >
                            <Table sx={{ tableLayout: 'fixed', minWidth: 1000 }}>
                                <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: 200 }}>Lĩnh vực phát triển</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 200 }}>Kết quả mong đợi</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 350 }}>Mục tiêu</TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                width: 70,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Thao tác
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
                                                        sx={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0' }}
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
                                                )}

                                                {/* Kết quả mong đợi (Merged) + Icon thêm */}
                                                {row.isFirstInExpectedResult && (
                                                    <TableCell
                                                        rowSpan={row.expectedResultRowSpan}
                                                        sx={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0' }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'flex-start',
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <Typography variant="body2">
                                                                <strong>{row.expectedResultCode}.</strong>{' '}
                                                                {row.expectedResultDescription}
                                                            </Typography>
                                                            {canCreate && isActiveYear && (
                                                                <Tooltip title="Thêm mục tiêu">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="success"
                                                                        onClick={() => handleAddTarget(row)}
                                                                    >
                                                                        <AddCircleOutlineIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                )}

                                                {/* Mục tiêu */}
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                                                    {row.isEmpty ? (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ fontStyle: 'italic' }}
                                                        >
                                                            Chưa có mục tiêu
                                                        </Typography>
                                                    ) : (
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
                                                    )}
                                                </TableCell>

                                                {/* Thao tác */}
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {!row.isEmpty && isActiveYear && (
                                                        <Box
                                                            sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}
                                                        >
                                                            {canUpdate && (
                                                                <Tooltip title="Sửa">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleEditTarget(row)}
                                                                    >
                                                                        <EditOutlinedIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {canDelete && (
                                                                <Tooltip title="Xóa">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteTarget(row)}
                                                                    >
                                                                        <DeleteOutlineOutlinedIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
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
                </Paper>
            </PageContainer>

            {/* Dialog thêm/sửa mục tiêu */}
            <YearTargetDialog
                open={openDialog}
                data={dialogData}
                onClose={() => {
                    setOpenDialog(false);
                    setDialogData(null);
                }}
                onSuccess={(updatedMainFields) => {
                    setOpenDialog(false);
                    setDialogData(null);

                    // Cập nhật State cục bộ (Local State) thay vì gọi API fetchYearTargets()
                    setYearTargets((prev) => ({
                        ...prev,
                        [currentAgeGroup]: {
                            ...prev[currentAgeGroup],
                            mainFields: updatedMainFields, // Gán danh sách mới đã update từ Dialog
                        },
                    }));
                }}
            />

            {/* Dialog copy từ năm học cũ */}
            <YearTargetCopyDialog
                open={openCopyDialog}
                currentYearId={activeYearId}
                onClose={() => setOpenCopyDialog(false)}
                onSuccess={() => {
                    setOpenCopyDialog(false);
                    fetchYearTargets();
                }}
            />

            {/* ✅ Dialog copy từ hệ thống */}
            <YearTargetCopySystemDialog
                open={openCopySystemDialog}
                currentYearId={activeYearId}
                onClose={() => setOpenCopySystemDialog(false)}
                onSuccess={() => {
                    setOpenCopySystemDialog(false);
                    fetchYearTargets();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default YearTarget;
