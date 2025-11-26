// client/src/pages/School/EducationPlan/EducationalActivity/EducationalActivity.jsx

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
import { schoolYearTargetApi, schoolEducationalActivityApi, academicYearApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import EducationalActivityDialog from './EducationalActivityDialog';
import EducationalActivityCopyDialog from './EducationalActivityCopyDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';

const ALL_AGE_GROUPS = [
    { value: 'Nhà trẻ 3-12 tháng', label: 'Nhà trẻ 3-12 tháng' },
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function EducationalActivity() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [yearTargets, setYearTargets] = useState({});
    const [activities, setActivities] = useState({});
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
        severity: 'warning',
        confirmText: 'Xác nhận',
        onConfirm: null,
    });

    const [allowedAgeGroups, setAllowedAgeGroups] = useState(ALL_AGE_GROUPS);
    const currentAgeGroup = allowedAgeGroups[tabValue]?.value;
    const isActiveYear = selectedYear === activeYearId;

    const canCreate = hasPermission(PERMISSIONS.CREATE_EDUCATION_ACTIVITY);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_EDUCATION_ACTIVITY);
    const canDelete = hasPermission(PERMISSIONS.DELETE_EDUCATION_ACTIVITY);
    const canView = hasPermission(PERMISSIONS.VIEW_EDUCATION_ACTIVITY);

    // ✅ Kiểm tra quyền copy: Ban giám hiệu HOẶC Tổ trưởng
    const canCopy = user?.role === 'ban_giam_hieu' || user?.role === 'to_truong';

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

    // ✅ Fetch Year Targets & Activities
    const fetchData = async () => {
        if (!selectedYear) return;

        try {
            setLoading(true);

            // 1. Fetch School Year Targets
            const yearTargetsRes = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: selectedYear,
                ageGroup: '',
            });
            const yearTargetsData = yearTargetsRes.data.data.targets;

            const groupedYearTargets = {};
            yearTargetsData.forEach((item) => {
                groupedYearTargets[item.ageGroup] = item;
            });
            setYearTargets(groupedYearTargets);

            // ✅ Update allowed age groups
            const fetchedAgeGroups = yearTargetsData.map((t) => t.ageGroup);
            const filtered = ALL_AGE_GROUPS.filter((group) => fetchedAgeGroups.includes(group.value));
            setAllowedAgeGroups(filtered);

            if (filtered.length > 0 && tabValue >= filtered.length) {
                setTabValue(0);
            }

            // 2. Fetch School Educational Activities
            const activitiesRes = await schoolEducationalActivityApi.getAll({
                page: 1,
                limit: 1000,
                academicYearId: selectedYear,
                ageGroup: '',
            });
            const activitiesData = activitiesRes.data.data.activities;

            // Group activities by ageGroup + targetId
            const groupedActivities = {};
            activitiesData.forEach((activity) => {
                const key = `${activity.ageGroup}-${activity.targetId}`;
                groupedActivities[key] = activity;
            });
            setActivities(groupedActivities);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Lỗi khi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Convert data to table rows
    useEffect(() => {
        const currentData = yearTargets[currentAgeGroup];
        if (!currentData || !currentData.mainFields) {
            setTableRows([]);
            return;
        }

        const rows = [];

        currentData.mainFields.forEach((mainField) => {
            if (mainField.subFields && mainField.subFields.length > 0) {
                mainField.subFields.forEach((subField) => {
                    subField.expectedResults?.forEach((expectedResult) => {
                        const targets = expectedResult.targets || [];
                        const targetCount = Math.max(targets.length, 1);

                        targets.forEach((target, targetIdx) => {
                            const activityKey = `${currentAgeGroup}-${target._id}`;
                            const activity = activities[activityKey];

                            rows.push({
                                id: `${mainField.code}-${subField.code}-${expectedResult.code}-${target._id}`,
                                mainFieldCode: mainField.code,
                                mainFieldName: mainField.name,
                                subFieldCode: subField.code,
                                subFieldName: subField.name,
                                expectedResultCode: expectedResult.code,
                                expectedResultDescription: expectedResult.description,
                                targetCode: target.code, // Display code
                                targetId: target._id, // ✅ Real identifier
                                targetContent: target.content,
                                activityContent: activity?.activityContent || null,
                                activityId: activity?._id || null,
                                _mainFieldCode: mainField.code,
                                _subFieldCode: subField.code,
                                _expectedResultCode: expectedResult.code,
                                _targetId: target._id, // ✅ Pass targetId
                                _schoolYearTargetId: currentData._id,
                                isFirstInExpectedResult: targetIdx === 0,
                                expectedResultRowSpan: targetCount,
                            });
                        });
                    });
                });
            } else {
                mainField.expectedResults?.forEach((expectedResult) => {
                    const targets = expectedResult.targets || [];
                    const targetCount = Math.max(targets.length, 1);

                    targets.forEach((target, targetIdx) => {
                        const activityKey = `${currentAgeGroup}-${target._id}`; // ✅ Use targetId
                        const activity = activities[activityKey];

                        rows.push({
                            id: `${mainField.code}-${expectedResult.code}-${target._id}`,
                            mainFieldCode: mainField.code,
                            mainFieldName: mainField.name,
                            subFieldCode: null,
                            subFieldName: null,
                            expectedResultCode: expectedResult.code,
                            expectedResultDescription: expectedResult.description,
                            targetCode: target.code,
                            targetId: target._id, // ✅ Real identifier
                            targetContent: target.content,
                            activityContent: activity?.activityContent || null,
                            activityId: activity?._id || null,
                            _mainFieldCode: mainField.code,
                            _subFieldCode: null,
                            _expectedResultCode: expectedResult.code,
                            _targetId: target._id, // ✅ Pass targetId
                            _schoolYearTargetId: currentData._id,
                            isFirstInExpectedResult: targetIdx === 0,
                            expectedResultRowSpan: targetCount,
                        });
                    });
                });
            }
        });

        setTableRows(rows);
    }, [yearTargets, activities, currentAgeGroup]);

    // ✅ Fetch activities và map theo targetId
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedYear) return;

            try {
                setLoading(true);

                // 1. Fetch School Year Targets
                const yearTargetsRes = await schoolYearTargetApi.getAll({
                    page: 1,
                    limit: 100,
                    academicYearId: selectedYear,
                    ageGroup: '',
                });
                const yearTargetsData = yearTargetsRes.data.data.targets;

                const groupedYearTargets = {};
                yearTargetsData.forEach((item) => {
                    groupedYearTargets[item.ageGroup] = item;
                });
                setYearTargets(groupedYearTargets);

                // 2. Fetch School Educational Activities
                const activitiesRes = await schoolEducationalActivityApi.getAll({
                    page: 1,
                    limit: 1000,
                    academicYearId: selectedYear,
                    ageGroup: '',
                });
                const activitiesData = activitiesRes.data.data.activities;

                // ✅ Group activities by ageGroup + targetId (instead of targetCode)
                const groupedActivities = {};
                activitiesData.forEach((activity) => {
                    const key = `${activity.ageGroup}-${activity.targetId}`; // ✅ Use targetId
                    groupedActivities[key] = activity;
                });
                setActivities(groupedActivities);

                console.log('✅ Activities grouped by targetId:', Object.keys(groupedActivities).length);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Lỗi khi tải dữ liệu!');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedYear]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleAddActivity = (row) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể thêm hoạt động cho năm học đang hoạt động!');
            return;
        }

        setDialogData({
            mode: 'create',
            ageGroup: currentAgeGroup,
            mainFieldCode: row._mainFieldCode,
            subFieldCode: row._subFieldCode,
            expectedResultCode: row._expectedResultCode,
            targetId: row._targetId, // ✅ Pass targetId instead of targetCode
            targetCode: row.targetCode,
            schoolYearTargetId: row._schoolYearTargetId,
            academicYearId: selectedYear,
        });
        setOpenDialog(true);
    };

    const handleEditActivity = (row) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể chỉnh sửa hoạt động trong năm học đang hoạt động!');
            return;
        }

        setDialogData({
            mode: 'edit',
            activityId: row.activityId,
            ageGroup: currentAgeGroup,
            mainFieldCode: row._mainFieldCode,
            subFieldCode: row._subFieldCode,
            expectedResultCode: row._expectedResultCode,
            targetId: row._targetId, // ✅ Pass targetId
            targetCode: row.targetCode,
            schoolYearTargetId: row._schoolYearTargetId,
            academicYearId: selectedYear,
        });
        setOpenDialog(true);
    };

    const handleDeleteActivity = (row) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể xóa hoạt động trong năm học đang hoạt động!');
            return;
        }

        setDialogState({
            open: true,
            title: 'Xác nhận xóa hoạt động',
            content: `Bạn có chắc chắn muốn xóa hoạt động giáo dục cho mục tiêu "${row.targetCode}"?`,
            severity: 'error',
            confirmText: 'Xóa',
            onConfirm: () => confirmDelete(row),
        });
    };

    const confirmDelete = async (row) => {
        try {
            await schoolEducationalActivityApi.delete(row.activityId);
            toast.success('Xóa hoạt động giáo dục thành công!');
            handleCancel();
            fetchData();
        } catch (error) {
            console.error('Error deleting activity:', error);
            toast.error('Lỗi khi xóa hoạt động giáo dục!');
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
                        { text: 'Hoạt động giáo dục theo từng mục tiêu' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Hoạt động giáo dục theo từng mục tiêu
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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

                            {/* ✅ Nút Copy từ năm học cũ - Cho cả Ban giám hiệu và Tổ trưởng */}
                            {canCopy && isActiveYear && (
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
                                        borderRadius: 1.5,
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

                    {/* Tabs */}
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
                            Bạn không có quyền xem hoạt động giáo dục của nhóm tuổi này!
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
                                        <TableCell sx={{ fontWeight: 700, width: 200 }}>Mục tiêu</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 350 }}>Hoạt động giáo dục</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 70, whiteSpace: 'nowrap' }}>
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

                                                {/* Kết quả mong đợi (Merged) */}
                                                {row.isFirstInExpectedResult && (
                                                    <TableCell
                                                        rowSpan={row.expectedResultRowSpan}
                                                        sx={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0' }}
                                                    >
                                                        <Typography variant="body2">
                                                            <strong>{row.expectedResultCode}.</strong>{' '}
                                                            {row.expectedResultDescription}
                                                        </Typography>
                                                    </TableCell>
                                                )}

                                                {/* Mục tiêu */}
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
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
                                                <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
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
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ fontStyle: 'italic' }}
                                                            >
                                                                Chưa có hoạt động
                                                            </Typography>
                                                            {canCreate && isActiveYear && (
                                                                <Tooltip title="Thêm hoạt động">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="success"
                                                                        onClick={() => handleAddActivity(row)}
                                                                    >
                                                                        <AddCircleOutlineIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    )}
                                                </TableCell>

                                                {/* Thao tác */}
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {row.activityContent && (
                                                        <Box
                                                            sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}
                                                        >
                                                            {canUpdate && isActiveYear && (
                                                                <Tooltip title="Sửa">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleEditActivity(row)}
                                                                    >
                                                                        <EditOutlinedIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {canDelete && isActiveYear && (
                                                                <Tooltip title="Xóa">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteActivity(row)}
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

            {/* Dialog thêm/sửa hoạt động */}
            <EducationalActivityDialog
                open={openDialog}
                data={dialogData}
                onClose={() => {
                    setOpenDialog(false);
                    setDialogData(null);
                }}
                onSuccess={() => {
                    setOpenDialog(false);
                    setDialogData(null);
                    fetchData();
                }}
            />

            {/* Dialog copy từ năm học cũ */}
            <EducationalActivityCopyDialog
                open={openCopyDialog}
                currentYearId={activeYearId}
                onClose={() => setOpenCopyDialog(false)}
                onSuccess={() => {
                    setOpenCopyDialog(false);
                    fetchData();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={dialogState.open}
                title={dialogState.title}
                message={dialogState.content}
                severity={dialogState.severity}
                confirmText={dialogState.confirmText}
                onConfirm={dialogState.onConfirm}
                onCancel={handleCancel}
            />
        </MainLayout>
    );
}

export default EducationalActivity;
