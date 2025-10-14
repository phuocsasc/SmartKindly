import { Box, Typography, Paper, Breadcrumbs, Link, Chip, IconButton, Tooltip, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Home as HomeIcon } from '@mui/icons-material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '~/layouts/MainLayout';
import { MOCK_USERS } from '~/utils/MockDataUsers';
import { useUser } from '~/contexts/UserContext';

// ✅ Cấu hình màu sắc cho từng vai trò
const ROLE_CONFIG = {
    'Ban giám hiệu': { color: '#d32f2f', bgColor: '#ffebee', icon: SchoolIcon },
    'Tổ trưởng': { color: '#f57c00', bgColor: '#fff3e0', icon: GroupsIcon },
    'Giáo viên': { color: '#1976d2', bgColor: '#e3f2fd', icon: PersonIcon },
    'Kế toán': { color: '#388e3c', bgColor: '#e8f5e9', icon: AccountBalanceIcon },
    'Phụ huynh': { color: '#7b1fa2', bgColor: '#f3e5f5', icon: FamilyRestroomIcon },
};

function UserManagement() {
    const { user } = useUser();
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 5,
    });
    // DATA
    const [rows, setRows] = useState(MOCK_USERS); // ✅ Fake demo data (16 dòng)
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [selectedRows, setSelectedRows] = useState([]); // ✅ Lưu các dòng được select

    // ✅ Thống kê số lượng người dùng theo vai trò
    const roleStats = useMemo(() => {
        const stats = {};
        Object.keys(ROLE_CONFIG).forEach((role) => {
            stats[role] = MOCK_USERS.filter((u) => u.role === role).length;
        });
        return stats;
    }, []);

    // Debounce search (1s)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounceSearch(searchText);
        }, 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Filter data
    useEffect(() => {
        const filteredData = MOCK_USERS.filter((item) =>
            Object.values(item).some((value) => String(value).toLowerCase().includes(debounceSearch.toLowerCase())),
        );
        setRows(filteredData);
    }, [debounceSearch]);

    // ✅ Cấu hình cột
    const columns = [
        { field: 'stt', headerName: 'STT', width: 80 },
        { field: 'username', headerName: 'Tên tài khoản', flex: 1 },
        { field: 'fullName', headerName: 'Họ tên', flex: 1.3 },
        { field: 'gender', headerName: 'Giới tính', width: 100 },
        { field: 'email', headerName: 'Email', flex: 1.3 },
        { field: 'phone', headerName: 'Số điện thoại', width: 120 },
        {
            field: 'role',
            headerName: 'Vai trò',
            width: 140,
            renderCell: (params) => {
                const roleConfig = ROLE_CONFIG[params.value] || {};
                return (
                    <Chip
                        label={params.value}
                        size="small"
                        sx={{
                            bgcolor: roleConfig.bgColor || '#e0e0e0',
                            color: roleConfig.color || '#000',
                            fontWeight: 600,
                            border: `1px solid ${roleConfig.color || '#999'}`,
                        }}
                    />
                );
            },
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 120,
            renderCell: (params) => (
                <Chip label={params.value} color={params.value === 'Kích hoạt' ? 'success' : 'error'} size="small" />
            ),
        },
        {
            field: 'actions',
            headerName: 'Hành động',
            width: 100,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: () => {
                // ✅ Disable các nút sửa/xóa khi select >= 2 dòng
                const isDisabled = selectedRows.length >= 2;
                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Tooltip title={isDisabled ? 'Vui lòng bỏ chọn để sửa' : 'Sửa thông tin'}>
                            <span>
                                <IconButton color="primary" size="small" disabled={isDisabled}>
                                    <EditOutlinedIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title={isDisabled ? 'Vui lòng bỏ chọn để xóa' : 'Xóa người dùng'}>
                            <span>
                                <IconButton color="error" disabled={isDisabled}>
                                    <DeleteOutlineOutlinedIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    return (
        <MainLayout user={user}>
            <Box sx={{ p: 2 }}>
                {/* Breadcrumb */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        color="inherit"
                        href="/dashboard"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                        }}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Trang chủ
                    </Link>
                    <Typography color="text.primary">Quản lý người dùng</Typography>
                </Breadcrumbs>

                {/* ✅ Thống kê số lượng người dùng theo vai trò */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                        const Icon = config.icon;
                        return (
                            <Paper
                                key={role}
                                elevation={2}
                                sx={{
                                    flex: 1,
                                    minWidth: '180px',
                                    p: 2,
                                    borderRadius: 2,
                                    borderLeft: `4px solid ${config.color}`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {role}
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700} sx={{ color: config.color }}>
                                            {roleStats[role]}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: '50%',
                                            bgcolor: config.bgColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 28, color: config.color }} />
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>

                {/* Bảng người dùng */}
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                    {/* Thanh chức năng */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách người dùng
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />

                            {/* ✅ Disable nút Thêm khi select >= 2 dòng */}
                            <Tooltip
                                title={selectedRows.length >= 2 ? 'Vui lòng bỏ chọn để thêm mới' : 'Thêm người dùng'}
                            >
                                <span>
                                    <IconButton sx={{ color: '#1976d2' }} disabled={selectedRows.length >= 2}>
                                        <AddCircleOutlineOutlinedIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>

                            {/* ✅ Hiển thị nút Xóa hàng loạt khi có select */}
                            {selectedRows.length > 0 && (
                                <Tooltip title={`Xóa ${selectedRows.length} người dùng đã chọn`}>
                                    <IconButton color="error">
                                        <DeleteOutlineOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        checkboxSelection
                        disableColumnMenu
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)} // ✅ Cập nhật selection
                        pageSizeOptions={[5, 10, 20, rows.length]}
                        autoHeight
                        sx={{
                            '& .MuiDataGrid-row:hover': {
                                cursor: 'pointer',
                                backgroundColor: '#f5f5f5',
                            },
                            '& .MuiDataGrid-cell:focus': {
                                outline: 'none !important',
                            },
                            '& .MuiDataGrid-cell:focus-within': {
                                outline: 'none !important',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#e3f2fd',
                                fontWeight: 'bold',
                            },
                            '& .MuiDataGrid-footerContainer': {
                                backgroundColor: '#f8f9fa',
                            },
                        }}
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ p: 3, textAlign: 'center', color: 'gray' }}>
                                    <Typography>Không tìm thấy dữ liệu phù hợp!</Typography>
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
            </Box>
        </MainLayout>
    );
}

export default UserManagement;
