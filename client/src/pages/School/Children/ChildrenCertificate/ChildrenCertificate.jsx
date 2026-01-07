// client/src/pages/School/Children/ChildrenCertificate/ChildrenCertificate.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenCertificateApi, academicYearApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import ChildrenCertificateDialog from './ChildrenCertificateDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import HoaBeNgon from '/hoa_be_ngoan.png';

function ChildrenCertificate() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    // State
    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [searchText, setSearchText] = useState('');

    // ✅ DataGrid state
    const [rows, setRows] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);

    // Confirm dialog
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    const isActiveYear = selectedYear === activeYearId;
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_CERTIFICATE);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_CERTIFICATE);
    const canDelete = hasPermission(PERMISSIONS.DELETE_CHILDREN_CERTIFICATE);

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

    // ✅ Fetch classes
    const fetchClasses = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenCertificateApi.getAccessibleClasses(selectedYear);
            const classList = res.data.data.classes;
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClass(classList[0]._id);
            } else {
                setSelectedClass('');
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
            setClasses([]);
            setSelectedClass('');
        }
    };

    // ✅ Fetch valid weeks
    const fetchValidWeeks = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenCertificateApi.getValidWeeks(selectedYear);
            const weeksData = res.data.data.weeks;
            setWeeks(weeksData);

            if (weeksData.length > 0) {
                setSelectedWeek(weeksData[0].weekNumber.toString());
            } else {
                setSelectedWeek('');
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            if (error?.response?.status !== 404 && error?.response?.status !== 500) {
                toast.error('Lỗi khi tải danh sách tuần!');
            }
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    // ✅ Fetch certificate data with pagination
    const fetchCertificateData = async () => {
        if (!selectedYear || !selectedClass || !selectedWeek) return;

        try {
            setLoading(true);

            const res = await childrenCertificateApi.getAll({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
                search: searchText,
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
            });

            const { students, pagination } = res.data.data;

            // ✅ Map to DataGrid rows
            const mappedRows = students.map((student, index) => ({
                id: student.studentId,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                studentId: student.studentId,
                fullName: student.fullName,
                studentCode: student.studentCode,
                managementStatus: student.managementStatus,
                certificate: student.certificate,
                isGoodChild: student.certificate?.isGoodChild || false,
                comment: student.certificate?.comment || '',
                createdAt: student.certificate?.createdAt || null, // ✅ ADD
                updatedAt: student.certificate?.updatedAt || null, // ✅ ADD
            }));

            setRows(mappedRows);
            setTotalRows(pagination.totalItems);

            console.log('✅ [fetchCertificateData] Loaded:', {
                studentsCount: mappedRows.length,
                totalItems: pagination.totalItems,
                page: pagination.page,
            });
        } catch (error) {
            console.error('❌ [fetchCertificateData] Error:', error);

            if (error?.response?.status !== 404) {
                toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu phiếu bé ngoan!');
            }

            setRows([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Load initial data
    useEffect(() => {
        fetchAcademicYears();
    }, []);

    // ✅ When year changes: reload classes and weeks
    useEffect(() => {
        if (selectedYear) {
            setSelectedClass('');
            setSelectedWeek('');
            setRows([]);

            fetchClasses();
            fetchValidWeeks();
        } else {
            setClasses([]);
            setWeeks([]);
            setSelectedClass('');
            setSelectedWeek('');
            setRows([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ When class/week/search/pagination changes: reload data
    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek && classes.length > 0) {
            const classExists = classes.some((cls) => cls._id === selectedClass);
            if (!classExists) {
                console.log('⚠️  Selected class not in loaded classes');
                return;
            }

            fetchCertificateData();
        } else {
            setRows([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedClass, selectedWeek, searchText, paginationModel, classes]);

    // ✅ Format week label
    const formatWeekLabel = (week) => {
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // ✅ Handle edit/create certificate
    const handleEdit = (row) => {
        if (!isActiveYear && !canUpdate) return;

        setDialogData({
            studentInfo: {
                _id: row.studentId,
                fullName: row.fullName,
                studentCode: row.studentCode,
            },
            classId: selectedClass,
            academicYearId: selectedYear,
            weekNumber: parseInt(selectedWeek),
            existingCertificate: row.certificate,
        });
        setOpenDialog(true);
    };

    // ✅ Handle delete certificate
    const handleDelete = (row) => {
        if (!row.certificate) return;

        showConfirm({
            title: 'Xác nhận xóa phiếu bé ngoan',
            message: `Bạn có chắc chắn muốn xóa phiếu bé ngoan của bé "${row.fullName}" trong tuần ${selectedWeek}?`,
            severity: 'error',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                    await childrenCertificateApi.delete(row.certificate._id);
                    toast.success('Xóa phiếu bé ngoan thành công!');
                    fetchCertificateData();
                } catch (error) {
                    console.error('Error deleting certificate:', error);
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa phiếu bé ngoan!');
                }
            },
        });
    };

    // ✅ Format date time
    const formatDateTime = (dateTime) => {
        if (!dateTime) return '---';
        const date = dayjs(dateTime).format('DD/MM/YYYY');
        const time = dayjs(dateTime).format('HH:mm:ss');
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                <Typography variant="body2" fontWeight={600}>
                    {time}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {date}
                </Typography>
            </Box>
        );
    };

    // ✅ DataGrid columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'fullName',
            headerName: 'Họ tên học sinh',
            flex: 1,
            minWidth: 150,
            sortable: false,
            renderCell: (params) => <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>,
        },
        { field: 'studentCode', headerName: 'Mã học sinh', flex: 0.6, minWidth: 100, sortable: false },
        {
            field: 'isGoodChild',
            headerName: 'Hoa bé ngoan',
            flex: 0.6,
            minWidth: 100,
            sortable: false,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        cursor: isActiveYear && canCreate ? 'pointer' : 'default',
                    }}
                    onClick={() => isActiveYear && canCreate && handleEdit(params.row)}
                >
                    {/* THAY ĐỔI TẠI ĐÂY: Dùng thẻ Box component="img" để hiển thị ảnh PNG */}
                    <Box
                        component="img"
                        src={HoaBeNgon}
                        alt="Hoa bé ngoan"
                        sx={{
                            width: 52, // Kích thước ảnh (tương đương fontSize 32px cũ)
                            height: 52,
                            borderRadius: 2,
                            objectFit: 'contain',
                            // Logic xử lý hiển thị:
                            // Nếu có phiếu (params.value = true) -> opacity 1 (rõ nét)
                            // Nếu chưa có (params.value = false) -> opacity 0.3 (mờ đi)
                            opacity: params.value ? 1 : 0.3,
                            // Thêm grayscale nếu muốn ảnh chưa chọn bị xám màu (tùy chọn)
                            filter: params.value ? 'none' : 'grayscale(100%)',
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: isActiveYear && canCreate ? 'scale(1.2)' : 'none',
                                // Khi hover vào ô chưa chọn, có thể cho rõ lên 1 chút để user biết có thể click
                                opacity: isActiveYear && canCreate ? 1 : params.value ? 1 : 0.3,
                                // filter: 'none',
                            },
                        }}
                    />
                </Box>
            ),
        },
        {
            field: 'comment',
            headerName: 'Nhận xét của giáo viên',
            flex: 1.7,
            minWidth: 280,
            sortable: false,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                        color: params.value ? '#000' : '#757575',
                    }}
                >
                    {params.value || 'Chưa có nhận xét'}
                </Typography>
            ),
        },
        // ✅ ADD: Ngày tạo
        {
            field: 'createdAt',
            headerName: 'Ngày tạo',
            flex: 0.6,
            minWidth: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => formatDateTime(params.value),
        },
        // ✅ ADD: Ngày sửa
        {
            field: 'updatedAt',
            headerName: 'Ngày sửa',
            flex: 0.6,
            minWidth: 100,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => formatDateTime(params.value),
        },
    ];

    // ✅ Add actions column if user has permission
    if (isActiveYear && (canCreate || canUpdate || canDelete)) {
        columns.push({
            field: 'actions',
            headerName: 'Thao tác',
            flex: 0.4,
            minWidth: 80,
            sortable: false,
            align: 'center',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {(canCreate || canUpdate) && (
                        <Tooltip title={params.row.certificate ? 'Chỉnh sửa phiếu' : 'Thêm phiếu mới'}>
                            <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {canDelete && params.row.certificate && (
                        <Tooltip title="Xóa phiếu">
                            <IconButton size="small" color="error" onClick={() => handleDelete(params.row)}>
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
        });
    }

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' }, { text: 'Phiếu bé ngoan' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Phiếu bé ngoan hằng tuần
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Search */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã HS..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 200 }}
                            />

                            {/* Academic Year */}
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
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

                            {/* Class */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Lớp học</InputLabel>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    label="Lớp học"
                                    disabled={classes.length === 0}
                                >
                                    {classes.map((cls) => (
                                        <MenuItem key={cls._id} value={cls._id}>
                                            {cls.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Week */}
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Tuần</InputLabel>
                                <Select
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    label="Tuần"
                                    disabled={weeks.length === 0}
                                >
                                    {weeks.map((week) => (
                                        <MenuItem key={week.weekNumber} value={week.weekNumber.toString()}>
                                            {formatWeekLabel(week)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Active year indicator */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2 }}>
                            {isActiveYear ? (
                                <strong>Năm học đang hoạt động - Có thể đánh giá</strong>
                            ) : (
                                <strong>Năm học đã kết thúc - Chỉ xem dữ liệu</strong>
                            )}
                        </Alert>
                    )}

                    {/* No classes warning */}
                    {classes.length === 0 && selectedYear && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                            {user?.role === 'to_truong'
                                ? 'Bạn chưa được phân công quản lý khối nào trong năm học này.'
                                : user?.role === 'giao_vien'
                                  ? 'Bạn chưa được phân công làm giáo viên chủ nhiệm lớp nào.'
                                  : 'Chưa có lớp học nào.'}
                        </Alert>
                    )}

                    {/* No valid weeks warning */}
                    {weeks.length === 0 && selectedYear && selectedClass && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
                            Năm học này chưa có tuần hợp lệ (tất cả các tuần đều nghỉ thứ 2-6).
                        </Alert>
                    )}

                    {/* DataGrid */}
                    {!selectedYear || !selectedClass || !selectedWeek ? (
                        <Alert severity="info">Vui lòng chọn năm học, lớp học và tuần để xem phiếu bé ngoan.</Alert>
                    ) : (
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
                            slots={{
                                noRowsOverlay: () => (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography>Không có học sinh nào trong lớp này!</Typography>
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
                    )}

                    {/* Legend */}
                    {rows.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {/* Ảnh rõ nét */}
                                <Box component="img" src={HoaBeNgon} sx={{ width: 30, height: 30 }} />
                                <Typography variant="caption">Hoa bé ngoan</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {/* Ảnh mờ đi */}
                                <Box
                                    component="img"
                                    src={HoaBeNgon}
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        opacity: 0.3,
                                        filter: 'grayscale(100%)',
                                    }}
                                />
                                <Typography variant="caption">Chưa chọn/ Chưa đạt</Typography>
                            </Box>
                        </Box>
                    )}
                </Paper>
            </PageContainer>

            {/* Dialog đánh giá */}
            {dialogData && (
                <ChildrenCertificateDialog
                    open={openDialog}
                    studentInfo={dialogData.studentInfo}
                    classId={dialogData.classId}
                    academicYearId={dialogData.academicYearId}
                    weekNumber={dialogData.weekNumber}
                    existingCertificate={dialogData.existingCertificate}
                    onClose={() => setOpenDialog(false)}
                    onSuccess={fetchCertificateData}
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default ChildrenCertificate;
