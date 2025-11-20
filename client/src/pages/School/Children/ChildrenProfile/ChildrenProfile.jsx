import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Tooltip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenProfileApi, academicYearApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import ChildrenProfileDialog from './ChildrenProfileDialog';
import dayjs from '~/config/dayjsConfig';

function ChildrenProfile() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentProfile, setCurrentProfile] = useState(null);

    const isActiveYear = selectedYear === activeYearId;

    // Check permissions
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_PROFILE);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_PROFILE);
    const canDelete = hasPermission(PERMISSIONS.DELETE_CHILDREN_PROFILE);

    // Fetch academic years
    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;
            setAcademicYears(years);

            // Tìm năm học đang active
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

    // Fetch classes based on selected year and user permissions
    const fetchClasses = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenProfileApi.getAccessibleAgeGroups(selectedYear);
            const ageGroups = res.data.data.ageGroups;

            // Fetch classes for each age group
            const classPromises = ageGroups.map((ageGroup) =>
                childrenProfileApi.getClassesByAgeGroup(selectedYear, ageGroup),
            );

            const classResults = await Promise.all(classPromises);
            const allClasses = classResults.flatMap((result) => result.data.data.classes);

            setClasses(allClasses);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
        }
    };

    // Fetch children profiles
    const fetchProfiles = async () => {
        if (!selectedYear) return;

        try {
            setLoading(true);
            const res = await childrenProfileApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                academicYearId: selectedYear,
                classId: selectedClass,
                search: searchText,
            });

            const profiles = res.data.data.profiles.map((profile, index) => ({
                ...profile,
                id: profile._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                birthDateFormatted: profile.birthDate ? dayjs(profile.birthDate).format('DD/MM/YYYY') : '---',
                enrollmentDateFormatted: profile.enrollmentDate
                    ? dayjs(profile.enrollmentDate).format('DD/MM/YYYY')
                    : '---',
                className: profile.classId?.name || '---',
                ageGroup: profile.ageGroup || '---',
                grade: profile.classId?.grade || '---',
            }));

            setRows(profiles);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            toast.error('Lỗi khi tải danh sách hồ sơ trẻ em!');
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
            fetchProfiles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedYear, selectedClass, searchText]);

    // Handlers
    const handleCreate = () => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể thêm hồ sơ cho năm học đang hoạt động!');
            return;
        }
        setDialogMode('create');
        setCurrentProfile(null);
        setOpenDialog(true);
    };

    const handleEdit = (profileData) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể chỉnh sửa hồ sơ trong năm học đang hoạt động!');
            return;
        }
        setDialogMode('edit');
        setCurrentProfile(profileData);
        setOpenDialog(true);
    };

    const handleDelete = async (id, studentName) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể xóa hồ sơ trong năm học đang hoạt động!');
            return;
        }

        try {
            await showConfirm({
                title: 'Xác nhận xóa hồ sơ',
                message: `Bạn có chắc chắn muốn xóa hồ sơ của học sinh "${studentName}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                cancelText: 'Hủy',
                onConfirm: async () => {
                    await childrenProfileApi.delete(id);
                    toast.success('Xóa hồ sơ thành công!');
                    fetchProfiles();
                },
            });
        } catch (error) {
            console.error('Error deleting profile:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi xóa hồ sơ!');
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false },

        {
            field: 'fullName',
            headerName: 'Họ tên học sinh',
            flex: 1.2,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>,
        },
        {
            field: 'studentCode',
            headerName: 'Mã học sinh',
            flex: 1.4,
            minWidth: 170,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 500,
                        color: '#666',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'birthDateFormatted',
            headerName: 'Ngày sinh',
            flex: 0.8,
            minWidth: 100,
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
            field: 'grade',
            headerName: 'Tên khối',
            flex: 0.7,
            minWidth: 90,
            sortable: false,
        },
        {
            field: 'ageGroup',
            headerName: 'Nhóm tuổi',
            flex: 0.9,
            minWidth: 120,
            sortable: false,
        },
        {
            field: 'className',
            headerName: 'Tên lớp',
            flex: 0.8,
            minWidth: 100,
            sortable: false,
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 0.7,
            minWidth: 100,
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
        {
            field: 'enrollmentDateFormatted',
            headerName: 'Ngày nhập học',
            flex: 0.9,
            minWidth: 130,
            sortable: false,
        },
        {
            field: 'enrollmentForm',
            headerName: 'Hình thức',
            flex: 0.8,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                    {params.value || '---'}
                </Typography>
            ),
        },
        {
            field: 'birthPlace',
            headerName: 'Nơi sinh',
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary" noWrap>
                    {params.value || '---'}
                </Typography>
            ),
        },
        {
            field: 'permanentAddress',
            headerName: 'Địa chỉ thường trú',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary" noWrap>
                    {params.value || '---'}
                </Typography>
            ),
        },
        {
            field: 'temporaryAddress',
            headerName: 'Địa chỉ tạm trú',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary" noWrap>
                    {params.value || '---'}
                </Typography>
            ),
        },
        {
            field: 'ethnicity',
            headerName: 'Dân tộc',
            flex: 0.6,
            minWidth: 80,
            sortable: false,
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.6,
            minWidth: 100,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate && (
                            <Tooltip title={isActiveYear ? 'Sửa thông tin' : 'Chỉ xem'}>
                                <IconButton color="primary" size="small" onClick={() => handleEdit(params.row)}>
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip title={isActiveYear ? 'Xóa hồ sơ' : 'Không thể xóa'}>
                                <span>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        disabled={!isActiveYear}
                                        onClick={() => handleDelete(params.row.id, params.row.fullName)}
                                        sx={{ opacity: isActiveYear ? 1 : 0.5 }}
                                    >
                                        <DeleteOutlineOutlinedIcon />
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
                    items={[{ text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' }, { text: 'Hồ sơ trẻ em' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách hồ sơ trẻ em
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#1976d2' },
                                    '&.Mui-focused fieldset': { borderColor: '#1976d2' },
                                },
                            }}
                        >
                            {/* Tìm kiếm */}
                            <TextField
                                placeholder="Tìm theo tên, mã học sinh..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                size="small"
                                sx={{ minWidth: 220 }}
                            />

                            {/* Select Năm học */}
                            <FormControl size="small" sx={{ minWidth: 180 }}>
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

                            {/* Select Lớp học */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Lớp học</InputLabel>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    label="Lớp học"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {classes.map((cls) => (
                                        <MenuItem key={cls._id} value={cls._id}>
                                            {cls.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Nút thêm mới */}
                            {canCreate && (
                                <Tooltip
                                    title={
                                        isActiveYear
                                            ? 'Thêm hồ sơ mới'
                                            : 'Chỉ được thêm hồ sơ cho năm học đang hoạt động'
                                    }
                                >
                                    <span>
                                        <IconButton
                                            sx={{
                                                color: isActiveYear ? '#1976d2' : 'grey',
                                                cursor: isActiveYear ? 'pointer' : 'not-allowed',
                                            }}
                                            onClick={handleCreate}
                                            disabled={!isActiveYear}
                                        >
                                            <AddCircleOutlineOutlinedIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Data Grid */}
                    <Box sx={{ display: 'flex', width: '100%', overflow: 'hidden' }}>
                        {/* Bảng bên trái: 3 cột cố định */}
                        <Box
                            sx={{
                                flex: '0 0 400px', // tổng chiều rộng ~ STT (40) + Họ tên (160) + Mã cán bộ (140) + padding
                                backgroundColor: '#fff',
                            }}
                        >
                            <DataGrid
                                rows={rows}
                                columns={columns.filter((c) => ['stt', 'fullName', 'studentCode'].includes(c.field))}
                                loading={loading}
                                disableColumnMenu
                                disableRowSelectionOnClick
                                hideFooter
                                autoHeight
                                rowHeight={52}
                                sx={{
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 900,
                                        borderBottom: '2px solid #bbdefb',
                                    },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem',
                                        whiteSpace: 'normal',
                                        lineHeight: '1.2rem',
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: '1px solid #e0e0e0',
                                        borderRight: '1px solid #e0e0e0',
                                        color: '#000',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                    },
                                    '& .MuiDataGrid-row:hover': { backgroundColor: '#f5faff' },
                                }}
                                slots={{
                                    noRowsOverlay: () => (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%',
                                            }}
                                        >
                                            <Typography variant="body2" color="text.secondary">
                                                Không có dữ liệu
                                            </Typography>
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
                            />
                        </Box>

                        {/* Bảng bên phải: bắt đầu từ “Ngày sinh”, có thanh scroll ngang */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowX: 'auto',
                                '& .MuiDataGrid-virtualScroller': {
                                    overflowX: 'auto',
                                    '&::-webkit-scrollbar': { height: '8px', width: '6px' },
                                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#0964a1a4',
                                        // borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                                },
                            }}
                        >
                            <DataGrid
                                rows={rows}
                                columns={columns.filter((c) => !['stt', 'fullName', 'studentCode'].includes(c.field))}
                                loading={loading}
                                paginationMode="server"
                                paginationModel={paginationModel}
                                onPaginationModelChange={setPaginationModel}
                                pageSizeOptions={[5, 10, 25, 50]}
                                rowCount={totalRows}
                                disableRowSelectionOnClick
                                disableColumnMenu
                                autoHeight
                                sx={{
                                    borderLeft: 'none',
                                    borderBottom: 'none',
                                    borderRight: 'none',
                                    '& .MuiDataGrid-virtualScroller': {
                                        overflowX: 'auto',
                                    },
                                    '& .MuiDataGrid-columnHeaders': {
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 900,
                                        borderRight: '2px solid #bbdefb',
                                        borderBottom: '2px solid #bbdefb',
                                    },
                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem',
                                        whiteSpace: 'normal',
                                        lineHeight: '1.2rem',
                                    },
                                    '& .MuiDataGrid-cell': {
                                        borderRight: '1px solid #e0e0e0',
                                        borderBottom: '1px solid #f0f0f0',
                                        alignItems: 'center',
                                        whiteSpace: 'normal',
                                        // wordBreak: 'break-word',
                                        color: '#000',
                                    },
                                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                        outline: 'none',
                                    },
                                    '& .MuiDataGrid-row:hover': { backgroundColor: '#f5faff' },
                                    // borderRadius: 2,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                                localeText={{
                                    MuiTablePagination: {
                                        labelRowsPerPage: 'Số hàng mỗi trang:',
                                        labelDisplayedRows: ({ from, to, count }) =>
                                            `${from} - ${to} của ${count !== -1 ? count : `hơn ${to}`}`,
                                    },
                                }}
                                slots={{
                                    noRowsOverlay: () => (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%',
                                            }}
                                        >
                                            <Typography variant="body2" color="text.secondary">
                                                Không có dữ liệu
                                            </Typography>
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
                            />
                        </Box>
                    </Box>
                    {/* <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        disableColumnMenu
                        disableColumnSort
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[5, 10, 25, 50]}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-cell:focus': { outline: 'none' },
                            '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#f0f0f0',
                                fontWeight: 600,
                            },
                        }}
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Không có dữ liệu
                                    </Typography>
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
                    /> */}
                </Paper>
            </PageContainer>

            {/* Dialog Create/Edit */}
            <ChildrenProfileDialog
                open={openDialog}
                mode={dialogMode}
                profileData={currentProfile}
                academicYearId={selectedYear}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchProfiles();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default ChildrenProfile;
