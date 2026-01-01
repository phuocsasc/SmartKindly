/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenByClassApi, academicYearApi, classApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import AddStudentsToClassDialog from './AddStudentsToClassDialog';
import TransferStudentsDialog from './TransferStudentsDialog';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';

function ChildrenByClass() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClassTab, setSelectedClassTab] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Children data
    const [rows, setRows] = useState([]);
    const [classInfo, setClassInfo] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    // Dialog state
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openTransferDialog, setOpenTransferDialog] = useState(false);

    // Permissions
    const isActiveYear = selectedYear === activeYearId;
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_BY_CLASS);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_BY_CLASS);

    // ✅ Fetch academic years
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
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    // ✅ Fetch classes of selected year
    const fetchClasses = async () => {
        if (!selectedYear) return;

        try {
            const res = await classApi.getAll({
                page: 1,
                limit: 9999,
                academicYearId: selectedYear,
                search: '',
            });

            const classList = res.data.data.classes || [];
            setClasses(classList);

            // Auto-select first class
            if (classList.length > 0) {
                setSelectedClassTab(0);
            } else {
                setSelectedClassTab(-1);
                setRows([]);
                setClassInfo(null);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
            setClasses([]);
        }
    };

    // ✅ Fetch children by class
    const fetchChildren = async () => {
        if (!selectedYear || selectedClassTab === -1 || classes.length === 0 || !classes[selectedClassTab]) {
            console.log('⚠️ [fetchChildren] Skipped - missing data:', {
                selectedYear,
                selectedClassTab,
                classesLength: classes.length,
                currentClass: classes[selectedClassTab],
            });
            return;
        }
        const currentClass = classes[selectedClassTab];

        try {
            setLoading(true);
            console.log('📥 [fetchChildren] Fetching for class:', currentClass.name);

            const res = await childrenByClassApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                academicYearId: selectedYear,
                classId: currentClass._id,
                search: searchText,
            });

            const { children, classInfo: info, pagination } = res.data.data;

            const mappedChildren = children.map((child, index) => ({
                id: child._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                studentId: child.studentId?._id,
                fullName: child.studentId?.fullName || '---',
                studentCode: child.studentId?.studentCode || '---',
                birthDate: child.studentId?.birthDate ? dayjs(child.studentId.birthDate).format('DD/MM/YYYY') : '---',
                gender: child.studentId?.gender || '---',
                status: child.studentId?.status || '---',
            }));

            setRows(mappedChildren);
            setClassInfo(info);
            setTotalRows(pagination.totalItems);
            console.log('✅ [fetchChildren] Loaded:', mappedChildren.length, 'students');
        } catch (error) {
            console.error('Error fetching children:', error);
            toast.error('Lỗi khi tải danh sách trẻ theo lớp!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchClasses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (selectedClassTab !== -1 && classes.length > 0) {
            fetchChildren();
            setSelectedRows([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, searchText, selectedClassTab, classes]);

    // Handlers
    const handleClassTabChange = (event, newValue) => {
        setSelectedClassTab(newValue);
        setPaginationModel({ page: 0, pageSize: 10 });
        setSearchText('');
        setSelectedRows([]);
    };

    const handleAddStudents = () => {
        if (!isActiveYear) {
            toast.warning('Chỉ được thêm trẻ vào lớp trong năm học đang hoạt động!');
            return;
        }
        setOpenAddDialog(true);
    };

    const handleTransferStudents = () => {
        if (!isActiveYear) {
            toast.warning('Chỉ được chuyển lớp trong năm học đang hoạt động!');
            return;
        }
        if (selectedRows.length === 0) {
            toast.warning('Vui lòng chọn ít nhất 1 học sinh để chuyển lớp!');
            return;
        }
        setOpenTransferDialog(true);
    };

    // ✅ Handler: Xóa 1 học sinh ra khỏi lớp
    const handleDeleteStudent = async (id, fullName) => {
        if (!isActiveYear) {
            toast.warning('Chỉ được xóa học sinh trong năm học đang hoạt động!');
            return;
        }

        try {
            await showConfirm({
                title: 'Xác nhận xóa học sinh ra khỏi lớp',
                message: `Bạn có chắc chắn muốn xóa học sinh "${fullName}" ra khỏi lớp này?`,
                severity: 'error',
                confirmText: 'Xóa',
                cancelText: 'Hủy',
                onConfirm: async () => {
                    try {
                        await childrenByClassApi.removeStudentFromClass(id);
                        toast.success('Xóa học sinh ra khỏi lớp thành công!');
                        fetchChildren();
                        setSelectedRows([]);
                    } catch (error) {
                        toast.error(error.response?.data?.message || 'Lỗi khi xóa học sinh!');
                    }
                },
            });
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    // ✅ Handler: Xóa nhiều học sinh ra khỏi lớp
    const handleDeleteManyStudents = async () => {
        if (!isActiveYear) {
            toast.warning('Chỉ được xóa học sinh trong năm học đang hoạt động!');
            return;
        }

        if (selectedRows.length === 0) {
            toast.warning('Vui lòng chọn ít nhất 1 học sinh để xóa!');
            return;
        }

        try {
            await showConfirm({
                title: 'Xác nhận xóa nhiều học sinh',
                message: `Bạn có chắc chắn muốn xóa ${selectedRows.length} học sinh ra khỏi lớp này?`,
                severity: 'error',
                confirmText: 'Xóa',
                cancelText: 'Hủy',
                onConfirm: async () => {
                    try {
                        await childrenByClassApi.removeStudentsFromClass(selectedRows);
                        toast.success(`Đã xóa ${selectedRows.length} học sinh ra khỏi lớp!`);
                        fetchChildren();
                        setSelectedRows([]);
                    } catch (error) {
                        toast.error(error.response?.data?.message || 'Lỗi khi xóa học sinh!');
                    }
                },
            });
        } catch (error) {
            console.error('Error deleting students:', error);
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'fullName',
            headerName: 'Họ tên học sinh',
            flex: 1.2,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>,
        },
        {
            field: 'studentCode',
            headerName: 'Mã học sinh',
            flex: 1,
            minWidth: 140,
            sortable: false,
        },
        {
            field: 'birthDate',
            headerName: 'Ngày sinh',
            flex: 0.8,
            minWidth: 120,
            sortable: false,
        },
        {
            field: 'gender',
            headerName: 'Giới tính',
            flex: 0.6,
            minWidth: 90,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: params.value === 'Nam' ? '#e3f2fd' : '#fce4ec',
                        color: params.value === 'Nam' ? '#1976d2' : '#c2185b',
                        fontWeight: 500,
                    }}
                />
            ),
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 0.8,
            minWidth: 110,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value === 'Đang học' ? 'success' : 'default'}
                    sx={{ fontWeight: 500 }}
                />
            ),
        },
        // ✅ Thêm cột Thao tác
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            disableColumnMenu: true,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                const isDisabled = !isActiveYear || selectedRows.length >= 2;

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {canUpdate && (
                            <Tooltip
                                title={
                                    !isActiveYear
                                        ? 'Chỉ được xóa trong năm học đang hoạt động'
                                        : isDisabled
                                          ? 'Vui lòng bỏ chọn để xóa đơn lẻ'
                                          : 'Xóa học sinh ra khỏi lớp'
                                }
                            >
                                <span>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        disabled={!isActiveYear || isDisabled}
                                        onClick={() => handleDeleteStudent(params.row.id, params.row.fullName)}
                                        sx={{ opacity: !isActiveYear || isDisabled ? 0.5 : 1 }}
                                    >
                                        <DeleteOutlineOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                    </Box>
                );
            },
        },
    ];

    const currentClass = classes[selectedClassTab];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' },
                        { text: 'Danh sách trẻ theo lớp' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách trẻ theo lớp
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Search */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã HS..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 220 }}
                            />

                            {/* Academic Year */}
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(e.target.value);
                                        setSelectedRows([]);
                                    }}
                                    label="Năm học"
                                >
                                    {academicYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2">
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
                            {/* ✅ Delete Many Button */}
                            {canUpdate && selectedRows.length > 0 && (
                                <Tooltip
                                    title={
                                        !isActiveYear
                                            ? 'Chỉ được xóa trong năm học đang hoạt động'
                                            : `Xóa ${selectedRows.length} học sinh đã chọn`
                                    }
                                >
                                    <span>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<DeleteSweepOutlinedIcon />}
                                            onClick={handleDeleteManyStudents}
                                            disabled={!isActiveYear}
                                        >
                                            Xóa ({selectedRows.length})
                                        </Button>
                                    </span>
                                </Tooltip>
                            )}
                            {/* Transfer Button */}
                            {canUpdate && (
                                <Tooltip
                                    title={
                                        !isActiveYear
                                            ? 'Chỉ được chuyển lớp trong năm học đang hoạt động'
                                            : selectedRows.length === 0
                                              ? 'Vui lòng chọn học sinh để chuyển lớp'
                                              : 'Chuyển lớp'
                                    }
                                >
                                    <span>
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            size="small"
                                            startIcon={<SwapHorizOutlinedIcon />}
                                            onClick={handleTransferStudents}
                                            disabled={!isActiveYear || selectedRows.length === 0}
                                        >
                                            Chuyển lớp ({selectedRows.length})
                                        </Button>
                                    </span>
                                </Tooltip>
                            )}

                            {/* Add Button */}
                            {canCreate && (
                                <Tooltip
                                    title={
                                        !isActiveYear
                                            ? 'Chỉ được thêm trẻ trong năm học đang hoạt động'
                                            : 'Thêm trẻ vào lớp'
                                    }
                                >
                                    <span>
                                        <IconButton
                                            sx={{ color: isActiveYear ? '#1976d2' : 'grey' }}
                                            onClick={handleAddStudents}
                                            disabled={!isActiveYear || !currentClass}
                                        >
                                            <AddCircleOutlineOutlinedIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Status Alert */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 1 }}>
                            {isActiveYear ? (
                                <strong>Năm học đang hoạt động - Có thể thao tác</strong>
                            ) : (
                                <strong>Năm học đã kết thúc - Chỉ xem dữ liệu</strong>
                            )}
                        </Alert>
                    )}

                    {/* No classes warning */}
                    {classes.length === 0 && selectedYear && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                            Năm học này chưa có lớp học nào.
                        </Alert>
                    )}

                    {/* Main Content: Tabs + DataGrid */}
                    {classes.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {/* Left: Class Tabs */}
                            <Paper sx={{ width: 280, minHeight: 400, p: 1, bgcolor: '#f5f5f5' }}>
                                <Tabs
                                    orientation="vertical"
                                    value={selectedClassTab}
                                    onChange={handleClassTabChange}
                                    sx={{
                                        '& .MuiTab-root': {
                                            alignItems: 'flex-start',
                                            textAlign: 'left',
                                            minHeight: 60,
                                            borderRadius: 1,
                                            mb: 0.5,
                                            '&:hover': {
                                                bgcolor: '#e3f2fd',
                                            },
                                        },
                                        '& .Mui-selected': {
                                            bgcolor: '#1976d2 !important',
                                            color: '#fff !important',
                                        },
                                    }}
                                >
                                    {classes.map((cls, index) => (
                                        <Tab
                                            key={cls._id}
                                            label={
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {cls.name}
                                                    </Typography>
                                                    <Typography variant="caption">({cls.ageGroup})</Typography>
                                                </Box>
                                            }
                                        />
                                    ))}
                                </Tabs>
                            </Paper>

                            {/* Right: DataGrid */}
                            <Box sx={{ flex: 1 }}>
                                {/* Class Info */}
                                {classInfo && (
                                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                                            {classInfo.className} - ({classInfo.ageGroup})
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Khối: {classInfo.grade} | GVCN: {classInfo.homeRoomTeacher}
                                        </Typography>
                                    </Box>
                                )}

                                {/* DataGrid */}
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    loading={loading}
                                    checkboxSelection={canUpdate && isActiveYear}
                                    disableRowSelectionOnClick
                                    disableColumnMenu
                                    disableColumnSort
                                    paginationMode="server"
                                    rowCount={totalRows}
                                    paginationModel={paginationModel}
                                    onPaginationModelChange={setPaginationModel}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    rowSelectionModel={selectedRows}
                                    onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
                                    autoHeight
                                    sx={{
                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            fontWeight: 900,
                                        },
                                        '& .MuiDataGrid-cell': {
                                            borderRight: '1px solid #e0e0e0',
                                        },
                                        '& .MuiDataGrid-row:hover': {
                                            backgroundColor: '#f5faff',
                                        },
                                        borderRadius: 2,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    }}
                                    slots={{
                                        noRowsOverlay: () => (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography>Không có học sinh nào trong lớp này!</Typography>
                                            </Box>
                                        ),
                                        loadingOverlay: () => (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    height: '100%',
                                                }}
                                            >
                                                <CircularProgress />
                                            </Box>
                                        ),
                                    }}
                                    slotProps={{
                                        pagination: {
                                            labelRowsPerPage: 'Số dòng mỗi trang:',
                                            labelDisplayedRows: ({ from, to, count }) =>
                                                `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`,
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </Paper>
            </PageContainer>

            {/* Add Students Dialog */}
            {openAddDialog && currentClass && (
                <AddStudentsToClassDialog
                    open={openAddDialog}
                    academicYearId={selectedYear}
                    classId={currentClass._id}
                    className={currentClass.name}
                    ageGroup={currentClass.ageGroup}
                    onClose={() => setOpenAddDialog(false)}
                    onSuccess={() => {
                        setOpenAddDialog(false);
                        fetchChildren();
                    }}
                />
            )}

            {/* Transfer Students Dialog */}
            {openTransferDialog && currentClass && (
                <TransferStudentsDialog
                    open={openTransferDialog}
                    academicYearId={selectedYear}
                    fromClassId={currentClass._id}
                    fromClassName={currentClass.name}
                    studentIds={selectedRows}
                    students={rows.filter((row) => selectedRows.includes(row.id))}
                    onClose={() => setOpenTransferDialog(false)}
                    onSuccess={() => {
                        setOpenTransferDialog(false);
                        setSelectedRows([]);
                        fetchChildren();
                    }}
                />
            )}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default ChildrenByClass;
