import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    TextField,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeopleIcon from '@mui/icons-material/People';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenAttendanceApi, academicYearApi, scheduleApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import ChildrenAttendanceDialog from './ChildrenAttendanceDialog';
import BulkAttendanceDialog from './BulkAttendanceDialog';

// Helper: trạng thái chip
const getStatusChipProps = (status) => {
    switch (status) {
        case 'Có mặt':
            return { color: 'success', label: '✓', fullLabel: 'Có mặt' };
        case 'Vắng có phép':
            return { color: 'warning', label: 'P', fullLabel: 'Vắng có phép' };
        case 'Vắng không phép':
            return { color: 'error', label: 'K', fullLabel: 'Vắng không phép' };
        default:
            return { color: 'default', label: '-', fullLabel: 'Chưa điểm danh' };
    }
};

function ChildrenAttendance() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_ATTENDANCE);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_ATTENDANCE);

    // State
    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [searchText, setSearchText] = useState('');

    // ✅ Pagination
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Attendance data
    const [rows, setRows] = useState([]);
    const [weekDays, setWeekDays] = useState([]);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [openBulkDialog, setOpenBulkDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);
    const [bulkDialogData, setBulkDialogData] = useState(null);

    const isActiveYear = useMemo(() => {
        const y = academicYears.find((year) => year._id === selectedYear);
        return y?.status === 'active';
    }, [academicYears, selectedYear]);

    // ✅ Fetch academic years
    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data?.data?.academicYears || [];
            setAcademicYears(years);
            const activeYear = years.find((y) => y.status === 'active');
            if (activeYear) setSelectedYear((prev) => prev || activeYear._id);
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    // ✅ Fetch classes
    const fetchClasses = async (yearId) => {
        if (!yearId) {
            setClasses([]);
            setSelectedClass('');
            return;
        }
        try {
            setLoading(true);
            const res = await childrenAttendanceApi.getAccessibleClasses(yearId);
            const classList = res.data?.data?.classes || [];
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
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch schedule + holidays + weeks
    const fetchSchedule = async (yearId) => {
        if (!yearId) {
            setWeeks([]);
            setSelectedWeek('');
            setHolidays([]);
            return;
        }
        try {
            const res = await scheduleApi.getByAcademicYear(yearId);
            const schedule = res.data?.data;
            if (!schedule) {
                setWeeks([]);
                setSelectedWeek('');
                setHolidays([]);
                return;
            }

            const weeksData = schedule.weeks || [];
            setWeeks(weeksData);

            const holidayRes = await scheduleApi.getHolidays(schedule._id);
            const holidayList = holidayRes.data?.data?.holidays || [];
            const normalized = holidayList.map((h) => dayjs(h).format('YYYY-MM-DD'));
            setHolidays(normalized);

            // ✅ TỰ ĐỘNG CHỌN TUẦN HIỆN TẠI (BAO GỒM CẢ T7 VÀ CN)
            if (weeksData.length > 0) {
                const today = dayjs();

                const currentWeek = weeksData.find((w) => {
                    const start = dayjs(w.startDate).startOf('day');
                    // Tính toán: Thứ 2 (startDate) cộng thêm 6 ngày để ra hết ngày Chủ Nhật
                    const endOfSunday = start.add(6, 'day').endOf('day');

                    // Kiểm tra nếu hôm nay nằm trong khoảng từ Thứ 2 đến hết Chủ Nhật
                    return today.isSameOrAfter(start) && today.isSameOrBefore(endOfSunday);
                });

                if (currentWeek) {
                    setSelectedWeek(currentWeek.weekNumber.toString());
                } else {
                    // Nếu không tìm thấy (đang nghỉ hè hoặc ngoài năm học), mặc định chọn tuần đầu tiên
                    setSelectedWeek(weeksData[0].weekNumber.toString());
                }
            } else {
                setSelectedWeek('');
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setWeeks([]);
            setSelectedWeek('');
            setHolidays([]);
        }
    };

    // ✅ Check holiday
    const isHoliday = (date) => {
        if (!date) return false;
        const key = dayjs(date).format('YYYY-MM-DD');
        return holidays.includes(key);
    };

    // ✅ Fetch attendance data (CÓ PHÂN TRANG)
    const fetchAttendanceData = async () => {
        if (!selectedYear || !selectedClass || !selectedWeek) return;
        try {
            setLoading(true);
            const res = await childrenAttendanceApi.getAttendanceByClass({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: searchText,
            });

            const { days = [], students = [], attendanceMap = {}, totals = {}, pagination } = res.data?.data || {};

            const weekDayObjs = (days || []).map((d) => ({
                date: d,
                dayOfWeek: dayjs(d).format('dddd'),
            }));

            const mappedRows = students.map((s, index) => ({
                id: s.studentId,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                studentId: s.studentId,
                fullName: s.fullName,
                studentCode: s.studentCode,
                managementStatus: s.managementStatus,
                absentInWeek: totals?.[s.studentId]?.absentInWeek || 0,
                absentInYear: totals?.[s.studentId]?.absentInYear || 0,
                attendanceMap: attendanceMap[s.studentId] || {},
            }));

            setWeekDays(weekDayObjs);
            setRows(mappedRows);
            setTotalRows(pagination.totalItems);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            if (error?.response?.status !== 404) toast.error('Lỗi khi tải dữ liệu điểm danh!');
            setWeekDays([]);
            setRows([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handlers
    const handleCellClick = (student, dayObj) => {
        if (!isActiveYear || !canUpdate) return;
        if (isHoliday(dayObj.date)) {
            toast.warning('Không thể điểm danh cho ngày nghỉ!');
            return;
        }
        if (student.managementStatus !== 'Đang học') {
            toast.warning('Chỉ học sinh đang học mới được điểm danh!');
            return;
        }
        const existing = student.attendanceMap[dayObj.date];
        setDialogData({
            studentInfo: student,
            academicYearId: selectedYear,
            classId: selectedClass,
            date: dayObj.date,
            existingAttendance: existing,
        });
        setOpenDialog(true);
    };

    const handleBulkAttendance = (dayObj) => {
        if (!isActiveYear || !canCreate) return;
        if (isHoliday(dayObj.date)) {
            toast.warning('Không thể điểm danh hàng loạt cho ngày nghỉ!');
            return;
        }
        setBulkDialogData({
            academicYearId: selectedYear,
            classId: selectedClass,
            students: rows,
            date: dayObj.date,
        });
        setOpenBulkDialog(true);
    };

    const formatWeekDisplay = (week) => {
        if (!week?.startDate || !week?.endDate) return `Tuần ${week.weekNumber}`;
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // ✅ Effects
    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedYear) {
            setClasses([]);
            setWeeks([]);
            setHolidays([]);
            setSelectedClass('');
            setSelectedWeek('');
            setWeekDays([]);
            setRows([]);
            return;
        }
        setSelectedClass('');
        setSelectedWeek('');
        setWeekDays([]);
        setRows([]);
        fetchClasses(selectedYear);
        fetchSchedule(selectedYear);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek && weeks.length > 0) {
            fetchAttendanceData();
        } else {
            setRows([]);
            setWeekDays([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedClass, selectedWeek, selectedYear, searchText]);

    // ✅ DataGrid columns
    const columns = [
        { field: 'stt', headerName: 'STT', width: 60, sortable: false },
        {
            field: 'fullName',
            headerName: 'Họ tên học sinh',
            flex: 1,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>,
        },
        { field: 'studentCode', headerName: 'Mã học sinh', flex: 0.8, minWidth: 120, sortable: false },
        {
            field: 'absentInWeek',
            headerName: 'Vắng trong tuần',
            flex: 0.5,
            minWidth: 140,
            align: 'center',
            sortable: false,
            headerClassName: 'absent-week-header',
            cellClassName: 'absent-week-cell',
            renderCell: (params) => (
                <Chip label={`${params.value} ngày`} color="default" size="small" sx={{ fontWeight: 700 }} />
            ),
        },
        // ✅ Dynamic columns cho từng ngày trong tuần
        ...weekDays.map((day) => ({
            field: `day_${day.date}`,
            headerName: `${day.dayOfWeek} (${dayjs(day.date).format('DD/MM')})`,
            flex: 0.6,
            minWidth: 140,
            align: 'center',
            sortable: false,
            renderHeader: () => (
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" fontWeight={600}>
                        {day.dayOfWeek} ({dayjs(day.date).format('DD/MM')})
                    </Typography>
                    {!isHoliday(day.date) && canCreate && isActiveYear && (
                        <Tooltip title="Điểm danh hàng loạt">
                            <IconButton size="small" color="info" onClick={() => handleBulkAttendance(day)}>
                                <FactCheckOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
            renderCell: (params) => {
                const holiday = isHoliday(day.date);
                const att = params.row.attendanceMap[day.date];
                const chipProps = getStatusChipProps(att?.status);
                // ✅ BUILD TOOLTIP CONTENT
                const tooltipContent = (
                    <Box>
                        {/* Trạng thái */}
                        <Typography variant="caption" fontWeight={600} display="block">
                            {chipProps.fullLabel}
                        </Typography>
                        {/* Ghi chú (nếu có) */}
                        {att?.note && (
                            <Typography
                                variant="caption"
                                sx={{ mt: 0.5, display: 'block', whiteSpace: 'pre-line', color: '#e0e0e0' }}
                            >
                                <strong>Ghi chú:</strong> {att.note}
                            </Typography>
                        )}
                    </Box>
                );
                return (
                    <Box
                        sx={{
                            cursor: isActiveYear && !holiday ? 'pointer' : 'not-allowed',
                            bgcolor: holiday ? '#ffebee' : 'inherit',
                        }}
                        onClick={() => handleCellClick(params.row, day)}
                    >
                        {holiday ? (
                            <Chip label="Ngày Nghỉ" color="error" size="small" />
                        ) : att ? (
                            <Tooltip
                                title={tooltipContent}
                                arrow
                                slotProps={{
                                    tooltip: {
                                        sx: {
                                            maxWidth: 300,
                                            bgcolor: '#1e293b',
                                            color: '#f1f5f9',
                                            borderRadius: 2,
                                            border: '1px solid #334155',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        },
                                    },
                                }}
                            >
                                {' '}
                                <Chip
                                    label={chipProps.label}
                                    color={chipProps.color}
                                    size="small"
                                    sx={{ fontWeight: 700 }}
                                />
                            </Tooltip>
                        ) : (
                            <Chip label={chipProps.label} color={chipProps.color} size="small" />
                        )}
                    </Box>
                );
            },
        })),
        {
            field: 'absentInYear',
            headerName: 'Vắng trong năm',
            flex: 0.5,
            minWidth: 140,
            sortable: false,
            align: 'center',
            headerClassName: 'absent-year-header',
            cellClassName: 'absent-year-cell',
            renderCell: (params) => (
                <Chip label={`${params.value} ngày`} color="default" size="small" sx={{ fontWeight: 700 }} />
            ),
        },
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' }, { text: 'Điểm danh trẻ em' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Điểm danh trẻ em
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã HS..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 200 }}
                            />

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

                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Lớp học</InputLabel>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    label="Lớp học"
                                    disabled={classes.length === 0}
                                >
                                    {classes.map((cls) => (
                                        <MenuItem key={cls._id} value={cls._id}>
                                            {cls.name} - ({cls.ageGroup})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Tuần</InputLabel>
                                <Select
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    label="Tuần"
                                    disabled={weeks.length === 0}
                                >
                                    {weeks.map((w) => (
                                        <MenuItem key={w.weekNumber} value={w.weekNumber.toString()}>
                                            {formatWeekDisplay(w)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Warning */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 1 }}>
                            {isActiveYear ? (
                                <strong>Năm học đang hoạt động - Có thể điểm danh</strong>
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

                    {/* DataGrid */}
                    {!selectedYear || !selectedClass || !selectedWeek ? (
                        <Alert severity="info">Vui lòng chọn năm học, lớp học và tuần để xem điểm danh.</Alert>
                    ) : weekDays.length === 0 ? (
                        <Alert severity="warning">Tuần này chưa có lịch học (Thứ 2-6).</Alert>
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
                            sx={{
                                // ===== HEADER =====
                                '& .absent-week-header': {
                                    backgroundColor: '#fce4ec', // cam nhạt
                                },
                                '& .absent-year-header': {
                                    backgroundColor: '#fce4ec', // hồng nhạt
                                },

                                // ===== CELL =====
                                '& .absent-week-cell': {
                                    backgroundColor: '#f6ebf1ff',
                                },
                                '& .absent-year-cell': {
                                    backgroundColor: '#f6ebf1ff',
                                },

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
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                        }}
                                    >
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
                    {weekDays.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Chip label="✓ Có mặt" color="success" size="small" />
                            <Chip label="- Chưa điểm danh" color="default" size="small" />
                            <Chip label="P Vắng có phép" color="warning" size="small" />
                            <Chip label="K Vắng không phép" color="error" size="small" />
                        </Box>
                    )}
                </Paper>
            </PageContainer>

            {/* Dialogs */}
            {dialogData && (
                <ChildrenAttendanceDialog
                    open={openDialog}
                    studentInfo={dialogData.studentInfo}
                    classId={dialogData.classId}
                    academicYearId={dialogData.academicYearId}
                    date={dialogData.date}
                    existingAttendance={dialogData.existingAttendance}
                    onClose={() => setOpenDialog(false)}
                    onSuccess={fetchAttendanceData}
                />
            )}

            {bulkDialogData && (
                <BulkAttendanceDialog
                    open={openBulkDialog}
                    classId={bulkDialogData.classId}
                    academicYearId={bulkDialogData.academicYearId}
                    students={bulkDialogData.students}
                    date={bulkDialogData.date}
                    onClose={() => setOpenBulkDialog(false)}
                    onSuccess={fetchAttendanceData}
                />
            )}
        </MainLayout>
    );
}

export default ChildrenAttendance;
