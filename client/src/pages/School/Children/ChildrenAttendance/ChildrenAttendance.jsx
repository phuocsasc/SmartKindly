import { useState, useEffect, useMemo } from 'react';
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

    // Attendance data
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
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

    // ✅ Fetch classes (auto-select first)
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

    // ✅ Fetch schedule + holidays + weeks (MenuApply pattern)
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

            if (weeksData.length > 0) {
                setSelectedWeek(weeksData[0].weekNumber.toString());
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

            const { days = [], students: stu = [], attendanceMap: map = {}, totals = {} } = res.data?.data || {};

            const weekDayObjs = (days || []).map((d) => ({
                date: d,
                dayOfWeek: dayjs(d).format('dddd'),
            }));

            const mappedStudents = (stu || []).map((s) => ({
                ...s,
                id: s.studentId,
                absentSummary: {
                    absentInWeek: totals?.[s.studentId]?.absentInWeek || 0,
                    absentInYear: totals?.[s.studentId]?.absentInYear || 0,
                },
            }));

            setWeekDays(weekDayObjs);
            setStudents(mappedStudents);
            setAttendanceMap(map);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            if (error?.response?.status !== 404) toast.error('Lỗi khi tải dữ liệu điểm danh!');
            setWeekDays([]);
            setStudents([]);
            setAttendanceMap({});
        } finally {
            setLoading(false);
        }
    };

    // ✅ Helpers
    const getAttendance = (studentId, dateStr) => attendanceMap?.[studentId]?.[dateStr] || null;
    const getAbsentDaysInWeek = (studentId) =>
        students.find((s) => s.studentId === studentId)?.absentSummary?.absentInWeek || 0;
    const getAbsentDaysInYear = (studentId) =>
        students.find((s) => s.studentId === studentId)?.absentSummary?.absentInYear || 0;

    const filteredStudents = useMemo(() => {
        if (!searchText) return students;
        const q = searchText.toLowerCase();
        return students.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q));
    }, [students, searchText]);

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
        const existing = getAttendance(student.studentId, dayObj.date);
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
            students: students,
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
            setStudents([]);
            setAttendanceMap({});
            return;
        }
        setSelectedClass('');
        setSelectedWeek('');
        setWeekDays([]);
        setStudents([]);
        setAttendanceMap({});
        fetchClasses(selectedYear);
        fetchSchedule(selectedYear);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek && weeks.length > 0) {
            fetchAttendanceData();
        } else {
            setStudents([]);
            setAttendanceMap({});
            setWeekDays([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedWeek, selectedYear]);

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

                    {/* Table */}
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
                                '&::-webkit-scrollbar': { width: '6px', height: '8px' },
                                '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                                '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                                '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            <Table
                                stickyHeader
                                size="small"
                                sx={{
                                    '& .MuiTableHead-root .MuiTableCell-head': {
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 600,
                                        borderBottom: '2px solid #bbdefb',
                                        borderRight: '1px solid #bbdefb',
                                        fontSize: '0.95rem',
                                        textAlign: 'center',
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-body': {
                                        borderRight: '1px solid #e0e0e0',
                                        borderBottom: '1px solid #f0f0f0',
                                        color: '#000',
                                        padding: '6px 8px',
                                        fontSize: '0.9rem',
                                    },
                                    '& .MuiTableRow-root:hover': { backgroundColor: '#f5faff' },
                                    '& .MuiTableCell-root': {
                                        '&.sticky-col-stt': {
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 50,
                                            textAlign: 'center',
                                        },
                                        '&.sticky-col-stt.body-cell': { backgroundColor: '#fff', zIndex: 2 },
                                        '&.sticky-col-name': {
                                            position: 'sticky',
                                            left: 50,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 160,
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
                                            left: 210,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 110,
                                        },
                                        '&.sticky-col-code.body-cell': { backgroundColor: '#fff', zIndex: 2 },
                                        '&.sticky-col-week-absent': {
                                            position: 'sticky',
                                            left: 320,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 130,
                                        },
                                        '&.sticky-col-week-absent.body-cell': { backgroundColor: '#fff', zIndex: 2 },
                                        '&.sticky-col-absent': {
                                            position: 'sticky',
                                            right: 0,
                                            zIndex: 3,
                                            backgroundColor: '#fff3e0',
                                            minWidth: 150,
                                        },
                                        '&.sticky-col-absent.body-cell': { backgroundColor: '#fffde7', zIndex: 2 },
                                    },
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell className="sticky-col-stt">STT</TableCell>
                                        <TableCell className="sticky-col-name">Họ tên học sinh</TableCell>
                                        <TableCell className="sticky-col-code">Mã học sinh</TableCell>
                                        <TableCell className="sticky-col-week-absent">
                                            <Typography fontWeight={600} fontSize={13}>
                                                Ngày vắng trong tuần
                                            </Typography>
                                        </TableCell>

                                        {weekDays.map((day) => {
                                            const holiday = isHoliday(day.date);
                                            return (
                                                <TableCell
                                                    key={day.date}
                                                    align="center"
                                                    sx={{ minWidth: 140, bgcolor: holiday ? '#ffebee' : 'inherit' }}
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
                                                            <Typography
                                                                variant="caption"
                                                                display="block"
                                                                color="text.secondary"
                                                            >
                                                                {dayjs(day.date).format('DD/MM/YYYY')}
                                                            </Typography>
                                                        </Box>
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

                                        <TableCell className="sticky-col-absent">
                                            <Typography fontWeight={600} fontSize={13}>
                                                Ngày vắng trong năm
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredStudents.map((student, index) => {
                                        const weekAbsentDays = getAbsentDaysInWeek(student.studentId);
                                        const yearAbsentDays = getAbsentDaysInYear(student.studentId);

                                        return (
                                            <TableRow key={student.studentId} hover>
                                                <TableCell className="sticky-col-stt body-cell">{index + 1}</TableCell>
                                                <TableCell className="sticky-col-name body-cell">
                                                    {student.fullName}
                                                </TableCell>
                                                <TableCell className="sticky-col-code body-cell">
                                                    {student.studentCode}
                                                </TableCell>

                                                <TableCell align="center" className="sticky-col-week-absent body-cell">
                                                    <Chip
                                                        label={`${weekAbsentDays} ngày`}
                                                        size="small"
                                                        color={weekAbsentDays === 0 ? 'success' : 'warning'}
                                                        sx={{ fontWeight: 600, minWidth: 70 }}
                                                    />
                                                </TableCell>

                                                {weekDays.map((day) => {
                                                    const holiday = isHoliday(day.date);
                                                    const att = getAttendance(student.studentId, day.date);
                                                    const chipProps = getStatusChipProps(att?.status);

                                                    return (
                                                        <TableCell
                                                            key={day.date}
                                                            align="center"
                                                            sx={{
                                                                cursor:
                                                                    isActiveYear && !holiday
                                                                        ? 'pointer'
                                                                        : 'not-allowed',
                                                                verticalAlign: 'middle',
                                                                py: 0.5,
                                                                px: 1,
                                                                opacity: !isActiveYear && !att ? 0.5 : 1,
                                                                pointerEvents:
                                                                    !isActiveYear || holiday ? 'none' : 'auto',
                                                                bgcolor: holiday ? '#ffebee' : 'inherit',
                                                            }}
                                                            onClick={() => handleCellClick(student, day)}
                                                        >
                                                            {holiday ? (
                                                                <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                            ) : att ? (
                                                                <Tooltip
                                                                    title={
                                                                        <Box>
                                                                            <Typography
                                                                                variant="caption"
                                                                                display="block"
                                                                            >
                                                                                {chipProps.fullLabel}
                                                                            </Typography>
                                                                            {att.note && (
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    display="block"
                                                                                >
                                                                                    Ghi chú: {att.note}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    }
                                                                    arrow
                                                                >
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
                                                            ) : (
                                                                <Tooltip
                                                                    title={
                                                                        isActiveYear
                                                                            ? 'Chưa điểm danh'
                                                                            : 'Năm học đã kết thúc'
                                                                    }
                                                                >
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

                                                <TableCell
                                                    align="center"
                                                    className="sticky-col-absent body-cell"
                                                    sx={{ bgcolor: '#fffde7' }}
                                                >
                                                    <Chip
                                                        label={`${yearAbsentDays} ngày`}
                                                        color="default"
                                                        size="small"
                                                        sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 40 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
