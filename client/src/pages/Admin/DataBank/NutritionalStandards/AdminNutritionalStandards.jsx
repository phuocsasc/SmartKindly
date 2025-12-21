// client/src/pages/Admin/DataBank/NutritionalStandards/AdminNutritionalStandards.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import MainLayout from '~/layouts/AdminLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { nutritionalStandardApi } from '~/apis';
import { toast } from 'react-toastify';
import AdminNutritionalStandardsDialog from './AdminNutritionalStandardsDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';

function AdminNutritionalStandards() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentStandard, setCurrentStandard] = useState(null);

    // Fetch standards
    const fetchStandards = async () => {
        try {
            setLoading(true);
            const response = await nutritionalStandardApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });

            const data = response.data.data;
            const formattedRows = data.standards.map((standard, index) => ({
                id: standard._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                ageGroup: standard.ageGroup,
                protein: standard.protein,
                lipid: standard.lipid,
                glucid: standard.glucid,
                totalCalories: standard.totalCalories,
                recommendedCaloriesMin: standard.recommendedCaloriesMin,
                recommendedCaloriesMax: standard.recommendedCaloriesMax,
                ...standard,
            }));

            setRows(formattedRows);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching standards:', error);
            toast.error('Lỗi khi tải danh sách định mức dinh dưỡng!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStandards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel]);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentStandard(null);
        setOpenDialog(true);
    };

    const handleEdit = (standard) => {
        setDialogMode('edit');
        setCurrentStandard(standard);
        setOpenDialog(true);
    };

    const handleDelete = async (id, ageGroup) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa định mức dinh dưỡng',
                message: `Bạn có chắc chắn muốn xóa định mức dinh dưỡng cho "${ageGroup}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                onConfirm: async () => {
                    await nutritionalStandardApi.delete(id);
                    toast.success('Xóa định mức dinh dưỡng thành công!');
                    fetchStandards();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa định mức dinh dưỡng!');
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setCurrentStandard(null);
    };

    const handleDialogSuccess = () => {
        fetchStandards();
        handleDialogClose();
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'ageGroup',
            headerName: 'Tên nhóm trẻ',
            flex: 1,
            minWidth: 250,
            sortable: false,
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {params.value}
                </Typography>
            ),
        },
        // ✅ Cột Cơ cấu PLG chuẩn (hiển thị khoảng Từ - Đến)
        {
            field: 'plgStructure',
            headerName: 'Cơ cấu PLG chuẩn (%)',
            flex: 1,
            align: 'center',
            headerAlign: 'center',
            minWidth: 280,
            sortable: false,
            renderCell: (params) => {
                const plg = params.value;
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#251133ff', fontWeight: 600 }}>
                            Protein Đạm: {plg.proteinMin}% - {plg.proteinMax}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#251133ff', fontWeight: 600 }}>
                            Lipid Béo: {plg.lipidMin}% - {plg.lipidMax}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#251133ff', fontWeight: 600 }}>
                            Glucid Đường: {plg.glucidMin}% - {plg.glucidMax}%
                        </Typography>
                    </Box>
                );
            },
        },
        {
            field: 'protein',
            headerName: 'Protein Đạm (g)',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#5d2e7dff', fontWeight: 500 }}>
                    {params.value} g
                </Typography>
            ),
        },
        {
            field: 'lipid',
            headerName: 'Lipid Béo (g)',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#f57c00', fontWeight: 500 }}>
                    {params.value} g
                </Typography>
            ),
        },
        {
            field: 'glucid',
            headerName: 'Glucid Đường (g)',
            width: 150,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                    {params.value} g
                </Typography>
            ),
        },
        {
            field: 'totalCalories',
            headerName: 'Calo cả ngày (kcal)',
            width: 180,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#000000ff', fontWeight: 700 }}>
                    {params.value} kcal
                </Typography>
            ),
        },
        {
            field: 'recommendedCalories',
            headerName: 'Năng lượng khuyến nghị (kcal)',
            width: 240,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#000000ff', fontWeight: 600 }}>
                    {params.row.recommendedCaloriesMin} - {params.row.recommendedCaloriesMax} kcal
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 120,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {hasPermission(PERMISSIONS.ADMIN_DATA_BANK) && (
                        <>
                            <Tooltip title="Sửa">
                                <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
                                    <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(params.row.id, params.row.ageGroup)}
                                >
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Ngân hàng dữ liệu', icon: RestaurantOutlinedIcon, href: '#' },
                        { text: 'Định mức dinh dưỡng' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách định mức dinh dưỡng
                        </Typography>

                        {hasPermission(PERMISSIONS.ADMIN_DATA_BANK) && (
                            <Tooltip title="Thêm định mức dinh dưỡng">
                                <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                    <AddCircleOutlineOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* DataGrid */}
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        disableColumnMenu
                        disableColumnSort
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[5, 10, 20, 50]}
                        getRowHeight={() => 'auto'}
                        autoHeight
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
                            },
                            '& .MuiDataGrid-columnHeader': {
                                borderRight: '1px solid #bbdefb',
                                textAlign: 'center',
                            },
                            '& .MuiDataGrid-cell': {
                                borderRight: '1px solid #e0e0e0',
                                borderBottom: '1px solid #f0f0f0',
                                alignItems: 'center',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                color: '#000',
                                py: 1,
                            },
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                                outline: 'none',
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: '#f5faff',
                            },
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: 'none',
                        }}
                        slots={{
                            noRowsOverlay: () => (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography>Chưa có định mức dinh dưỡng nào!</Typography>
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
            <AdminNutritionalStandardsDialog
                open={openDialog}
                mode={dialogMode}
                standard={currentStandard}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default AdminNutritionalStandards;
