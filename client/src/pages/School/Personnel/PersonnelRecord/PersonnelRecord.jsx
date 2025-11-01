// client/src/pages/School/Personnel/PersonnelRecord/PersonnelRecord.jsx
import {
    Box,
    Typography,
    Paper,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PeopleIcon from '@mui/icons-material/People';
import { useEffect, useState } from 'react';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { personnelRecordApi } from '~/apis/personnelRecordApi';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import PersonnelRecordDialog from './PersonnelRecordDialog';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { exportPersonnelRecordsToExcel } from '~/utils/personnelRecordExcelExport';
import { schoolApi } from '~/apis/schoolApi';

import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ImportPersonnelDialog from './ImportPersonnedDialog';

// ✅ Constants
const DEPARTMENTS = [
    'CBQL',
    'Tổ cấp dưỡng',
    'Khối Nhà Trẻ',
    'Khối Mầm',
    'Khối Chồi',
    'Khối Lá',
    'Tổ Văn Phòng',
    'Tổ Bảo Mẫu',
];

const WORK_STATUS = ['Đang làm việc', 'Chuyển công tác', 'Nghỉ hưu', 'Nghỉ việc', 'Tạm nghỉ'];

const POSITION_GROUPS = [
    'Hiệu trưởng',
    'Hiệu phó',
    'Tổ trưởng',
    'Tổ phó',
    'Giáo viên',
    'Bảo mẫu',
    'Nấu ăn',
    'Kế toán',
    'Giáo vụ',
];

function PersonnelRecord() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

    const [searchText, setSearchText] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPosition, setFilterPosition] = useState('');

    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentRecord, setCurrentRecord] = useState(null);
    const [debounceSearch, setDebounceSearch] = useState('');

    const [exportLoading, setExportLoading] = useState(false);
    const [openImportDialog, setOpenImportDialog] = useState(false);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounceSearch(searchText);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch data
    useEffect(() => {
        fetchRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterDepartment, filterStatus, filterPosition]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await personnelRecordApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                department: filterDepartment,
                workStatus: filterStatus,
                positionGroup: filterPosition, // ✅ Thêm filter mới
            });

            const records = res.data.data.records.map((item, index) => ({
                ...item,
                id: item._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                dateOfBirthDisplay: item.dateOfBirth ? dayjs(item.dateOfBirth).format('DD/MM/YYYY') : '---',
                majorDegreeLevelDisplay: item.majorDegreeLevel || '---',
            }));

            setRows(records);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching records:', error);
            toast.error('Lỗi khi tải danh sách hồ sơ cán bộ!');
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentRecord(null);
        setOpenDialog(true);
    };

    const handleEdit = (record) => {
        setDialogMode('edit');
        setCurrentRecord(record);
        setOpenDialog(true);
    };

    const handleView = (record) => {
        setDialogMode('view');
        setCurrentRecord(record);
        setOpenDialog(true);
    };

    const handleDelete = async (id) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa hồ sơ cán bộ',
                message: 'Bạn có chắc chắn muốn xóa hồ sơ này?',
                confirmText: 'Xóa',
                onConfirm: async () => {
                    await personnelRecordApi.delete(id);
                    toast.success('Xóa hồ sơ cán bộ thành công!');
                    fetchRecords();
                },
            });
        } catch (error) {
            if (error?.isCancel) return;
            toast.error(error?.response?.data?.message || 'Lỗi khi xóa hồ sơ!');
        }
    };

    // ✅ Handler xuất Excel - FIX: Dùng getSchoolInfo thay vì getDetails
    const handleExportExcel = async () => {
        try {
            setExportLoading(true);

            // Lấy tất cả records (không phân trang)
            const res = await personnelRecordApi.getAll({
                page: 1,
                limit: 9999, // Lấy hết
                search: '',
                department: '',
                workStatus: '',
                positionGroup: '',
            });

            // ✅ FIX: Lấy thông tin trường của user hiện tại
            const schoolRes = await schoolApi.getSchoolInfo(); // Thay vì getDetails(user.schoolId)
            const schoolName = schoolRes.data.data.name;

            // Xuất Excel
            await exportPersonnelRecordsToExcel(res.data.data.records, schoolName);

            toast.success('Xuất file Excel thành công!');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.error('Lỗi khi xuất file Excel!');
        } finally {
            setExportLoading(false);
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false },
        {
            field: 'fullName',
            headerName: 'Họ tên cán bộ',
            flex: 1.5,
            minWidth: 160,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 600,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'personnelCode',
            headerName: 'Mã cán bộ',
            flex: 1.2,
            minWidth: 140,
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
            field: 'dateOfBirthDisplay',
            headerName: 'Ngày sinh',
            flex: 1,
            minWidth: 120,
            sortable: false,
        },
        {
            field: 'gender',
            headerName: 'Giới tính',
            flex: 0.7,
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
            field: 'department',
            headerName: 'Tổ bộ môn',
            flex: 1.2,
            minWidth: 140,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'positionGroup',
            headerName: 'Nhóm chức vụ',
            flex: 1,
            minWidth: 130,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: '#fff3e0',
                        color: '#e65100',
                        fontWeight: 500,
                    }}
                />
            ),
        },
        {
            field: 'contractType',
            headerName: 'Hình thức hợp đồng',
            flex: 1.8,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'majorDegreeLevelDisplay',
            headerName: 'Trình độ chuyên ngành',
            flex: 1.2,
            minWidth: 190,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'workStatus',
            headerName: 'Trạng thái',
            flex: 1,
            minWidth: 130,
            sortable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => {
                const statusConfig = {
                    'Đang làm việc': { color: 'success', label: 'Đang làm việc' },
                    'Chuyển công tác': { color: 'info', label: 'Chuyển công tác' },
                    'Nghỉ hưu': { color: 'default', label: 'Nghỉ hưu' },
                    'Nghỉ việc': { color: 'error', label: 'Nghỉ việc' },
                    'Tạm nghỉ': { color: 'warning', label: 'Tạm nghỉ' },
                };
                const config = statusConfig[params.value] || { color: 'default', label: params.value };
                return <Chip label={config.label} color={config.color} size="small" />;
            },
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.8,
            minWidth: 100,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const canUpdate = hasPermission(PERMISSIONS.UPDATE_PERSONNEL_RECORDS);
                const canDelete = hasPermission(PERMISSIONS.DELETE_PERSONNEL_RECORDS);
                const canView = hasPermission(PERMISSIONS.VIEW_PERSONNEL_RECORDS);

                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate && (
                            <Tooltip title="Sửa thông tin">
                                <IconButton color="primary" size="small" onClick={() => handleEdit(params.row)}>
                                    <EditOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {!canUpdate && canView && (
                            <Tooltip title="Xem chi tiết">
                                <IconButton color="info" size="small" onClick={() => handleView(params.row)}>
                                    <VisibilityOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip title="Xóa">
                                <IconButton color="error" size="small" onClick={() => handleDelete(params.row.id)}>
                                    <DeleteOutlineOutlinedIcon />
                                </IconButton>
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
                    items={[{ text: 'Quản lý cán bộ', icon: PeopleIcon, href: '#' }, { text: 'Hồ sơ cán bộ' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách hồ sơ cán bộ
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    '&:hover fieldset': { borderColor: '#0071bc' },
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                },
                                '& label.Mui-focused': { color: '#0071bc' },
                            }}
                        >
                            {/* Tìm kiếm */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã cán bộ..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 220 } }}
                            />

                            {/* Lọc Tổ bộ môn */}
                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 150 } }}>
                                <InputLabel>Tổ bộ môn</InputLabel>
                                <Select
                                    value={filterDepartment}
                                    onChange={(e) => setFilterDepartment(e.target.value)}
                                    label="Tổ bộ môn"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {DEPARTMENTS.map((dept) => (
                                        <MenuItem key={dept} value={dept}>
                                            {dept}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Lọc Trạng thái */}
                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 140 } }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {WORK_STATUS.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Lọc Nhóm chức vụ */}
                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 160 } }}>
                                <InputLabel>Nhóm chức vụ</InputLabel>
                                <Select
                                    value={filterPosition}
                                    onChange={(e) => setFilterPosition(e.target.value)}
                                    label="Nhóm chức vụ"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {POSITION_GROUPS.map((pos) => (
                                        <MenuItem key={pos} value={pos}>
                                            {pos}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Thêm mới */}
                            {hasPermission(PERMISSIONS.CREATE_PERSONNEL_RECORDS) && (
                                <Tooltip title="Thêm hồ sơ cán bộ">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {/* ✅ Nút Import Excel */}
                            {hasPermission(PERMISSIONS.CREATE_PERSONNEL_RECORDS) && (
                                <Tooltip title="Nhập dữ liệu từ Excel">
                                    <IconButton sx={{ color: '#f57c00' }} onClick={() => setOpenImportDialog(true)}>
                                        <FileUploadOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {/* ✅ Nút Xuất Excel */}
                            <Tooltip title="Xuất file Excel">
                                <IconButton
                                    sx={{ color: '#2e7d32' }}
                                    onClick={handleExportExcel}
                                    disabled={exportLoading}
                                >
                                    {exportLoading ? (
                                        <CircularProgress size={24} sx={{ color: '#2e7d32' }} />
                                    ) : (
                                        <FileDownloadOutlinedIcon />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* DataGrid */}
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
                                columns={columns.filter((c) => ['stt', 'fullName', 'personnelCode'].includes(c.field))}
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
                                columns={columns.filter((c) => !['stt', 'fullName', 'personnelCode'].includes(c.field))}
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
                </Paper>
            </PageContainer>

            {/* Dialog Create/Edit/View */}
            <PersonnelRecordDialog
                open={openDialog}
                mode={dialogMode}
                record={currentRecord}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchRecords();
                }}
            />

            {/* ✅ Import Dialog */}
            <ImportPersonnelDialog
                open={openImportDialog}
                onClose={() => setOpenImportDialog(false)}
                onSuccess={() => {
                    setOpenImportDialog(false);
                    fetchRecords();
                }}
                schoolName={user?.schoolName || 'Mầm non Huynh Kim Phụng'}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default PersonnelRecord;
