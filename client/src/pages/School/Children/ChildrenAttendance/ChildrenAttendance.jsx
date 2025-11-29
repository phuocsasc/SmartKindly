import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Chip,
    TextField,
    IconButton,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenAttendanceApi, academicYearApi, scheduleApi } from '~/apis'; // ✅ Add scheduleApi
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import ChildrenAttendanceDialog from './ChildrenAttendanceDialog';
import BulkAttendanceDialog from './BulkAttendanceDialog';

// ✅ Helper: Get status chip color and label
const getStatusChipProps = (status) => {
    switch (status) {
        case 'Có mặt':
            return { color: 'success', label: '✓', fullLabel: 'Có mặt' };
        case 'Vắng có phép':
            return { color: 'warning', label: 'P', fullLabel: 'Vắng có phép' };
        case 'Vắng không phép':
            return { color: 'error', label: 'K', fullLabel: 'Vắng không phép' };
        case 'Đi trễ':
            return { color: 'info', label: 'T', fullLabel: 'Đi trễ' };
        default:
            return { color: 'default', label: '-', fullLabel: 'Chưa điểm danh' };
    }
};

function ChildrenAttendance() {
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

    // Attendance data
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [weekDays, setWeekDays] = useState([]);
    const [holidays, setHolidays] = useState([]); // ✅ NEW: State cho ngày nghỉ

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [openBulkDialog, setOpenBulkDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);
    const [bulkDialogData, setBulkDialogData] = useState(null);

    const isActiveYear = selectedYear === activeYearId;
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_ATTENDANCE);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_ATTENDANCE);

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

    // ✅ Fetch accessible classes
    const fetchClasses = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenAttendanceApi.getAccessibleClasses(selectedYear);
            const classesData = res.data.data.classes;

            setClasses(classesData);

            // ✅ FIX: Auto-select lớp đầu tiên của năm học được chọn
            if (classesData.length > 0) {
                setSelectedClass(classesData[0]._id);
            } else {
                setSelectedClass('');
                setStudents([]);
                setAttendanceData({});
                setWeekDays([]);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
            setClasses([]);
            setSelectedClass('');
        }
    };

    // ✅ Fetch weeks
    const fetchWeeks = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenAttendanceApi.getWeeks(selectedYear);
            const weeksData = res.data.data.weeks;

            setWeeks(weeksData);

            // ✅ FIX: Auto-select tuần 1 của năm học được chọn
            if (weeksData.length > 0) {
                setSelectedWeek(weeksData[0].weekNumber.toString());
            } else {
                setSelectedWeek('');
                setWeekDays([]);
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            toast.error('Lỗi khi tải danh sách tuần!');
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    // ✅ NEW: Fetch holidays
    const fetchHolidays = async () => {
        if (!selectedYear) return;

        try {
            const scheduleRes = await scheduleApi.getByAcademicYear(selectedYear);
            const schedule = scheduleRes.data.data;

            if (schedule) {
                const holidaysRes = await scheduleApi.getHolidays(schedule._id);
                setHolidays(holidaysRes.data.data.holidays || []);
                console.log('✅ [ChildrenAttendance] Holidays loaded:', holidaysRes.data.data.holidays?.length || 0);
            }
        } catch (error) {
            console.error('Error fetching holidays:', error);
            if (error?.response?.status !== 404 && error?.response?.status !== 500) {
                toast.error('Lỗi khi tải danh sách ngày nghỉ!');
            }
        }
    };

    // ✅ NEW: Check if date is holiday
    const isHoliday = (date) => {
        if (!date) return false;
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    };

    // ✅ Fetch attendance data
    const fetchAttendanceData = async () => {
        if (!selectedYear || !selectedClass || !selectedWeek) return;

        try {
            setLoading(true);

            const res = await childrenAttendanceApi.getAttendanceByClass({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const { students: studentsData, attendanceMap } = res.data.data;

            // Get week info
            const currentWeek = weeks.find((w) => w.weekNumber === parseInt(selectedWeek));
            if (currentWeek) {
                setWeekDays(currentWeek.days);
            }

            setStudents(studentsData);
            setAttendanceData(attendanceMap);

            console.log('✅ Attendance data loaded:', {
                studentsCount: studentsData.length,
                attendanceMapKeys: Object.keys(attendanceMap).length,
                sampleKeys: Object.keys(attendanceMap).slice(0, 3), // ✅ Debug: Xem 3 key đầu tiên
                sampleStudent: studentsData[0], // ✅ Debug: Xem structure của student
            });
        } catch (error) {
            console.error('Error fetching attendance:', error);
            // ✅ Chỉ show toast nếu KHÔNG phải lỗi "Không tìm thấy lớp học"
            // (lỗi này xảy ra khi đang chuyển năm và params chưa sync)
            if (error?.response?.status !== 404) {
                toast.error('Lỗi khi tải dữ liệu điểm danh!');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchClasses();
            fetchWeeks();
            fetchHolidays(); // ✅ Fetch holidays khi đổi năm học
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek && weeks.length > 0) {
            fetchAttendanceData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedWeek]);

    const formatWeekDisplay = (week) => {
        if (!week.startDate || !week.endDate) {
            return `Tuần ${week.weekNumber}`;
        }
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // ✅ Handle cell click - Open dialog
    const handleCellClick = (student, day) => {
        // ✅ FIX: Chặn nếu là ngày nghỉ
        if (isHoliday(day.date)) {
            toast.warning('Không thể điểm danh cho ngày nghỉ!');
            return;
        }

        if (!isActiveYear && !canUpdate) return;

        const key = `${student._id}-${dayjs(day.date).format('YYYY-MM-DD')}`;
        const attendance = attendanceData[key] || null;

        setDialogData({
            studentInfo: student,
            classId: selectedClass,
            date: day.date,
            existingAttendance: attendance,
        });
        setOpenDialog(true);
    };

    // ✅ Handle bulk attendance
    const handleBulkAttendance = (day) => {
        // ✅ FIX: Chặn nếu là ngày nghỉ
        if (isHoliday(day.date)) {
            toast.warning('Không thể điểm danh hàng loạt cho ngày nghỉ!');
            return;
        }

        if (!isActiveYear) return;

        setBulkDialogData({
            classId: selectedClass,
            students: students,
            date: day.date,
        });
        setOpenBulkDialog(true);
    };

    // ✅ Filter students by search
    const filteredStudents = students.filter(
        (student) =>
            student.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
            student.studentCode.toLowerCase().includes(searchText.toLowerCase()),
    );

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
                            {/* Search */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã HS..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 200 }}
                            />

                            {/* Academic Year */}
                            <FormControl size="small" sx={{ minWidth: 100 }}>
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
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Tuần</InputLabel>
                                <Select
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    label="Tuần"
                                    disabled={weeks.length === 0}
                                >
                                    {weeks.map((week) => (
                                        <MenuItem key={week.weekNumber} value={week.weekNumber.toString()}>
                                            {formatWeekDisplay(week)}
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

                    {/* Attendance Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : !selectedYear || !selectedClass || !selectedWeek ? (
                        <Alert severity="info">Vui lòng chọn năm học, lớp học và tuần để xem điểm danh.</Alert>
                    ) : weekDays.length === 0 ? (
                        <Alert severity="warning">Tuần này chưa có lịch học (Thứ 2-6).</Alert>
                    ) : (
                        <TableContainer
                            sx={{
                                maxHeight: 450,
                                overflowY: 'auto',
                                overflowX: 'auto',
                                position: 'relative', // ✅ KEY: Để sticky header hoạt động
                                // Optional: style scrollbar dọc + ngang cho đẹp
                                '&::-webkit-scrollbar': { width: '6px', height: '8px' },
                                '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#0964a1a4',
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            <Table
                                stickyHeader
                                size="small"
                                sx={{
                                    // 💠 HEADER STYLE - Giống UserManagement
                                    '& .MuiTableHead-root .MuiTableCell-head': {
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 600,
                                        borderBottom: '2px solid #bbdefb',
                                        borderRight: '1px solid #bbdefb',
                                        fontSize: '0.95rem',
                                        textAlign: 'center',
                                        // position: 'sticky', // ✅ Sticky
                                        // top: 0, // ✅ Dính ở top
                                        zIndex: 2,
                                    },

                                    // 💠 BODY STYLE - Giống UserManagement
                                    '& .MuiTableBody-root .MuiTableCell-body': {
                                        borderRight: '1px solid #e0e0e0',
                                        borderBottom: '1px solid #f0f0f0',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                        color: '#000',
                                        padding: '6px 8px',
                                        fontSize: '0.9rem',
                                    },

                                    // 💠 ROW HOVER
                                    '& .MuiTableRow-root:hover': {
                                        backgroundColor: '#f5faff',
                                    },

                                    // 💠 FIXED COLUMNS (STT, Họ tên, Mã HS)
                                    '& .MuiTableCell-root': {
                                        '&.sticky-col-stt': {
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 50, // 👈 giảm từ 40 → 30
                                            maxWidth: 50,
                                            width: 50,
                                            textAlign: 'center',
                                        },
                                        '&.sticky-col-stt.body-cell': {
                                            backgroundColor: '#fff',
                                            zIndex: 2,
                                        },
                                        '&.sticky-col-name': {
                                            position: 'sticky',
                                            left: 50,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 140, // 👈 nhỏ hơn 200
                                            maxWidth: 160, // 👈 thêm maxWidth để kiểm soát an toàn
                                            width: 160, // 👈 ép width về đúng giá trị mong muốn
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                        '&.sticky-col-name.body-cell': {
                                            backgroundColor: '#fff',
                                            zIndex: 2,
                                            fontWeight: 600,
                                        },
                                        '&.sticky-col-code': {
                                            position: 'sticky',
                                            left: 180,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 120,
                                        },
                                        '&.sticky-col-code.body-cell': {
                                            backgroundColor: '#fff',
                                            zIndex: 2,
                                        },
                                        // ✅ NEW: Sticky column cuối (Tổng số ngày vắng)
                                        '&.sticky-col-absent': {
                                            position: 'sticky',
                                            zIndex: 3,
                                            backgroundColor: '#fff3e0',
                                            minWidth: 150,
                                        },
                                        '&.sticky-col-absent.body-cell': {
                                            backgroundColor: '#fffde7',
                                            zIndex: 2,
                                        },
                                    },

                                    // 💠 BO GÓC VÀ SHADOW
                                    borderRadius: 2,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    overflow: 'hidden',
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell className="sticky-col-stt">STT</TableCell>
                                        <TableCell className="sticky-col-name">Họ tên học sinh</TableCell>
                                        <TableCell className="sticky-col-code">Mã học sinh</TableCell>

                                        {weekDays.map((day) => {
                                            const holiday = isHoliday(day.date); // ✅ Check holiday

                                            return (
                                                <TableCell
                                                    key={day.date}
                                                    align="center"
                                                    sx={{
                                                        minWidth: 140,
                                                        bgcolor: holiday ? '#ffebee' : 'inherit', // ✅ Đỏ nhạt nếu nghỉ
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="caption" fontWeight={600}>
                                                                {day.dayOfWeek} ({dayjs(day.date).format('DD/MM')})
                                                            </Typography>
                                                            {/* ✅ Hiển thị "Nghỉ" nếu là holiday */}
                                                            {/* {holiday && (
                                                                <Chip
                                                                    label="Ngày Nghỉ"
                                                                    color="error"
                                                                    size="small"
                                                                    sx={{ ml: 0.5 }}
                                                                />
                                                            )} */}
                                                        </Box>

                                                        {/* ✅ Ẩn nút bulk attendance nếu là ngày nghỉ */}
                                                        {!holiday && canCreate && isActiveYear && (
                                                            <Tooltip title="Điểm danh hàng loạt">
                                                                <IconButton
                                                                    size="small"
                                                                    color="info"
                                                                    onClick={() => handleBulkAttendance(day)}
                                                                >
                                                                    <FactCheckOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            );
                                        })}
                                        {/* ✅ NEW: Cột tổng số ngày vắng */}
                                        <TableCell>
                                            <Box
                                                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                            >
                                                <Typography fontWeight={600}>Tổng ngày vắng</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredStudents.map((student, index) => (
                                        <TableRow key={student._id} hover>
                                            <TableCell className="sticky-col-stt body-cell">{index + 1}</TableCell>
                                            <TableCell className="sticky-col-name body-cell">
                                                {student.fullName}
                                            </TableCell>
                                            <TableCell className="sticky-col-code body-cell">
                                                {student.studentCode}
                                            </TableCell>

                                            {weekDays.map((day) => {
                                                const key = `${student._id}-${dayjs(day.date).format('YYYY-MM-DD')}`;
                                                const attendance = attendanceData[key] || null;
                                                const chipProps = getStatusChipProps(attendance?.status);
                                                const holiday = isHoliday(day.date); // ✅ Check holiday

                                                return (
                                                    <TableCell
                                                        key={day.date}
                                                        align="center"
                                                        sx={{
                                                            cursor: isActiveYear ? 'pointer' : 'not-allowed',
                                                            verticalAlign: 'middle',
                                                            py: 0.5,
                                                            px: 1,
                                                            opacity: !isActiveYear && !attendance ? 0.5 : 1,
                                                            pointerEvents: !isActiveYear ? 'none' : 'auto',
                                                            bgcolor: holiday ? '#ffebee' : 'inherit', // ✅ Nền đỏ nhạt cho ngày nghỉ
                                                        }}
                                                        onClick={() => handleCellClick(student, day)}
                                                    >
                                                        {/* ✅ Hiển thị "Ngày Nghỉ" nếu là ngày nghỉ */}
                                                        {holiday ? (
                                                            <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                        ) : attendance ? (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                    py: 0.5,
                                                                }}
                                                            >
                                                                <Tooltip title={chipProps.fullLabel}>
                                                                    <Chip
                                                                        label={chipProps.label}
                                                                        color={chipProps.color}
                                                                        size="small"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            minWidth: 50,
                                                                            fontSize: '0.875rem',
                                                                        }}
                                                                    />
                                                                </Tooltip>

                                                                {attendance.note && (
                                                                    <Tooltip title={attendance.note} arrow>
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="text.secondary"
                                                                            sx={{
                                                                                fontSize: '0.7rem',
                                                                                maxWidth: 120,
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                            }}
                                                                        >
                                                                            📝 {attendance.note}
                                                                        </Typography>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        ) : (
                                                            <Tooltip
                                                                title={
                                                                    isActiveYear
                                                                        ? 'Chưa điểm danh'
                                                                        : 'Năm học đã kết thúc'
                                                                }
                                                            >
                                                                {/* <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="default"
                                                                        disabled={!isActiveYear}
                                                                    >
                                                                        <CheckCircleIcon fontSize="small" />
                                                                    </IconButton>
                                                                </span> */}
                                                                <Chip
                                                                    label={chipProps.label}
                                                                    color={chipProps.color}
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        minWidth: 50,
                                                                        fontSize: '0.875rem',
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                            {/* ✅ NEW: Hiển thị tổng số ngày vắng */}
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    bgcolor: '#fffde7',
                                                    verticalAlign: 'middle',
                                                    position: 'sticky',
                                                    right: 0,
                                                    zIndex: 2,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    {(() => {
                                                        const totalAbsent = student.absentSummary?.totalAbsent || 0;
                                                        const withPermission =
                                                            student.absentSummary?.absentWithPermission || 0; // Vắng có phép
                                                        const withoutPermission =
                                                            student.absentSummary?.absentWithoutPermission || 0; // Vắng không phép

                                                        return (
                                                            <Tooltip
                                                                arrow
                                                                title={
                                                                    totalAbsent === 0 ? (
                                                                        'Không có ngày vắng trong năm này'
                                                                    ) : (
                                                                        <Box>
                                                                            <Typography
                                                                                variant="caption"
                                                                                display="block"
                                                                            >
                                                                                Vắng <strong>có phép</strong>:{' '}
                                                                                {withPermission} ngày
                                                                            </Typography>
                                                                            <Typography
                                                                                variant="caption"
                                                                                display="block"
                                                                            >
                                                                                Vắng <strong>không phép</strong>:{' '}
                                                                                {withoutPermission} ngày
                                                                            </Typography>
                                                                        </Box>
                                                                    )
                                                                }
                                                            >
                                                                <Chip
                                                                    label={totalAbsent}
                                                                    color="default"
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        fontSize: '0.9rem',
                                                                        minWidth: 40,
                                                                        cursor: totalAbsent > 0 ? 'pointer' : 'default',
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        );
                                                    })()}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Legend */}
                    {weekDays.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Chip label="✓ Có mặt" color="success" size="small" />
                            <Chip label="T Đi trễ" color="info" size="small" />
                            <Chip label="- Chưa điểm danh" color="default" size="small" />
                            <Chip label="P Vắng có phép" color="warning" size="small" />
                            <Chip label="K Vắng không phép" color="error" size="small" />
                        </Box>
                    )}
                </Paper>
            </PageContainer>

            {/* Dialog điểm danh đơn */}
            {dialogData && (
                <ChildrenAttendanceDialog
                    open={openDialog}
                    studentInfo={dialogData.studentInfo}
                    classId={dialogData.classId}
                    date={dialogData.date}
                    existingAttendance={dialogData.existingAttendance}
                    onClose={() => setOpenDialog(false)}
                    onSuccess={fetchAttendanceData} // ✅ Re-fetch để cập nhật UI
                />
            )}

            {/* Dialog điểm danh hàng loạt */}
            {bulkDialogData && (
                <BulkAttendanceDialog
                    open={openBulkDialog}
                    classId={bulkDialogData.classId}
                    students={bulkDialogData.students}
                    date={bulkDialogData.date}
                    onClose={() => setOpenBulkDialog(false)}
                    onSuccess={fetchAttendanceData} // ✅ Re-fetch để cập nhật UI
                />
            )}
        </MainLayout>
    );
}

export default ChildrenAttendance;
