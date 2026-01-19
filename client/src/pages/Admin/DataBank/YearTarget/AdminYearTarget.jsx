// client/src/pages/Admin/DataBank/YearTarget/AdminYearTarget.jsx

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
import { toast } from 'react-toastify';
import AdminYearTargetDialog from './AdminYearTargetDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';

const AGE_GROUPS = [
    { value: 'Nhà trẻ 12-24 tháng', label: 'Nhà trẻ 12-24 tháng' },
    { value: 'Nhà trẻ 24-36 tháng', label: 'Nhà trẻ 24-36 tháng' },
    { value: 'Khối mầm 3-4 tuổi', label: 'Khối mầm 3-4 tuổi' },
    { value: 'Khối chồi 4-5 tuổi', label: 'Khối chồi 4-5 tuổi' },
    { value: 'Khối lá 5-6 tuổi', label: 'Khối lá 5-6 tuổi' },
];

function AdminYearTarget() {
    const { user } = useUser();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [yearTargets, setYearTargets] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);
    const [tableRows, setTableRows] = useState([]);
    const [dialogState, setDialogState] = useState({
        open: false,
        title: '',
        content: '',
        onConfirm: null,
    });

    const currentAgeGroup = AGE_GROUPS[tabValue].value;

    // ✅ Fetch Year Targets
    const fetchYearTargets = async () => {
        try {
            setLoading(true);
            const res = await yearTargetApi.getAll({ page: 1, limit: 100, ageGroup: '' });
            const data = res.data.data.yearTargets;

            const grouped = {};
            data.forEach((item) => {
                grouped[item.ageGroup] = item;
            });

            setYearTargets(grouped);
        } catch (error) {
            console.error('Error fetching year targets:', error);
            toast.error('Lỗi khi tải dữ liệu mục tiêu năm học!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYearTargets();
    }, []);

    // ✅ Convert data to table rows
    useEffect(() => {
        const currentData = yearTargets[currentAgeGroup];
        if (!currentData || !currentData.mainFields) {
            setTableRows([]);
            return;
        }

        const rows = [];
        let globalMtNumber = 1; // ✅ MT liên tục từ MT1, MT2, MT3...

        currentData.mainFields.forEach((mainField) => {
            if (mainField.subFields && mainField.subFields.length > 0) {
                mainField.subFields.forEach((subField) => {
                    subField.expectedResults?.forEach((expectedResult) => {
                        const targets = expectedResult.targets || [];
                        const targetCount = Math.max(targets.length, 1);

                        targets.forEach((target, targetIdx) => {
                            rows.push({
                                id: `${mainField.code}-${subField.code}-${expectedResult.code}-${globalMtNumber}`,
                                mtNumber: globalMtNumber++, // ✅ Số thứ tự MT liên tục
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

    // ✅ Re-number all MT codes after delete
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

            // Clone data để xử lý
            const updatedMainFields = JSON.parse(JSON.stringify(currentData.mainFields));
            const mainField = updatedMainFields.find((mf) => mf.code === row._mainFieldCode);
            if (!mainField) return;

            // ✅ Remove target (Logic xóa giữ nguyên)
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

            // ✅ Re-number all MT codes (Logic đánh lại số thứ tự giữ nguyên)
            const renumberedMainFields = renumberAllTargets(updatedMainFields);

            // Gọi API cập nhật xuống Database
            await yearTargetApi.update(currentData._id, { mainFields: renumberedMainFields });

            toast.success('Xóa mục tiêu thành công!');
            handleCancel(); // Đóng dialog xác nhận

            // ❌ KHÔNG GỌI fetchYearTargets();

            // ✅ CẬP NHẬT STATE TRỰC TIẾP (Client-side update)
            setYearTargets((prev) => ({
                ...prev,
                [currentAgeGroup]: {
                    ...prev[currentAgeGroup],
                    mainFields: renumberedMainFields, // Gán danh sách mới đã xóa và đánh lại số
                },
            }));
        } catch (error) {
            console.error('Error deleting target:', error);
            toast.error('Lỗi khi xóa mục tiêu!');
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
                        { text: 'Mục tiêu năm học' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Mục tiêu năm học theo từng độ tuổi
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

                    {/* Custom Table */}
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
                                        <TableCell sx={{ fontWeight: 700, width: 200 }}>Lĩnh vực phát triển</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 200 }}>Kết quả mong đợi</TableCell>
                                        <TableCell sx={{ fontWeight: 700, width: 350 }}>Mục tiêu</TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                width: 70,
                                                // textAlign: 'center',
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
                                                            <Tooltip title="Thêm mục tiêu">
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleAddTarget(row)}
                                                                >
                                                                    <AddCircleOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
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
                                                    {!row.isEmpty && (
                                                        <Box
                                                            sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}
                                                        >
                                                            <Tooltip title="Sửa">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleEditTarget(row)}
                                                                >
                                                                    <EditOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Xóa">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteTarget(row)}
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
            <AdminYearTargetDialog
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
            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default AdminYearTarget;
