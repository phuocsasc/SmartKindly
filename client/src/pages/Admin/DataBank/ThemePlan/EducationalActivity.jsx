// client/src/pages/Admin/DataBank/ThemePlan/AdminThemePlan.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';

import MainLayout from '~/layouts/AdminLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { yearTargetApi } from '~/apis/yearTargetApi';
import { educationalActivityApi } from '~/apis/educationalActivityApi';
import { toast } from 'react-toastify';
import EducationalActivityDialog from './EducationalActivityDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';

const AGE_GROUPS = [
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function EducationalActivity() {
    const { user } = useUser();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [yearTargets, setYearTargets] = useState({});
    const [activities, setActivities] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);
    const [tableRows, setTableRows] = useState([]);
    const [dialogState, setDialogState] = useState({
        open: false,
        title: '',
        content: '',
        severity: 'warning',
        confirmText: 'Xác nhận',
        onConfirm: null,
    });

    const currentAgeGroup = AGE_GROUPS[tabValue].value;

    // ✅ Fetch Year Targets & Activities
    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Year Targets
            const yearTargetsRes = await yearTargetApi.getAll({ page: 1, limit: 100, ageGroup: '' });
            const yearTargetsData = yearTargetsRes.data.data.yearTargets;

            const groupedYearTargets = {};
            yearTargetsData.forEach((item) => {
                groupedYearTargets[item.ageGroup] = item;
            });
            setYearTargets(groupedYearTargets);

            // 2. Fetch Educational Activities
            const activitiesRes = await educationalActivityApi.getAll({ page: 1, limit: 1000, ageGroup: '' });
            const activitiesData = activitiesRes.data.data.activities;

            // Group activities by ageGroup + targetCode
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
        fetchData();
    }, []);

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
                            // ✅ Tìm hoạt động giáo dục tương ứng
                            const activityKey = `${currentAgeGroup}-${target._id}`;
                            const activity = activities[activityKey];

                            rows.push({
                                id: `${mainField.code}-${subField.code}-${expectedResult.code}-${target.code}`,
                                mainFieldCode: mainField.code,
                                mainFieldName: mainField.name,
                                subFieldCode: subField.code,
                                subFieldName: subField.name,
                                expectedResultCode: expectedResult.code,
                                expectedResultDescription: expectedResult.description,
                                targetCode: target.code,
                                targetId: target._id, // ✅ Real identifier
                                targetContent: target.content,
                                activityContent: activity?.activityContent || null,
                                activityId: activity?._id || null,
                                // Metadata
                                _mainFieldCode: mainField.code,
                                _subFieldCode: subField.code,
                                _expectedResultCode: expectedResult.code,
                                _targetId: target._id, // ✅ Pass targetId
                                _yearTargetId: currentData._id,
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
                        const activityKey = `${currentAgeGroup}-${target._id}`;
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
                            _yearTargetId: currentData._id,
                            isFirstInExpectedResult: targetIdx === 0,
                            expectedResultRowSpan: targetCount,
                        });
                    });
                });
            }
        });

        setTableRows(rows);
    }, [yearTargets, activities, currentAgeGroup]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleAddActivity = (row) => {
        setDialogData({
            mode: 'create',
            ageGroup: currentAgeGroup,
            mainFieldCode: row._mainFieldCode,
            subFieldCode: row._subFieldCode,
            expectedResultCode: row._expectedResultCode,
            targetId: row._targetId, // ✅ Pass targetId
            targetCode: row.targetCode,
            yearTargetId: row._yearTargetId,
        });
        setOpenDialog(true);
    };

    const handleEditActivity = (row) => {
        setDialogData({
            mode: 'edit',
            activityId: row.activityId,
            ageGroup: currentAgeGroup,
            mainFieldCode: row._mainFieldCode,
            subFieldCode: row._subFieldCode,
            expectedResultCode: row._expectedResultCode,
            targetId: row._targetId, // ✅ Pass targetId
            targetCode: row.targetCode,
            yearTargetId: row._yearTargetId,
        });
        setOpenDialog(true);
    };

    const handleDeleteActivity = (row) => {
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
            await educationalActivityApi.delete(row.activityId);
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
                        { text: 'Ngân hàng dữ liệu', icon: StorageOutlinedIcon, href: '#' },
                        { text: 'Kế hoạch giáo dục' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Hoạt động giáo dục theo từng mục tiêu
                        </Typography>
                    </Box>

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
                            {AGE_GROUPS.map((group, index) => (
                                <Tab key={index} label={group.label} />
                            ))}
                        </Tabs>
                    </Box>

                    {/* Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
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
                                        <TableCell sx={{ fontWeight: 700, width: 180 }}>Lĩnh vực phát triển</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 180 }}>Kết quả mong đợi</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 250 }}>Mục tiêu</TableCell>
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
                                                                Chưa có hoạt động giáo dục
                                                            </Typography>
                                                            <Tooltip title="Thêm hoạt động giáo dục">
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleAddActivity(row)}
                                                                >
                                                                    <AddCircleOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                </TableCell>

                                                {/* Thao tác */}
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {row.activityContent && (
                                                        <Box
                                                            sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}
                                                        >
                                                            <Tooltip title="Sửa">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleEditActivity(row)}
                                                                >
                                                                    <EditOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Xóa">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteActivity(row)}
                                                                >
                                                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
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

            {/* Dialog */}
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
