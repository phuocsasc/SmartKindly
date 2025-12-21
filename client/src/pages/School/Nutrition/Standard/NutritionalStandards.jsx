// client/src/pages/School/Nutrition/Standard/NutritionalStandards.jsx

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { schoolNutritionalStandardApi } from '~/apis';
import { toast } from 'react-toastify';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';

function NutritionalStandards() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    // State
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);
    const [needSync, setNeedSync] = useState(false);

    // Fetch standards
    const fetchStandards = async () => {
        try {
            setLoading(true);
            const response = await schoolNutritionalStandardApi.getAll({
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });

            const data = response.data.data;
            const formattedRows = data.standards.map((standard, index) => ({
                id: standard._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                ageGroup: standard.ageGroup,
                plgStructure: standard.plgStructure,
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
            setNeedSync(false);
        } catch (error) {
            console.error('Error fetching standards:', error);
            toast.error('Lỗi khi tải danh sách định mức dinh dưỡng!');
        } finally {
            setLoading(false);
        }
    };

    // Check and sync on mount
    useEffect(() => {
        const checkSync = async () => {
            try {
                const response = await schoolNutritionalStandardApi.checkAndSync();
                if (response.data.synced) {
                    setNeedSync(true);
                    toast.success(response.data.message);
                }
            } catch (error) {
                console.error('Error checking sync:', error);
            }
        };

        checkSync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchStandards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel]);

    // Manual sync (chỉ BGH)
    const handleManualSync = async () => {
        try {
            setSyncing(true);
            const response = await schoolNutritionalStandardApi.forceSync();
            toast.success(response.data.message);
            setNeedSync(true);
            fetchStandards();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi đồng bộ định mức dinh dưỡng!');
        } finally {
            setSyncing(false);
        }
    };

    // Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false, align: 'center', headerAlign: 'center' },
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
            width: 250,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: '#000000ff', fontWeight: 600 }}>
                    {params.row.recommendedCaloriesMin} - {params.row.recommendedCaloriesMax} kcal
                </Typography>
            ),
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Dinh dưỡng', icon: RestaurantOutlinedIcon, href: '#' },
                        { text: 'Định mức dinh dưỡng' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Sync Alert */}
                    {needSync && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Danh sách định mức dinh dưỡng đã được đồng bộ từ ngân hàng dữ liệu
                        </Alert>
                    )}

                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Danh sách định mức dinh dưỡng
                        </Typography>

                        {/* ✅ Nút đồng bộ - Chỉ BGH */}
                        {hasPermission(PERMISSIONS.UPDATE_SCHOOL_INFO) && (
                            <Tooltip title="Đồng bộ từ ngân hàng dữ liệu">
                                <IconButton sx={{ color: '#1976d2' }} onClick={handleManualSync} disabled={syncing}>
                                    {syncing ? <CircularProgress size={24} /> : <SyncIcon />}
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
        </MainLayout>
    );
}

export default NutritionalStandards;
