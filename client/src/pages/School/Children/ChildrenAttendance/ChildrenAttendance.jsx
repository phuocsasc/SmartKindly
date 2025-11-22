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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenAttendanceApi, academicYearApi } from '~/apis';
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
            setClasses(res.data.data.classes);

            if (res.data.data.classes.length > 0 && !selectedClass) {
                setSelectedClass(res.data.data.classes[0]._id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
        }
    };

    // ✅ Fetch weeks
    const fetchWeeks = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenAttendanceApi.getWeeks(selectedYear);
            setWeeks(res.data.data.weeks);

            if (res.data.data.weeks.length > 0 && !selectedWeek) {
                setSelectedWeek(res.data.data.weeks[0].weekNumber.toString());
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            toast.error('Lỗi khi tải danh sách tuần!');
        }
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
            toast.error('Lỗi khi tải dữ liệu điểm danh!');
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek && weeks.length > 0) {
            fetchAttendanceData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedClass, selectedWeek]);

    // ✅ Handle cell click - Open dialog
    const handleCellClick = (student, day) => {
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
                            <FormControl size="small" sx={{ minWidth: 200 }}>
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
                            <FormControl size="small" sx={{ minWidth: 180 }}>
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
                                            Tuần {week.weekNumber}
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
                        <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#e3f2fd',
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 3,
                                                minWidth: 60,
                                            }}
                                        >
                                            STT
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#e3f2fd',
                                                position: 'sticky',
                                                left: 60,
                                                zIndex: 3,
                                                minWidth: 200,
                                            }}
                                        >
                                            Họ tên
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#e3f2fd',
                                                position: 'sticky',
                                                left: 260,
                                                zIndex: 3,
                                                minWidth: 120,
                                            }}
                                        >
                                            Mã HS
                                        </TableCell>

                                        {weekDays.map((day) => (
                                            <TableCell
                                                key={day.date}
                                                align="center"
                                                sx={{
                                                    fontWeight: 700,
                                                    bgcolor: '#e3f2fd',
                                                    minWidth: 140,
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700}>
                                                        {day.dayOfWeek}
                                                    </Typography>
                                                    <Typography variant="caption" display="block">
                                                        {dayjs(day.date).format('DD/MM')}
                                                    </Typography>

                                                    {/* Bulk attendance icon */}
                                                    {canCreate && isActiveYear && (
                                                        <Tooltip title="Điểm danh hàng loạt">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleBulkAttendance(day)}
                                                                sx={{ mt: 0.5 }}
                                                            >
                                                                <GroupAddIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredStudents.map((student, index) => (
                                        <TableRow key={student._id} hover>
                                            <TableCell
                                                sx={{
                                                    position: 'sticky',
                                                    left: 0,
                                                    bgcolor: '#fff',
                                                    zIndex: 2,
                                                }}
                                            >
                                                {index + 1}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    position: 'sticky',
                                                    left: 60,
                                                    bgcolor: '#fff',
                                                    zIndex: 2,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {student.fullName}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    position: 'sticky',
                                                    left: 260,
                                                    bgcolor: '#fff',
                                                    zIndex: 2,
                                                }}
                                            >
                                                {student.studentCode}
                                            </TableCell>

                                            {weekDays.map((day) => {
                                                // ✅ FIX: Đảm bảo format date chính xác
                                                const studentIdStr = student._id.toString();

                                                // ✅ Parse day.date đúng cách
                                                const dayDate = dayjs(day.date);
                                                const dateStr = dayDate.format('YYYY-MM-DD');

                                                const key = `${studentIdStr}-${dateStr}`;
                                                const attendance = attendanceData[key];

                                                console.log(`🔍 [${student.fullName}] Key: ${key}`, {
                                                    exists: !!attendance,
                                                    status: attendance?.status,
                                                    dayDate: dayDate.format('DD/MM/YYYY'),
                                                    rawDate: day.date,
                                                });

                                                const chipProps = attendance
                                                    ? getStatusChipProps(attendance.status)
                                                    : null;

                                                return (
                                                    <TableCell
                                                        key={day.date}
                                                        align="center"
                                                        sx={{
                                                            cursor: isActiveYear || attendance ? 'pointer' : 'default',
                                                            '&:hover': {
                                                                bgcolor:
                                                                    isActiveYear || attendance ? '#f5f5f5' : 'inherit',
                                                            },
                                                            verticalAlign: 'top',
                                                            py: 1,
                                                        }}
                                                        onClick={() => handleCellClick(student, day)}
                                                    >
                                                        {attendance ? (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                }}
                                                            >
                                                                {/* Status Chip */}
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

                                                                {/* Note (if exists) */}
                                                                {attendance.note && (
                                                                    <Tooltip title={attendance.note} arrow>
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="text.secondary"
                                                                            sx={{
                                                                                fontSize: '0.7rem',
                                                                                fontStyle: 'italic',
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
                                                                        ? 'Click để điểm danh'
                                                                        : 'Chưa điểm danh'
                                                                }
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    color="default"
                                                                    disabled={!isActiveYear}
                                                                >
                                                                    <CheckCircleIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
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
                            <Chip label="P Vắng có phép" color="warning" size="small" />
                            <Chip label="K Vắng không phép" color="error" size="small" />
                            <Chip label="T Đi trễ" color="info" size="small" />
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
