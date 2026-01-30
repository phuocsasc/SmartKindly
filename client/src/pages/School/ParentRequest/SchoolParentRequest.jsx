// client/src/pages/School/ParentRequest/SchoolParentRequest.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Alert,
    Chip,
    Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EditOutlined as EditIcon, DoneOutlined as DoneIcon } from '@mui/icons-material';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { parentRequestApi, academicYearApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import SchoolParentRequestDialog from './SchoolParentRequestDialog';

function SchoolParentRequest() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    // State
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);

    const isActiveYear = selectedYear === activeYearId;
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_PARENT_REQUEST);

    // ✅ Initialize
    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch classes when year changes
    useEffect(() => {
        if (selectedYear) {
            fetchAccessibleClasses();
        } else {
            setClasses([]);
            setSelectedClass('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Fetch requests when filters change
    useEffect(() => {
        if (selectedYear && selectedClass) {
            fetchRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedYear, selectedClass, filterStatus]);

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
            console.error('❌ Error fetching academic years:', error);
            toast.error('Không thể tải danh sách năm học');
        }
    };

    const fetchAccessibleClasses = async () => {
        try {
            const res = await parentRequestApi.getAccessibleClasses(selectedYear);
            const classList = res.data.data.classes || [];
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClass(classList[0]._id);
            } else {
                setSelectedClass('');
            }
        } catch (error) {
            console.error('❌ Error fetching classes:', error);
            toast.error('Không thể tải danh sách lớp học');
            setClasses([]);
            setSelectedClass('');
        }
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                academicYearId: selectedYear,
                classId: selectedClass,
                status: filterStatus,
            };

            const res = await parentRequestApi.getAll(params);
            const data = res.data.data;

            const requests = data.items.map((item, index) => ({
                id: item._id,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                requestName: item.requestName,
                fromDate: item.fromDate,
                toDate: item.toDate,
                parentNote: item.parentNote,
                teacherReply: item.teacherReply,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                studentName: item.studentId?.fullName || 'N/A',
                studentCode: item.studentId?.studentCode || 'N/A',
                className: item.classId?.name || 'N/A',
                createdByName: item.createdBy?.fullName || 'N/A',
            }));

            setRows(requests);
            setTotalRows(data.pagination.totalItems);
        } catch (error) {
            console.error('❌ Error fetching requests:', error);
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách phiếu dặn dò');
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (newYearId) => {
        setSelectedYear(newYearId);
        setSelectedClass('');
        setClasses([]);
        setRows([]);
    };

    const handleEdit = async (id) => {
        try {
            const res = await parentRequestApi.getDetails(id);
            setCurrentRequest(res.data.data);
            setOpenDialog(true);
        } catch (error) {
            toast.error('Không thể tải thông tin phiếu dặn dò');
        }
    };

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'Chờ duyệt':
                return { color: 'warning', label: 'Chờ duyệt' };
            case 'Đã duyệt':
                return { color: 'success', label: 'Đã duyệt' };
            case 'Từ chối':
                return { color: 'error', label: 'Từ chối' };
            default:
                return { color: 'default', label: status };
        }
    };

    // ✅ Columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false, align: 'center' },
        {
            field: 'studentInfo',
            headerName: 'Học sinh',
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {params.row.studentName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.studentCode}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'requestName',
            headerName: 'Tên phiếu',
            flex: 1,
            minWidth: 180,
            sortable: false,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'dateRange',
            headerName: 'Ngày áp dụng',
            flex: 0.8,
            minWidth: 160,
            sortable: false,
            align: 'center',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                    <Chip
                        label={`Từ: ${dayjs(params.row.fromDate).format('DD/MM/YYYY')}`}
                        size="small"
                        sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontSize: '0.75rem' }}
                    />
                    <Chip
                        label={`Đến: ${dayjs(params.row.toDate).format('DD/MM/YYYY')}`}
                        size="small"
                        sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontSize: '0.75rem' }}
                    />
                </Box>
            ),
        },
        {
            field: 'parentNote',
            headerName: 'Dặn dò từ phụ huynh',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'pre-line',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'teacherReply',
            headerName: 'Phản hồi từ giáo viên',
            flex: 1.5,
            minWidth: 200,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'pre-line',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        color: params.value ? 'text.primary' : 'text.disabled',
                        fontStyle: params.value ? 'normal' : 'italic',
                    }}
                >
                    {params.value || 'Chưa có phản hồi'}
                </Typography>
            ),
        },
        {
            field: 'status',
            headerName: 'Trạng thái',
            width: 110,
            sortable: false,
            align: 'center',
            renderCell: (params) => {
                const props = getStatusChipProps(params.value);
                return <Chip {...props} size="small" sx={{ fontWeight: 400 }} />;
            },
        },
        {
            field: 'createdAt',
            headerName: 'Ngày tạo',
            width: 110,
            sortable: false,
            renderCell: (params) => dayjs(params.value).format('DD/MM/YYYY'),
        },
        {
            field: 'updatedAt',
            headerName: 'Ngày sửa',
            width: 110,
            sortable: false,
            renderCell: (params) =>
                params.value
                    ? dayjs(params.value).format('DD/MM/YYYY')
                    : dayjs(params.row.createdAt).format('DD/MM/YYYY'),
        },
        {
            field: 'actions',
            headerName: 'Thao tác',
            width: 90,
            sortable: false,
            align: 'center',
            renderCell: (params) => {
                const canEdit = canUpdate && isActiveYear;

                return (
                    <Tooltip title={canEdit ? 'Phản hồi phiếu' : 'Chỉ phản hồi được trong năm học đang hoạt động'}>
                        <span>
                            <IconButton
                                size="small"
                                color="primary"
                                disabled={!canEdit}
                                onClick={() => handleEdit(params.row.id)}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Phiếu dặn dò' }]} />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    {/* Header */}
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Danh sách phiếu dặn dò
                    </Typography>

                    {/* Filters */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                        {/* Select Năm học */}
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
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
                                                {year._id === activeYearId && (
                                                    <DoneIcon color="success" fontSize="small" />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Select Lớp học */}
                        {classes.length > 0 && (
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
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
                            </Grid>
                        )}

                        {/* Select Trạng thái */}
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Trạng thái</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Trạng thái"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    <MenuItem value="Chờ duyệt">Chờ duyệt</MenuItem>
                                    <MenuItem value="Đã duyệt">Đã duyệt</MenuItem>
                                    <MenuItem value="Từ chối">Từ chối</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Alert */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 2 }}>
                            {isActiveYear ? (
                                <>
                                    <strong>Năm học đang hoạt động</strong>
                                </>
                            ) : (
                                <>
                                    <strong>Năm học đã kết thúc</strong> - Chỉ có thể xem dữ liệu
                                </>
                            )}
                        </Alert>
                    )}

                    {classes.length === 0 && selectedYear && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
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
            {currentRequest && (
                <SchoolParentRequestDialog
                    open={openDialog}
                    requestData={currentRequest}
                    onClose={() => setOpenDialog(false)}
                    onSuccess={() => {
                        setOpenDialog(false);
                        fetchRequests();
                    }}
                />
            )}
        </MainLayout>
    );
}

export default SchoolParentRequest;
