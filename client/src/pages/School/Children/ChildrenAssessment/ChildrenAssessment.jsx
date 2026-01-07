import { useState, useEffect } from 'react';
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
import EditIcon from '@mui/icons-material/Edit';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenDailyAssessmentApi, academicYearApi, scheduleApi, childrenAttendanceApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import ChildrenAssessmentDialog from './ChildrenAssessmentDialog';
import AssessmentCard from './AssessmentCard';

// ✅ Helper: Get attendance chip props
const getAttendanceChipProps = (status) => {
    switch (status) {
        case 'Có mặt':
            return { color: 'success', label: '✓' };
        case 'Vắng có phép':
            return { color: 'warning', label: 'P', name: 'Vắng có phép' };
        case 'Vắng không phép':
            return { color: 'error', label: 'K', name: 'Vắng không phép' };
        default:
            return { color: 'default', label: '-', name: 'Chưa điểm danh' };
    }
};

function ChildrenAssessment() {
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
    const [holidays, setHolidays] = useState([]);

    // Assessment data
    const [rows, setRows] = useState([]);
    const [weekDays, setWeekDays] = useState([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);

    const isActiveYear = selectedYear === activeYearId;
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_ASSESSMENT);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_ASSESSMENT);

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
            const res = await childrenDailyAssessmentApi.getAccessibleClasses(selectedYear);
            const classList = res.data.data.classes;
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClass(classList[0]._id);
            } else {
                setSelectedClass('');
                setRows([]);
                setWeekDays([]);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
            setClasses([]);
            setSelectedClass('');
        }
    };

    // ✅ Fetch weeks from schedule
    const fetchWeeks = async () => {
        if (!selectedYear) return;

        try {
            const scheduleRes = await scheduleApi.getByAcademicYear(selectedYear);
            const schedule = scheduleRes.data.data;

            if (!schedule) {
                setWeeks([]);
                setSelectedWeek('');
                return;
            }

            const weeksData = schedule.weeks || [];
            setWeeks(weeksData);

            if (weeksData.length > 0) {
                setSelectedWeek(weeksData[0].weekNumber.toString());
            } else {
                setSelectedWeek('');
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            if (error?.response?.status !== 404) {
                toast.error('Lỗi khi tải danh sách tuần!');
            }
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    // ✅ Fetch holidays
    const fetchHolidays = async () => {
        if (!selectedYear) return;

        try {
            const scheduleRes = await scheduleApi.getByAcademicYear(selectedYear);
            const schedule = scheduleRes.data.data;

            if (schedule) {
                const holidaysRes = await scheduleApi.getHolidays(schedule._id);
                setHolidays(holidaysRes.data.data.holidays || []);
            }
        } catch (error) {
            console.error('Error fetching holidays:', error);
            if (error?.response?.status !== 404) {
                toast.error('Lỗi khi tải danh sách ngày nghỉ!');
            }
        }
    };

    // ✅ Check if date is holiday
    const isHoliday = (date) => {
        if (!date) return false;
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    };

    // ✅ Fetch assessment data (CÓ PHÂN TRANG) - FIXED
    const fetchAssessmentData = async () => {
        if (!selectedYear || !selectedClass || !selectedWeek) return;

        try {
            setLoading(true);

            // 1. Get assessments with pagination
            const res = await childrenDailyAssessmentApi.getAssessmentsByClass({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: searchText,
            });

            const { days = [], students = [], assessmentMap = {}, pagination } = res.data.data;

            // ✅ Convert days to weekDayObjs (giống ChildrenAttendance)
            const weekDayObjs = (days || []).map((d) => ({
                date: d,
                dayOfWeek: dayjs(d).format('dddd'),
            }));

            setWeekDays(weekDayObjs);
            setTotalRows(pagination.totalItems);

            // 2. Get attendance data for displayed students
            const attendanceRes = await childrenAttendanceApi.getAttendanceByClass({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
                page: 1,
                limit: 1000,
            });

            const { attendanceMap: attMap = {} } = attendanceRes.data.data;

            // ✅ Map rows (giống ChildrenAttendance)
            const mappedRows = students.map((s, index) => ({
                id: s.studentId,
                stt: paginationModel.page * paginationModel.pageSize + index + 1,
                studentId: s.studentId,
                fullName: s.fullName,
                studentCode: s.studentCode,
                managementStatus: s.managementStatus,
                // ✅ Attendance map by date
                attendanceMap: attMap[s.studentId] || {},
                // ✅ Assessment map by date
                assessmentMap: assessmentMap[s.studentId] || {},
            }));

            setRows(mappedRows);
        } catch (error) {
            console.error('Error fetching assessment data:', error);
            if (error?.response?.status !== 404) {
                toast.error('Lỗi khi tải dữ liệu đánh giá!');
            }
            setRows([]);
            setWeekDays([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Load initial data
    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ When year changes: reload classes, weeks, holidays
    useEffect(() => {
        if (selectedYear) {
            fetchClasses();
            fetchWeeks();
            fetchHolidays();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ When filters change: reload data
    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek) {
            fetchAssessmentData();
        } else {
            setRows([]);
            setWeekDays([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginationModel, selectedClass, selectedWeek, searchText]);

    // ✅ Format week label
    const formatWeekLabel = (week) => {
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // ✅ Handle assessment dialog
    const handleOpenAssessment = (student, dayObj) => {
        if (isHoliday(dayObj.date)) {
            toast.warning('Không thể đánh giá cho ngày nghỉ!');
            return;
        }

        const attendance = student.attendanceMap[dayObj.date];
        if (!attendance || attendance.status !== 'Có mặt') {
            toast.warning('Chỉ được đánh giá học sinh đã điểm danh [Có mặt]!');
            return;
        }

        if (!isActiveYear && !canUpdate) return;

        const assessment = student.assessmentMap[dayObj.date] || null;

        // ✅ DEBUG: Log data trước khi mở dialog
        console.log('🔍 [Open Assessment Dialog]', {
            studentId: student.studentId,
            studentName: student.fullName,
            date: dayObj.date,
            dateFormat: dayjs(dayObj.date).format('YYYY-MM-DD'),
            attendance: attendance,
            assessment: assessment,
        });

        setDialogData({
            studentInfo: student,
            classId: selectedClass,
            academicYearId: selectedYear,
            date: dayObj.date, // ✅ Đảm bảo format "YYYY-MM-DD"
            existingAssessment: assessment,
        });
        setOpenDialog(true);
    };

    // ✅ DataGrid columns (giống ChildrenAttendance)
    const columns = [
        { field: 'stt', headerName: 'STT', width: 40, sortable: false, align: 'center' },
        {
            field: 'fullName',
            headerName: 'Họ tên học sinh',
            flex: 0.8,
            minWidth: 140,
            sortable: false,
            renderCell: (params) => <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>,
        },
        { field: 'studentCode', headerName: 'Mã học sinh', flex: 0.5, minWidth: 90, sortable: false },
        // ✅ Dynamic columns cho từng ngày trong tuần
        ...weekDays.map((day) => ({
            field: `day_${day.date}`,
            headerName: `${day.dayOfWeek} (${dayjs(day.date).format('DD/MM')})`,
            flex: 0.7,
            minWidth: 160,
            align: 'center',
            sortable: false,
            renderCell: (params) => {
                const holiday = isHoliday(day.date);
                const attendance = params.row.attendanceMap[day.date];
                const assessment = params.row.assessmentMap[day.date];
                const chipProps = getAttendanceChipProps(attendance?.status);
                const canAssess = attendance?.status === 'Có mặt';

                // Kiểm tra quyền chỉnh sửa/tạo mới
                const allowAction = (isActiveYear && canCreate) || canUpdate;

                return (
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: holiday || !canAssess ? 'center' : 'center',
                            alignItems: 'stretch',
                            position: 'relative', // Để định vị các thành phần con nếu cần
                        }}
                    >
                        {holiday ? (
                            <Chip
                                label="Ngày Nghỉ"
                                color="error"
                                size="small"
                                variant="soft"
                                sx={{ alignSelf: 'center' }}
                            />
                        ) : !canAssess ? (
                            <Tooltip
                                title={chipProps.name}
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
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chip label={`${chipProps.name}`} color={chipProps.color} size="small" />
                                </Box>
                            </Tooltip>
                        ) : (
                            <>
                                {/* LOGIC HIỂN THỊ CHÍNH */}
                                {assessment ? (
                                    /* TRƯỜNG HỢP 1: ĐÃ CÓ ĐÁNH GIÁ -> HIỆN CARD + ICON GÓC PHẢI TRÊN */
                                    <Box sx={{ position: 'relative', width: '100%', mt: 1 }}>
                                        {allowAction && (
                                            <Tooltip title="Chỉnh sửa đánh giá" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenAssessment(params.row, day)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: -10,
                                                        right: -8,
                                                        color: '#667eea',
                                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(102, 126, 234, 0.1)',
                                                        },
                                                        zIndex: 1,
                                                    }}
                                                >
                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {/* Component Card nội dung tách rời */}
                                        <AssessmentCard assessment={assessment} />
                                    </Box>
                                ) : (
                                    /* TRƯỜNG HỢP 2: CHƯA ĐÁNH GIÁ -> ICON NẰM TRƯỚC CHỮ */
                                    <Box
                                        onClick={() => allowAction && handleOpenAssessment(params.row, day)}
                                        sx={{
                                            // mt: 2.5, // Dịch xuống một chút để tránh cái dấu check có mặt
                                            p: 2,
                                            height: 60, // Chiều cao cố định cho đẹp đội hình
                                            border: '1px dashed',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: 1, // Khoảng cách giữa Icon và Chữ
                                            color: 'text.secondary',
                                            cursor: allowAction ? 'pointer' : 'default',
                                            transition: 'all 0.2s',
                                            '&:hover': allowAction
                                                ? {
                                                      borderColor: 'primary.main',
                                                      bgcolor: 'primary.50',
                                                      color: 'primary.main',
                                                  }
                                                : {},
                                        }}
                                    >
                                        {/* Icon nằm trước chữ */}
                                        <NoteAltIcon fontSize="small" />

                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                            Chưa đánh giá
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                );
            },
        })),
    ];

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' },
                        { text: 'Đánh giá trẻ em hằng ngày' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Đánh giá trẻ em hằng ngày
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
                            <FormControl size="small" sx={{ minWidth: 150 }}>
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
                            <FormControl size="small" sx={{ minWidth: 160 }}>
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

                    {/* Status Alert */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2, borderRadius: 1 }}>
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

                    {/* DataGrid */}
                    {!selectedYear || !selectedClass || !selectedWeek ? (
                        <Alert severity="info">Vui lòng chọn năm học, lớp học và tuần để xem đánh giá.</Alert>
                    ) : weekDays.length === 0 ? (
                        <Alert severity="warning">Tuần này chưa có lịch học (Thứ 2-6).</Alert>
                    ) : (
                        <>
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
                        </>
                    )}
                </Paper>
            </PageContainer>

            {/* Dialog đánh giá */}
            {dialogData && (
                <ChildrenAssessmentDialog
                    open={openDialog}
                    studentInfo={dialogData.studentInfo}
                    classId={dialogData.classId}
                    academicYearId={dialogData.academicYearId}
                    date={dialogData.date}
                    existingAssessment={dialogData.existingAssessment}
                    onClose={() => setOpenDialog(false)}
                    onSuccess={fetchAssessmentData}
                />
            )}
        </MainLayout>
    );
}

export default ChildrenAssessment;
