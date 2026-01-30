// client/src/pages/School/Children/ChildrenProgramComplete/ChildrenProgramComplete.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    EmojiEventsOutlined as TrophyIcon,
    EditOutlined as EditIcon,
    DoneOutlined as DoneIcon,
    SettingsOutlined as SettingsIcon,
    DeleteOutlineOutlined as DeleteIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenProgramCompleteApi, academicYearApi, schoolYearTargetApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import { useConfirmDialog } from '~/hooks/useConfirmDialog'; // ✅ FIX
import ConfirmDialog from '~/components/common/ConfirmDialog'; // ✅ FIX
import ChildrenProgramCompleteDialog from './ChildrenProgramCompleteDialog';
import TargetConfigurationDialog from './TargetConfigurationDialog';

// ✅ Star Component
const StarRating = ({ score = 0 }) => {
    const stars = [];
    for (let i = 0; i < 10; i++) {
        stars.push(
            <Box
                key={i}
                sx={{
                    fontSize: 16,
                    color: i < score ? '#ffc107' : '#e0e0e0',
                    display: 'inline-block',
                }}
            >
                ★
            </Box>,
        );
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 0.2,
                width: 'fit-content',
            }}
        >
            {stars}
        </Box>
    );
};

function ChildrenProgramComplete() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog(); // ✅ FIX

    // State
    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [searchText, setSearchText] = useState('');
    const [rows, setRows] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Config & Targets
    const [configuredTargets, setConfiguredTargets] = useState({});
    const [targetDetails, setTargetDetails] = useState({});

    // Dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfigDialog, setOpenConfigDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);

    const isActiveYear = selectedYear === activeYearId;
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_PROGRAM_COMPLETE);
    const canConfigure = hasPermission(PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE) && user?.role === 'ban_giam_hieu';
    const canDelete = hasPermission(PERMISSIONS.DELETE_CHILDREN_PROGRAM_COMPLETE);

    // Get current class info
    const currentClass = classes.find((c) => c._id === selectedClass);
    const currentAgeGroup = currentClass?.ageGroup;

    // Map ageGroup
    const ageGroupMapping = {
        '12-24 tháng': 'Nhà trẻ 12-24 tháng',
        '24-36 tháng': 'Nhà trẻ 24-36 tháng',
        '3-4 tuổi': 'Khối mầm 3-4 tuổi',
        '4-5 tuổi': 'Khối chồi 4-5 tuổi',
        '5-6 tuổi': 'Khối lá 5-6 tuổi',
    };

    const mappedAgeGroup = ageGroupMapping[currentAgeGroup];
    const currentTargetIds = mappedAgeGroup ? configuredTargets[mappedAgeGroup] || [] : [];

    // ✅ Initialize
    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch classes when year changes
    useEffect(() => {
        if (selectedYear) {
            fetchClasses();
            fetchConfiguredTargets();
        } else {
            setClasses([]);
            setSelectedClass('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Fetch data when filters change
    useEffect(() => {
        if (selectedYear && selectedClass) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedYear, selectedClass, searchText]);

    // ✅ Fetch target details when targets change
    useEffect(() => {
        if (currentTargetIds.length > 0 && selectedYear && mappedAgeGroup) {
            fetchTargetDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTargetIds, selectedYear, mappedAgeGroup]);

    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;
            setAcademicYears(years);

            const activeYear = years.find((year) => year.status === 'active');
            if (activeYear) {
                setActiveYearId(activeYear._id);
                setSelectedYear(activeYear._id);
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Không thể tải danh sách năm học');
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await childrenProgramCompleteApi.getAccessibleClasses(selectedYear);
            const classList = res.data.data.classes || [];
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClass(classList[0]._id);
            } else {
                setSelectedClass('');
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Không thể tải danh sách lớp học');
            setClasses([]);
            setSelectedClass('');
        }
    };

    const fetchConfiguredTargets = async () => {
        try {
            const res = await childrenProgramCompleteApi.getConfigByYear(selectedYear);
            const targetMap = {};
            res.data.data.configs.forEach((config) => {
                targetMap[config.ageGroup] = config.selectedTargetIds || [];
            });
            setConfiguredTargets(targetMap);
        } catch (error) {
            console.error('Error fetching configured targets:', error);
        }
    };

    const fetchTargetDetails = async () => {
        try {
            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: selectedYear,
                ageGroup: mappedAgeGroup,
            });

            const targets = res.data.data.targets[0];
            if (!targets) return;

            const details = {};

            const processTargets = (mainFields) => {
                mainFields.forEach((mainField) => {
                    if (mainField.subFields && mainField.subFields.length > 0) {
                        mainField.subFields.forEach((subField) => {
                            subField.expectedResults?.forEach((expectedResult) => {
                                expectedResult.targets?.forEach((target) => {
                                    if (currentTargetIds.includes(target._id)) {
                                        details[String(target._id)] = {
                                            code: target.code,
                                            content: target.content,
                                        };
                                    }
                                });
                            });
                        });
                    } else {
                        mainField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                if (currentTargetIds.includes(target._id)) {
                                    details[String(target._id)] = {
                                        code: target.code,
                                        content: target.content,
                                    };
                                }
                            });
                        });
                    }
                });
            };

            if (targets.mainFields) {
                processTargets(targets.mainFields);
            }

            setTargetDetails(details);
        } catch (error) {
            console.error('Error fetching target details:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            const res = await childrenProgramCompleteApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                academicYearId: selectedYear,
                classId: selectedClass,
                search: searchText,
            });

            const data = res.data.data;

            const evaluations = data.items.map((item, index) => ({
                id: item._id || `temp-${item.studentId._id}`,
                evaluationId: item._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                studentId: item.studentId._id,
                studentName: item.studentId.fullName,
                studentCode: item.studentId.studentCode,
                assessmentDetails: item.assessmentDetails || [],
                note: item.note || '',
            }));

            setRows(evaluations);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row) => {
        setDialogData({
            evaluationId: row.evaluationId,
            student: {
                _id: row.studentId,
                fullName: row.studentName,
                studentCode: row.studentCode,
            },
            classId: selectedClass,
            academicYearId: selectedYear,
            assessmentDetails: row.assessmentDetails,
            note: row.note,
        });
        setOpenDialog(true);
    };

    const handleOpenConfig = () => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể cấu hình trong năm học đang hoạt động!');
            return;
        }
        setOpenConfigDialog(true);
    };

    const handleYearChange = (newYearId) => {
        setSelectedYear(newYearId);
        setSelectedClass('');
        setRows([]);
    };

    // ✅ FIX: Handle delete with useConfirmDialog
    const handleDelete = async (row) => {
        if (!row.evaluationId) {
            toast.warning('Học sinh này chưa có đánh giá!');
            return;
        }

        showConfirm({
            title: 'Xác nhận xóa đánh giá',
            message: `Bạn có chắc chắn muốn xóa đánh giá của học sinh "${row.studentName}"? Hành động này không thể hoàn tác.`,
            severity: 'error',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                    await childrenProgramCompleteApi.delete(row.evaluationId);
                    toast.success('Xóa đánh giá thành công!');
                    fetchData();
                } catch (error) {
                    console.error('Error deleting evaluation:', error);
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa đánh giá!');
                }
            },
        });
    };

    // ✅ Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false, align: 'center' },
        {
            field: 'studentName',
            headerName: 'Họ tên học sinh',
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'studentCode',
            headerName: 'Mã học sinh',
            width: 120,
            sortable: false,
        },
        // Dynamic target columns
        ...currentTargetIds.map((targetId) => {
            const targetInfo = targetDetails[String(targetId)];
            const mtCode = targetInfo?.code || 'MT?';

            return {
                field: String(targetId),
                headerName: mtCode,
                width: 120,
                sortable: false,
                align: 'center',
                renderHeader: () => (
                    <Tooltip title={targetInfo?.content || `Mục tiêu ${mtCode}`} placement="top">
                        <Typography variant="body2" fontWeight={700}>
                            {mtCode}
                        </Typography>
                    </Tooltip>
                ),
                renderCell: (params) => {
                    const assessment = params.row.assessmentDetails?.find(
                        (a) => String(a.targetId) === String(targetId),
                    );
                    const score = assessment?.score || 0;

                    return <StarRating score={score} />;
                },
            };
        }),
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 100,
            sortable: false,
            align: 'center',
            renderCell: (params) => {
                const hasEvaluation = !!params.row.evaluationId;
                const canEdit = isActiveYear && (canCreate || canUpdate);
                const canDeleteRow = isActiveYear && canDelete && hasEvaluation;

                return (
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {/* Edit Icon */}
                        <Tooltip
                            title={
                                canEdit
                                    ? hasEvaluation
                                        ? 'Sửa đánh giá'
                                        : 'Tạo đánh giá'
                                    : 'Chỉ sửa được trong năm học đang hoạt động'
                            }
                        >
                            <span>
                                <IconButton
                                    size="small"
                                    color="primary"
                                    disabled={!canEdit}
                                    onClick={() => handleEdit(params.row)}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>

                        {/* Delete Icon */}
                        {hasEvaluation && (
                            <Tooltip
                                title={canDeleteRow ? 'Xóa đánh giá' : 'Chỉ xóa được trong năm học đang hoạt động'}
                            >
                                <span>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        disabled={!canDeleteRow}
                                        onClick={() => handleDelete(params.row)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                    </Box>
                );
            },
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Quản lý trẻ em', icon: TrophyIcon },
                        { text: 'Đánh giá trẻ hoàn thành chương trình' },
                    ]}
                />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={700} sx={{ color: '#667eea' }}>
                            Đánh giá trẻ hoàn thành chương trình
                        </Typography>
                    </Box>

                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                        {/* Search */}
                        <TextField
                            size="small"
                            placeholder="Tìm theo tên, mã HS..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{ minWidth: 200 }}
                        />

                        {/* Select Năm học */}
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Năm học</InputLabel>
                            <Select
                                value={selectedYear}
                                onChange={(e) => handleYearChange(e.target.value)}
                                label="Năm học"
                            >
                                {academicYears.map((year) => (
                                    <MenuItem key={year._id} value={year._id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2">
                                                {year.fromYear}-{year.toYear}
                                            </Typography>
                                            {year._id === activeYearId && <DoneIcon color="success" fontSize="small" />}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Select Lớp học */}
                        {classes.length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Lớp học</InputLabel>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    label="Lớp học"
                                >
                                    {classes.map((cls) => (
                                        <MenuItem key={cls._id} value={cls._id}>
                                            {cls.name} - {cls.ageGroup}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Button Cấu hình mục tiêu */}
                        {canConfigure && (
                            <Tooltip title="Cấu hình mục tiêu">
                                <IconButton
                                    color="primary"
                                    onClick={handleOpenConfig}
                                    sx={{
                                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' },
                                    }}
                                >
                                    <SettingsIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Alert */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 2 }}>
                            {isActiveYear ? (
                                <strong>Năm học đang hoạt động</strong>
                            ) : (
                                <strong>Năm học đã kết thúc</strong>
                            )}
                        </Alert>
                    )}

                    {currentTargetIds.length === 0 && selectedClass && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            Chưa cấu hình mục tiêu cho nhóm tuổi "{currentAgeGroup}"
                        </Alert>
                    )}

                    {classes.length === 0 && selectedYear && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                            Bạn không có quyền truy cập lớp nào trong năm học này
                        </Alert>
                    )}

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        rowCount={totalRows}
                        pageSizeOptions={[5, 10, 20, 50]}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        autoHeight
                        getRowHeight={() => 'auto'}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: '#f5f5f5',
                                fontWeight: 700,
                            },
                            '& .MuiDataGrid-cell': {
                                py: 1,
                            },
                        }}
                        localeText={{
                            noRowsLabel: 'Không có dữ liệu',
                            MuiTablePagination: {
                                labelRowsPerPage: 'Số dòng mỗi trang:',
                                labelDisplayedRows: ({ from, to, count }) =>
                                    `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`,
                            },
                        }}
                    />
                </Paper>
            </PageContainer>

            {/* Dialog */}
            {dialogData && (
                <ChildrenProgramCompleteDialog
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
            )}

            {/* Config Dialog */}
            <TargetConfigurationDialog
                open={openConfigDialog}
                academicYearId={selectedYear}
                onClose={() => setOpenConfigDialog(false)}
                onSuccess={() => {
                    setOpenConfigDialog(false);
                    fetchConfiguredTargets();
                }}
            />

            {/* ✅ FIX: Add ConfirmDialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default ChildrenProgramComplete;
