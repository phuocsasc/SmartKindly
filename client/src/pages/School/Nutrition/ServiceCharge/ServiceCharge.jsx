// client/src/pages/School/Nutrition/ServiceCharge/ServiceCharge.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, TextField, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import SearchIcon from '@mui/icons-material/Search';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { schoolServiceChargeApi } from '~/apis';
import { toast } from 'react-toastify';
import ServiceChargeDialog from './ServiceChargeDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';
import dayjs from '~/config/dayjsConfig';

function ServiceCharge() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [currentCharge, setCurrentCharge] = useState(null);

    // Fetch service charges
    const fetchServiceCharges = async () => {
        try {
            setLoading(true);
            const response = await schoolServiceChargeApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: searchText,
            });

            const data = response.data.data;
            const formattedRows = data.serviceCharges.map((charge, index) => ({
                id: charge._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                serviceName: charge.serviceName,
                amount: charge.amount,
                description: charge.description || '—',
                createdAt: charge.createdAt,
                updatedAt: charge.updatedAt,
                ...charge,
            }));

            setRows(formattedRows);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            console.error('Error fetching service charges:', error);
            toast.error('Lỗi khi tải danh sách tiền dịch vụ!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchServiceCharges();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText, paginationModel]);

    // Calculate total amount
    const totalAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);

    // Handlers
    const handleCreate = () => {
        setDialogMode('create');
        setCurrentCharge(null);
        setOpenDialog(true);
    };

    const handleEdit = (charge) => {
        setDialogMode('edit');
        setCurrentCharge(charge);
        setOpenDialog(true);
    };

    const handleDelete = async (id, serviceName) => {
        try {
            await showConfirm({
                title: 'Xác nhận xóa tiền dịch vụ',
                message: `Bạn có chắc chắn muốn xóa dịch vụ "${serviceName}"? Hành động này không thể hoàn tác.`,
                severity: 'error',
                confirmText: 'Xóa',
                onConfirm: async () => {
                    await schoolServiceChargeApi.delete(id);
                    toast.success('Xóa tiền dịch vụ thành công!');
                    fetchServiceCharges();
                },
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa tiền dịch vụ!');
        }
    };

    const handleDialogClose = () => {
        setOpenDialog(false);
        setCurrentCharge(null);
    };

    const handleDialogSuccess = () => {
        fetchServiceCharges();
        handleDialogClose();
    };

    // Format datetime
    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        return dayjs(dateString).format('HH:mm:ss | DD/MM/YYYY');
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'serviceName',
            headerName: 'Tên dịch vụ',
            flex: 1,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 600, color: '#1976d2', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'amount',
            headerName: 'Tiền dịch vụ / 1 trẻ',
            width: 250,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 600 }}>
                    {params.value.toLocaleString('vi-VN')} VND
                </Typography>
            ),
        },
        {
            field: 'description',
            headerName: 'Mô tả',
            flex: 0.8,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    color="text.secondary"
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
            field: 'createdAt',
            headerName: 'Thời gian tạo',
            width: 180,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {formatDateTime(params.value)}
                </Typography>
            ),
        },
        {
            field: 'updatedAt',
            headerName: 'Thời gian sửa',
            width: 180,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {formatDateTime(params.value)}
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
                    {hasPermission(PERMISSIONS.UPDATE_SERVICE_CHARGE) && (
                        <Tooltip title="Sửa">
                            <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {hasPermission(PERMISSIONS.DELETE_SERVICE_CHARGE) && (
                        <Tooltip title="Xóa">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(params.row.id, params.row.serviceName)}
                            >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Dinh dưỡng', icon: RestaurantOutlinedIcon, href: '#' }, { text: 'Tiền dịch vụ' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách tiền dịch vụ
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            {/* Search */}
                            <TextField
                                placeholder="Tìm kiếm tên dịch vụ..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                size="small"
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5 }} />,
                                }}
                                sx={{
                                    minWidth: 250,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        '&:hover fieldset': { borderColor: '#0071bc' },
                                        '&.Mui-focused fieldset': { borderColor: '#0071bc' },
                                    },
                                }}
                            />

                            {/* Add button */}
                            {hasPermission(PERMISSIONS.CREATE_SERVICE_CHARGE) && (
                                <Tooltip title="Thêm tiền dịch vụ">
                                    <IconButton sx={{ color: '#1976d2' }} onClick={handleCreate}>
                                        <AddCircleOutlineOutlinedIcon />
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
                                    <Typography>Chưa có tiền dịch vụ nào!</Typography>
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
                {/* ✅ TỔNG TIỀN - HIỂN THỊ KHI CÓ >= 2 DỊCH VỤ */}
                {rows.length >= 2 && (
                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            bgcolor: '#fff3e0',
                            borderRadius: 2,
                            border: '2px solid #ffb74d',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="h7" fontWeight={700} color="warning.main">
                            TỔNG TIỀN DỊCH VỤ / 1 TRẺ:
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="error">
                            {totalAmount.toLocaleString('vi-VN')} VNĐ
                        </Typography>
                    </Box>
                )}
            </PageContainer>

            {/* Dialog */}
            <ServiceChargeDialog
                open={openDialog}
                mode={dialogMode}
                charge={currentCharge}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default ServiceCharge;
