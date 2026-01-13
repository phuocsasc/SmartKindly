// client/src/pages/School/UsersParents/UsersParents.jsx

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
import SwitchAccountOutlinedIcon from '@mui/icons-material/SwitchAccountOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { parentApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import UsersParentsDialog from './UsersParentsDialog';
import UsersParentsEditDialog from './UsersParentsEditDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';

function UsersParents() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // '' | 'true' | 'false'
    const [selectedRows, setSelectedRows] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [currentParent, setCurrentParent] = useState(null);

    // Permissions
    const canCreate = hasPermission(PERMISSIONS.CREATE_USER);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_USER);
    const canDelete = hasPermission(PERMISSIONS.DELETE_USER);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 500);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch parents
    const fetchParents = async () => {
        try {
            setLoading(true);
            const res = await parentApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                status: filterStatus,
            });

            const parents = res.data.data.parents.map((parent, index) => ({
                ...parent,
                id: parent._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                studentFullName: parent.studentId?.fullName || 'N/A',
                studentGender: parent.studentId?.gender || '',
                studentCode: parent.studentId?.studentCode || '',
            }));

            setRows(parents);
            setTotalRows(res.data.data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching parents:', error);
            toast.error('Lỗi khi tải danh sách phụ huynh!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterStatus]);

    // Handlers
    const handleCreate = () => {
        setOpenDialog(true);
    };

    const handleEdit = (parentData) => {
        setCurrentParent(parentData);
        setOpenEditDialog(true);
    };

    const handleDelete = async (id, fullName) => {
        showConfirm({
            title: 'Xác nhận xóa tài khoản phụ huynh',
            message: `Bạn có chắc chắn muốn xóa tài khoản phụ huynh "${fullName}"?`,
            severity: 'error',
            confirmText: 'Xóa',
            onConfirm: async () => {
                try {
                    await parentApi.delete(id);
                    toast.success('Xóa tài khoản phụ huynh thành công!');
                    fetchParents();
                    setSelectedRows([]);
                } catch (error) {
                    toast.error(error?.response?.data?.message || 'Lỗi khi xóa tài khoản phụ huynh!');
                }
            },
        });
    };

    const handleDeleteMany = async () => {
        showConfirm({
            title: 'Xác nhận xóa nhiều tài khoản',
            message: `Bạn có chắc chắn muốn xóa ${selectedRows.length} tài khoản phụ huynh đã chọn?`,
            severity: 'error',
            confirmText: 'Xóa tất cả',
            onConfirm: async () => {
                try {
                    await parentApi.deleteMany(selectedRows);
                    toast.success(`Đã xóa ${selectedRows.length} tài khoản phụ huynh!`);
                    fetchParents();
                    setSelectedRows([]);
                } catch (error) {
                    toast.error(error?.response?.data?.message || 'Lỗi khi xóa nhiều tài khoản!');
                }
            },
        });
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'username',
            headerName: 'Tên tài khoản',
            flex: 1.2,
            minWidth: 150,
            sortable: false,
        },
        {
            field: 'studentFullName',
            headerName: 'Họ tên học sinh',
            flex: 1.5,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                // ✅ UPDATED: Chỉ hiển thị tên, không hiển thị Chip mã học sinh
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'studentGender',
            headerName: 'Giới tính',
            flex: 0.8,
            minWidth: 90,
            sortable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value || 'N/A'}
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
            field: 'email',
            headerName: 'Email',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => <Typography variant="body2">{params.value || '---'}</Typography>,
        },
        {
            field: 'phone',
            headerName: 'Số điện thoại',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => <Typography variant="body2">{params.value || '---'}</Typography>,
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            flex: 1,
            minWidth: 130,
            sortable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Kích hoạt' : 'Vô hiệu hóa'}
                    color={params.value ? 'success' : 'error'}
                    size="small"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.8,
            minWidth: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const isDisabled = selectedRows.length >= 2;
                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {canUpdate && (
                            <Tooltip title={isDisabled ? 'Vui lòng bỏ chọn để sửa' : 'Sửa thông tin'}>
                                <span>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        disabled={isDisabled}
                                        onClick={() => handleEdit(params.row)}
                                        sx={{ opacity: isDisabled ? 0.5 : 1 }}
                                    >
                                        <EditOutlinedIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}

                        {canDelete && (
                            <Tooltip title={isDisabled ? 'Vui lòng bỏ chọn để xóa' : 'Xóa tài khoản'}>
                                <span>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        disabled={isDisabled}
                                        onClick={() => handleDelete(params.row.id, params.row.studentFullName)}
                                        sx={{ opacity: isDisabled ? 0.5 : 1 }}
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
                    items={[{ text: 'Người dùng', icon: SwitchAccountOutlinedIcon, href: '#' }, { text: 'Phụ huynh' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách tài khoản phụ huynh
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
                                    '&.Mui-focused fieldset': { borderColor: '#0071bc' },
                                },
                            }}
                        >
                            {/* Search */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo họ tên học sinh..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 220 }}
                            />

                            {/* Filter Status */}
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="true">Kích hoạt</MenuItem>
                                    <MenuItem value="false">Vô hiệu hóa</MenuItem>
                                </Select>
                            </FormControl>

                            {canCreate && (
                                <Tooltip title="Thêm tài khoản phụ huynh">
                                    <IconButton
                                        sx={{ color: '#1976d2' }}
                                        onClick={handleCreate}
                                        disabled={selectedRows.length >= 2}
                                    >
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {canDelete && selectedRows.length > 0 && (
                                <Tooltip title={`Xóa ${selectedRows.length} tài khoản đã chọn`}>
                                    <IconButton color="error" onClick={handleDeleteMany}>
                                        <DeleteSweepOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        checkboxSelection={canDelete}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        disableColumnSort
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        onRowSelectionModelChange={setSelectedRows}
                        pageSizeOptions={[5, 10, 20, 50]}
                        autoHeight
                        sx={{
                            // 💠 STYLE CHO CHECKBOX
                            '& .MuiCheckbox-root': {
                                color: '#0071bc', // ✅ màu viền và icon mặc định
                                '&.Mui-checked': {
                                    color: '#0071bc', // ✅ màu khi tick
                                },
                                '&:hover': {
                                    backgroundColor: '#aee2ff33', // ✅ hiệu ứng hover nhẹ màu xanh nhạt
                                },
                            },
                            // 💠 HEADER STYLE
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#e3f2fd', // ✅ xanh biển nhạt
                                color: '#1976d2', // ✅ chữ xanh đậm
                                fontWeight: 900,
                                borderBottom: '2px solid #bbdefb', // ✅ viền dưới header
                            },
                            '& .MuiDataGrid-columnHeaderTitle': {
                                fontWeight: 'bold', // ✅ chữ in đậm
                                fontSize: '0.95rem', // ✅ tùy chọn: chỉnh kích thước chữ
                            },
                            '& .MuiDataGrid-columnHeader': {
                                borderRight: '1px solid #bbdefb', // ✅ đường kẻ giữa các cột header
                                textAlign: 'center',
                            },

                            // 💠 BODY STYLE
                            '& .MuiDataGrid-cell': {
                                borderRight: '1px solid #e0e0e0', // ✅ đường kẻ giữa các cột body
                                borderBottom: '1px solid #f0f0f0', // ✅ đường kẻ ngang
                                alignItems: 'center',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                color: '#000',
                            },
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none', // ✅ bỏ border khi click
                            },

                            // 💠 ROW HOVER (nếu muốn)
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: '#f5faff',
                            },

                            // 💠 BO GÓC NHẸ, BÓNG NHẸ
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography>Không tìm thấy dữ liệu!</Typography>
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
                </Paper>
            </PageContainer>

            {/* Dialog Create Parent */}
            <UsersParentsDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchParents();
                }}
            />

            {/* Dialog Edit Parent */}
            <UsersParentsEditDialog
                open={openEditDialog}
                parentData={currentParent}
                onClose={() => setOpenEditDialog(false)}
                onSuccess={() => {
                    setOpenEditDialog(false);
                    fetchParents();
                }}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default UsersParents;
