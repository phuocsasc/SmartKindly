// client/src/pages/Admin/DataBank/Food/AdminFood.jsx

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
    Chip,
    CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import MainLayout from '~/layouts/AdminLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { foodApi } from '~/apis/foodApi';
import { toast } from 'react-toastify';
import AdminFoodDialog from './AdminFoodDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ImportFoodDialog from './ImportFoodDialog';

const FOOD_CATEGORIES = ['Động vật', 'Thực vật', 'Thực phẩm Khô', 'Thực phẩm tươi', 'Thực phẩm ăn liền'];

function AdminFood() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [debounceSearch, setDebounceSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentFood, setCurrentFood] = useState(null);
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]); // ✅ State cho checkbox selection

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebounceSearch(searchText), 1000);
        return () => clearTimeout(handler);
    }, [searchText]);

    // Fetch foods
    const fetchFoods = async () => {
        try {
            setLoading(true);
            const response = await foodApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debounceSearch,
                category: filterCategory,
            });

            const data = response.data.data;
            const formattedRows = data.foods.map((food, index) => ({
                id: food._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                name: food.name,
                unit: food.unit,
                gramConversion: food.gramConversion,
                categories: food.categories,
                wastePercentage: food.wastePercentage,
                protein: food.protein,
                lipid: food.lipid,
                glucid: food.glucid,
                ...food,
            }));

            setRows(formattedRows);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error('Lỗi khi tải danh sách thực phẩm!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFoods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, debounceSearch, filterCategory]);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentFood(null);
        setOpenDialog(true);
    };

    const handleEdit = (food) => {
        setDialogMode('edit');
        setCurrentFood(food);
        setOpenDialog(true);
    };

    const handleDelete = async (id, name) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa thực phẩm',
                message: `Bạn có chắc chắn muốn xóa thực phẩm "${name}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                onConfirm: async () => {
                    await foodApi.delete(id);
                    toast.success('Xóa thực phẩm thành công!');
                    fetchFoods();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa thực phẩm!');
        }
    };

    // ✅ Xóa nhiều thực phẩm
    const handleDeleteMany = async () => {
        if (selectedRows.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một thực phẩm để xóa!');
            return;
        }

        try {
            await showConfirm({
                title: 'Xác nhận xóa nhiều thực phẩm',
                message: `Bạn có chắc chắn muốn xóa ${selectedRows.length} thực phẩm đã chọn? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa tất cả',
                onConfirm: async () => {
                    try {
                        await foodApi.deleteMany(selectedRows);
                        toast.success(`Xóa ${selectedRows.length} thực phẩm thành công!`);
                        setSelectedRows([]);
                        fetchFoods();
                    } catch (deleteError) {
                        const errorMessage = deleteError?.response?.data?.message || 'Lỗi khi xóa thực phẩm!';
                        toast.error(errorMessage);
                    }
                },
            });
        } catch (error) {
            console.error('Error deleting many foods:', error);
            toast.error('Lỗi khi xóa thực phẩm!');
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setCurrentFood(null);
    };

    const handleDialogSuccess = () => {
        fetchFoods();
        handleDialogClose();
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'name',
            headerName: 'Tên thực phẩm',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    sx={{
                        fontWeight: 500,
                        color: '#000',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'unit',
            headerName: 'Đơn vị tính',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => <Chip label={params.value} size="small" color="primary" variant="outlined" />,
        },
        {
            field: 'gramConversion',
            headerName: 'Quy đổi sang gam',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => `${params.value}g`,
        },
        {
            field: 'categories',
            headerName: 'Loại thực phẩm',
            flex: 1.5,
            minWidth: 250,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
                    {params.value.map((category, index) => (
                        <Chip key={index} label={category} size="small" color="success" />
                    ))}
                </Box>
            ),
        },
        {
            field: 'wastePercentage',
            headerName: 'Hệ số thái bỏ (%)',
            width: 140,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => `${params.value}%`,
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
                // ✅ Disable action buttons khi đang chọn nhiều dòng
                const isDisabled = selectedRows.length >= 2;

                return (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {hasPermission(PERMISSIONS.ADMIN_DATA_BANK) && (
                            <>
                                <Tooltip title={isDisabled ? 'Hủy chọn để sửa' : 'Sửa'}>
                                    <span>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleEdit(params.row)}
                                            disabled={isDisabled}
                                            sx={{ opacity: isDisabled ? 0.5 : 1 }}
                                        >
                                            <EditOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title={isDisabled ? 'Hủy chọn để xóa' : 'Xóa'}>
                                    <span>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(params.row.id, params.row.name)}
                                            disabled={isDisabled}
                                            sx={{ opacity: isDisabled ? 0.5 : 1 }}
                                        >
                                            <DeleteOutlineOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </>
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
                        { text: 'Ngân hàng dữ liệu', icon: RestaurantOutlinedIcon, href: '#' },
                        { text: 'Thực phẩm' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách thực phẩm
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
                            <TextField
                                size="small"
                                placeholder="Tìm kiếm theo tên..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: { xs: '100%', sm: 250, md: 350 } }}
                            />

                            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 200 } }}>
                                <InputLabel>Loại thực phẩm</InputLabel>
                                <Select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    label="Loại thực phẩm"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {FOOD_CATEGORIES.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {hasPermission(PERMISSIONS.ADMIN_DATA_BANK) && (
                                <>
                                    <Tooltip title="Thêm thực phẩm">
                                        <IconButton
                                            sx={{ color: '#1976d2' }}
                                            onClick={handleCreate}
                                            disabled={selectedRows.length >= 2}
                                        >
                                            <AddCircleOutlineOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Import từ Excel">
                                        <IconButton
                                            sx={{ color: '#4caf50' }}
                                            onClick={() => setOpenImportDialog(true)}
                                            disabled={selectedRows.length >= 2}
                                        >
                                            <FileUploadOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>

                                    {/* ✅ Nút xóa nhiều - Chỉ hiện khi có chọn */}
                                    {selectedRows.length > 0 && (
                                        <Tooltip title={`Xóa ${selectedRows.length} thực phẩm đã chọn`}>
                                            <IconButton color="error" onClick={handleDeleteMany}>
                                                <DeleteOutlineOutlinedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        checkboxSelection={hasPermission(PERMISSIONS.ADMIN_DATA_BANK)} // ✅ Enable checkbox
                        disableColumnMenu
                        disableColumnSort
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[5, 10, 20, 50]}
                        getRowHeight={() => 'auto'}
                        // ✅ Handle selection change
                        rowSelectionModel={selectedRows}
                        onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-cell': {
                                py: 1,
                                display: 'flex',
                                alignItems: 'center',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: '#f5f5f5',
                                fontWeight: 600,
                            },
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

            {/* Dialog */}
            <AdminFoodDialog
                open={openDialog}
                mode={dialogMode}
                food={currentFood}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />

            {/* Import Dialog */}
            <ImportFoodDialog
                open={openImportDialog}
                onClose={() => setOpenImportDialog(false)}
                onSuccess={fetchFoods}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default AdminFood;
