// client/src/pages/School/Children/ChildrenAssessment/ChildrenAssessment.jsx

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
import RateReviewIcon from '@mui/icons-material/RateReview';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
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

// ✅ Helper: Get attendance chip props
const getAttendanceChipProps = (status) => {
    switch (status) {
        case 'Có mặt':
            return { color: 'success', label: 'Có mặt' };
        case 'Đi trễ':
            return { color: 'info', label: 'Đi trễ' };
        case 'Vắng có phép':
            return { color: 'warning', label: 'Vắng có phép' };
        case 'Vắng không phép':
            return { color: 'error', label: 'Vắng không phép' };
        default:
            return { color: 'default', label: 'Chưa điểm danh' };
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

    // Assessment data
    const [students, setStudents] = useState([]);
    const [assessmentData, setAssessmentData] = useState({});
    const [attendanceData, setAttendanceData] = useState({});
    const [weekDays, setWeekDays] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [highlightStudents, setHighlightStudents] = useState({}); // { [studentId]: true }

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

            // ✅ ALWAYS reset selectedClass when year changes
            if (classList.length > 0) {
                setSelectedClass(classList[0]._id);
            } else {
                setSelectedClass('');
                // ✅ Clear dependent data when no classes
                setStudents([]);
                setAssessmentData({});
                setAttendanceData({});
                setWeekDays([]);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
            setClasses([]);
            setSelectedClass('');
            // ✅ Clear dependent data on error
            setStudents([]);
            setAssessmentData({});
            setAttendanceData({});
            setWeekDays([]);
        }
    };

    // ✅ Fetch weeks
    const fetchWeeks = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenAttendanceApi.getWeeks(selectedYear);
            const weeksData = res.data.data.weeks;
            setWeeks(weeksData);

            if (weeksData.length > 0) {
                setSelectedWeek(weeksData[0].weekNumber.toString());
            } else {
                setSelectedWeek('');
                setWeekDays([]);
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            // ✅ Only show toast if not 404/500 (schedule not found)
            if (error?.response?.status !== 404 && error?.response?.status !== 500) {
                toast.error('Lỗi khi tải danh sách tuần!');
            }
            setWeeks([]);
            setSelectedWeek('');
            setWeekDays([]);
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
            if (error?.response?.status !== 404 && error?.response?.status !== 500) {
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

    // ✅ Fetch assessment data
    const fetchAssessmentData = async () => {
        if (!selectedYear || !selectedClass || !selectedWeek) return;

        try {
            setLoading(true);

            // 1. Get assessments
            const assessmentRes = await childrenDailyAssessmentApi.getAssessmentsByClass({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
                search: searchText,
            });

            const { assessments } = assessmentRes.data.data;

            // 2. Get attendance data
            const weeksRes = await childrenAttendanceApi.getAttendanceByClass({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const { students: studentsData } = weeksRes.data.data;

            // 3. Get week info
            const currentWeek = weeks.find((w) => w.weekNumber === parseInt(selectedWeek));
            if (currentWeek) {
                setWeekDays(currentWeek.days);
            }

            // 4. Map assessments by studentId-date
            const assessmentMap = {};
            assessments.forEach((assessment) => {
                const key = `${assessment.studentId._id}-${dayjs(assessment.date).format('YYYY-MM-DD')}`;
                assessmentMap[key] = assessment;
            });

            // 5. Get attendance data
            const attendanceRes = await childrenAttendanceApi.getAttendanceByClass({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const { attendanceMap } = attendanceRes.data.data;

            // ✅ 6. Calculate highlightStudents - FIX: Dùng assessmentMap + weekDays
            const highlightMap = {};

            if (currentWeek && currentWeek.days) {
                studentsData.forEach((student) => {
                    const hasNotes = currentWeek.days.some((day) => {
                        const key = `${student._id}-${dayjs(day.date).format('YYYY-MM-DD')}`;
                        const assessment = assessmentMap[key];

                        // ✅ Check if this day has notes
                        return assessment && assessment.notes && assessment.notes.trim().length > 0;
                    });

                    if (hasNotes) {
                        highlightMap[student._id] = true;
                    }
                });
            }

            setStudents(studentsData);
            setAssessmentData(assessmentMap);
            setAttendanceData(attendanceMap);
            setHighlightStudents(highlightMap); // ✅ Set highlight map

            console.log('✅ Assessment data loaded:', {
                studentsCount: studentsData.length,
                assessmentsCount: assessments.length,
                weekDays: currentWeek?.days.length || 0,
                highlightedStudents: Object.keys(highlightMap).length, // ✅ Debug log
            });
        } catch (error) {
            console.error('Error fetching assessment data:', error);

            // ✅ Only show toast if not 404 (class not found during year switch)
            if (error?.response?.status === 404) {
                console.log('⚠️  Class not found - may be switching years, will auto-reload');
            } else {
                toast.error('Lỗi khi tải dữ liệu đánh giá!');
            }

            // ✅ Clear data on error
            setStudents([]);
            setAssessmentData({});
            setAttendanceData({});
            setWeekDays([]);
            setHighlightStudents({}); // ✅ Reset highlight
        } finally {
            setLoading(false);
        }
    };

    // ✅ Load initial data
    useEffect(() => {
        fetchAcademicYears();
    }, []);

    // ✅ When year changes: reload classes, weeks, holidays
    useEffect(() => {
        if (selectedYear) {
            fetchClasses();
            fetchWeeks();
            fetchHolidays(); // ✅ Fetch holidays khi đổi năm học
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ IMPORTANT: Only fetch when ALL filters are ready AND valid
    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek && weeks.length > 0) {
            fetchAssessmentData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedWeek]);

    // ✅ Format week label
    const formatWeekLabel = (week) => {
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // ✅ Handle assessment dialog
    const handleOpenAssessment = (student, day) => {
        if (isHoliday(day.date)) {
            toast.warning('Không thể đánh giá cho ngày nghỉ!');
            return;
        }

        const attendanceKey = `${student._id}-${dayjs(day.date).format('YYYY-MM-DD')}`;
        const attendance = attendanceData[attendanceKey];

        if (!attendance || !['Có mặt', 'Đi trễ'].includes(attendance.status)) {
            toast.warning('Chỉ được đánh giá học sinh đã điểm danh [Có mặt] hoặc [Đi trễ]!');
            return;
        }

        if (!isActiveYear && !canUpdate) return;

        const assessmentKey = `${student._id}-${dayjs(day.date).format('YYYY-MM-DD')}`;
        const assessment = assessmentData[assessmentKey] || null;

        setDialogData({
            studentInfo: student,
            classId: selectedClass,
            academicYearId: selectedYear,
            date: day.date,
            existingAssessment: assessment,
        });
        setOpenDialog(true);
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
                            <FormControl size="small" sx={{ minWidth: 180 }}>
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

                    {/* Assessment Table */}
                    {/* Assessment Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : !selectedYear || !selectedClass || !selectedWeek ? (
                        <Alert severity="info">Vui lòng chọn năm học, lớp học và tuần để xem đánh giá.</Alert>
                    ) : weekDays.length === 0 ? (
                        <Alert severity="warning">Tuần này chưa có lịch học (Thứ 2-6).</Alert>
                    ) : (
                        <TableContainer
                            sx={{
                                maxHeight: 450,
                                overflowY: 'auto',
                                overflowX: 'auto',
                                position: 'relative',
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
                                    // 💠 HEADER STYLE – giống bảng Điểm danh
                                    '& .MuiTableHead-root .MuiTableCell-head': {
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 600,
                                        borderBottom: '2px solid #bbdefb',
                                        borderRight: '1px solid #bbdefb',
                                        fontSize: '0.95rem',
                                        textAlign: 'center',
                                        zIndex: 2,
                                    },

                                    // 💠 BODY STYLE
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
                                    },

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
                                            const holiday = isHoliday(day.date);

                                            return (
                                                <TableCell
                                                    key={day.date}
                                                    align="center"
                                                    sx={{
                                                        minWidth: 160,
                                                        bgcolor: holiday ? '#ffebee' : 'inherit',
                                                    }}
                                                >
                                                    <Typography variant="caption" fontWeight={600}>
                                                        {day.dayOfWeek} ({dayjs(day.date).format('DD/MM')})
                                                    </Typography>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredStudents.map((student, index) => {
                                        const hasNotesThisWeek = !!highlightStudents[student._id]; // ✅ Check from highlightStudents
                                        return (
                                            <TableRow key={student._id} hover>
                                                <TableCell className="sticky-col-stt body-cell">{index + 1}</TableCell>
                                                {/* ✅ Họ tên học sinh - Đổi màu đỏ nếu có "Lưu ý" */}
                                                <TableCell
                                                    className="sticky-col-name body-cell"
                                                    sx={{
                                                        color: hasNotesThisWeek ? '#d32f2f' : 'inherit', // ✅ Đỏ nếu có lưu ý
                                                        fontWeight: hasNotesThisWeek ? 700 : 600,
                                                        transition: 'color 0.3s',
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 'inherit',
                                                                color: 'inherit',
                                                            }}
                                                        >
                                                            {student.fullName}
                                                        </Typography>
                                                        {/* ✅ Icon indicator */}
                                                        {hasNotesThisWeek && (
                                                            <Tooltip
                                                                title="Học sinh có ghi chú lưu ý trong tuần này"
                                                                arrow
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        width: 18,
                                                                        height: 18,
                                                                        borderRadius: '50%',
                                                                        bgcolor: '#d32f2f',
                                                                        color: 'white',
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    !
                                                                </Box>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell className="sticky-col-code body-cell">
                                                    {student.studentCode}
                                                </TableCell>

                                                {weekDays.map((day) => {
                                                    const attendanceKey = `${student._id}-${dayjs(day.date).format('YYYY-MM-DD')}`;
                                                    const assessmentKey = attendanceKey;
                                                    const attendance = attendanceData[attendanceKey];
                                                    const assessment = assessmentData[assessmentKey];
                                                    const holiday = isHoliday(day.date);

                                                    const chipProps = getAttendanceChipProps(attendance?.status);
                                                    const canAssess = ['Có mặt', 'Đi trễ'].includes(attendance?.status);

                                                    return (
                                                        <TableCell
                                                            key={day.date}
                                                            align="center"
                                                            sx={{
                                                                verticalAlign: 'middle',
                                                                py: 0.5,
                                                                px: 1,
                                                                bgcolor: holiday ? '#ffebee' : 'inherit',
                                                            }}
                                                        >
                                                            {holiday ? (
                                                                <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                            ) : !attendance || !canAssess ? (
                                                                <Chip
                                                                    label={chipProps.label}
                                                                    color={chipProps.color}
                                                                    size="small"
                                                                    sx={{ fontSize: '0.7rem' }}
                                                                />
                                                            ) : (
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'row', // 👈 để nằm ngang
                                                                        alignItems: 'center',
                                                                        gap: 1,
                                                                        py: 1,
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    {(isActiveYear && canCreate) || canUpdate ? (
                                                                        <Tooltip title="Đánh giá trẻ">
                                                                            <IconButton
                                                                                size="small"
                                                                                color={
                                                                                    assessment ? 'primary' : 'default'
                                                                                }
                                                                                onClick={() =>
                                                                                    handleOpenAssessment(student, day)
                                                                                }
                                                                                sx={{ p: 0.5 }}
                                                                            >
                                                                                <RateReviewIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    ) : null}

                                                                    {assessment ? (
                                                                        <Tooltip
                                                                            arrow
                                                                            placement="top"
                                                                            title={
                                                                                <Box
                                                                                    sx={{
                                                                                        display: 'flex',
                                                                                        flexDirection: 'column',
                                                                                        // gap: 1,
                                                                                        p: 0.5,
                                                                                    }}
                                                                                >
                                                                                    {/* Tình trạng sức khỏe */}
                                                                                    <Box>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                fontWeight: 700,
                                                                                                color: '#bfdbfe', // xanh nhạt cho label
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                gap: 0.5,
                                                                                                mb: 0.25,
                                                                                            }}
                                                                                        >
                                                                                            <HealthAndSafetyOutlinedIcon
                                                                                                sx={{
                                                                                                    color: '#e43333ff',
                                                                                                    mr: 1,
                                                                                                }}
                                                                                            />
                                                                                            Tình trạng sức khỏe
                                                                                        </Typography>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                color: '#e5e7eb',
                                                                                                whiteSpace: 'pre-line',
                                                                                                ml: 0.5,
                                                                                            }}
                                                                                        >
                                                                                            {assessment.healthStatus ||
                                                                                                'Chưa nhập'}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    {/* Trạng thái cảm xúc, thái độ hành vi */}
                                                                                    <Box>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                fontWeight: 700,
                                                                                                color: '#bfdbfe',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                gap: 0.5,
                                                                                                mb: 0.25,
                                                                                            }}
                                                                                        >
                                                                                            <AddReactionOutlinedIcon
                                                                                                sx={{
                                                                                                    color: '#ebde2dff',
                                                                                                    mr: 1,
                                                                                                }}
                                                                                            />
                                                                                            Trạng thái cảm xúc, thái độ
                                                                                            hành vi
                                                                                        </Typography>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                color: '#e5e7eb',
                                                                                                whiteSpace: 'pre-line',
                                                                                                ml: 0.5,
                                                                                            }}
                                                                                        >
                                                                                            {assessment.emotionalBehavior ||
                                                                                                'Chưa nhập'}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    {/* Kiến thức kỹ năng */}
                                                                                    <Box>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                fontWeight: 700,
                                                                                                color: '#bfdbfe',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                gap: 0.5,
                                                                                                mb: 0.25,
                                                                                            }}
                                                                                        >
                                                                                            <LightbulbOutlinedIcon
                                                                                                sx={{
                                                                                                    color: '#7ce4b0ff',
                                                                                                    mr: 1,
                                                                                                }}
                                                                                            />
                                                                                            Kiến thức kỹ năng
                                                                                        </Typography>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                color: '#e5e7eb',
                                                                                                whiteSpace: 'pre-line',
                                                                                                ml: 0.5,
                                                                                            }}
                                                                                        >
                                                                                            {assessment.skillsKnowledge ||
                                                                                                'Chưa nhập'}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    {/* Lưu ý */}
                                                                                    <Box
                                                                                        sx={{
                                                                                            mt: 0.5,
                                                                                            pt: 0.5,
                                                                                            borderTop:
                                                                                                '1px dashed rgba(148, 163, 184, 0.6)',
                                                                                        }}
                                                                                    >
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                fontWeight: 700,
                                                                                                color: '#fee2e2',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                gap: 0.5,
                                                                                                mb: 0.25,
                                                                                            }}
                                                                                        >
                                                                                            Lưu ý
                                                                                        </Typography>
                                                                                        <Typography
                                                                                            variant="caption"
                                                                                            sx={{
                                                                                                color: '#e5e7eb',
                                                                                                fontStyle:
                                                                                                    assessment.notes
                                                                                                        ? 'normal'
                                                                                                        : 'italic',
                                                                                                whiteSpace: 'pre-line',
                                                                                            }}
                                                                                        >
                                                                                            {assessment.notes ||
                                                                                                'Không có'}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                </Box>
                                                                            }
                                                                            slotProps={{
                                                                                tooltip: {
                                                                                    sx: {
                                                                                        maxWidth: 420,
                                                                                        bgcolor: '#0f172a', // nền xanh đậm
                                                                                        color: '#e5e7eb',
                                                                                        borderRadius: 2,
                                                                                        border: '1px solid #1d4ed8',
                                                                                        boxShadow:
                                                                                            '0 8px 24px rgba(15,23,42,0.7)',
                                                                                        p: 1.5,
                                                                                        whiteSpace: 'normal',
                                                                                        '& .MuiTooltip-arrow': {
                                                                                            color: '#0f172a',
                                                                                        },
                                                                                    },
                                                                                },
                                                                            }}
                                                                        >
                                                                            <Chip
                                                                                label="Đã đánh giá"
                                                                                color="success"
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{
                                                                                    fontSize: '0.7rem',
                                                                                    cursor: 'pointer',
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Chip
                                                                            label="Chưa đánh giá"
                                                                            color="default"
                                                                            size="small"
                                                                            sx={{ fontSize: '0.7rem' }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Legend */}
                    {weekDays.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Chip label="Đã đánh giá" color="success" size="small" variant="outlined" />
                            <Chip label="Chưa đánh giá" color="default" size="small" />
                            {/* <Chip label="Vắng có phép" color="warning" size="small" /> */}
                            {/* <Chip label="Vắng không phép" color="error" size="small" /> */}
                            {/* <Chip label="Chưa điểm danh" color="default" size="small" /> */}
                            {/* ✅ Legend cho học sinh có "Lưu ý" */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box
                                    sx={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        bgcolor: '#d32f2f',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    !
                                </Box>
                                <Typography variant="caption" color="#d32f2f" fontWeight={600}>
                                    Có ghi chú Lưu ý
                                </Typography>
                            </Box>
                        </Box>
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
