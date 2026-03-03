// client/src/pages/Parent/ViewInfo/Attendance.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Chip,
    Grid,
    Card,
    CardContent,
    Stack,
} from '@mui/material';
import {
    DoneOutlined as DoneIcon,
    Person as PersonIcon,
    EventBusy as AbsentWeekIcon, // ✅ NEW: Icon cho vắng tuần
    CalendarMonth as AbsentYearIcon, // ✅ NEW: Icon cho vắng năm
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

// Helper: Get status chip props
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

function Attendance() {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');

    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');

    const [attendanceData, setAttendanceData] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [days, setDays] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [student, setStudent] = useState(null);

    // ✅ Initialize data
    useEffect(() => {
        initializeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch classes when year changes
    useEffect(() => {
        if (selectedYear) {
            fetchClassesByYear();
        } else {
            setClasses([]);
            setSelectedClass('');
            setWeeks([]);
            setSelectedWeek('');
            setAttendanceData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Fetch weeks when class changes
    useEffect(() => {
        if (selectedClass && selectedYear) {
            fetchWeeks();
        } else {
            setWeeks([]);
            setSelectedWeek('');
            setAttendanceData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear]);

    // ✅ Fetch attendance when week changes
    useEffect(() => {
        if (selectedClass && selectedYear && selectedWeek) {
            fetchAttendance();
        } else {
            setAttendanceData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear, selectedWeek]);

    const initializeData = async () => {
        try {
            setInitialLoading(true);

            // Step 1: Load academic years
            const yearRes = await parentChildrenApi.getAcademicYears();
            const yearData = yearRes.data.data;
            setAcademicYears(yearData.academicYears);
            setActiveYearId(yearData.activeYearId);

            const yearId =
                yearData.activeYearId || (yearData.academicYears.length > 0 ? yearData.academicYears[0]._id : null);
            if (!yearId) {
                setInitialLoading(false);
                return;
            }
            setSelectedYear(yearId);

            // Step 2: Load classes and weeks
            const [classRes, weekRes] = await Promise.all([
                parentChildrenApi.getStudentClassesByYear(yearId),
                parentChildrenApi.getScheduleWeeks(yearId),
            ]);

            const classList = classRes.data.data.classes || [];
            setClasses(classList);
            const firstClassId = classList.length > 0 ? classList[0]._id : '';
            setSelectedClass(firstClassId);

            const weeksList = weekRes.data.data.weeks || [];
            setWeeks(weeksList);

            let weekNumToFetch = '';
            if (weeksList.length > 0) {
                const today = dayjs();
                const currentWeek = weeksList.find((w) => {
                    const start = dayjs(w.startDate).startOf('day');
                    const endOfSunday = start.add(6, 'day').endOf('day');
                    return today.isSameOrAfter(start) && today.isSameOrBefore(endOfSunday);
                });

                weekNumToFetch = currentWeek ? currentWeek.weekNumber.toString() : weeksList[0].weekNumber.toString();
                setSelectedWeek(weekNumToFetch);
            }

            // Step 3: Load attendance
            if (yearId && firstClassId && weekNumToFetch) {
                const attendanceRes = await parentChildrenApi.getAttendance({
                    academicYearId: yearId,
                    classId: firstClassId,
                    weekNumber: weekNumToFetch,
                });
                const data = attendanceRes.data.data;
                setAttendanceData(data);
                setCurrentWeekData(data.weekData);
                setHolidays(data.holidays || []);
                setDays(data.days || []);
                setAttendanceMap(data.attendanceMap || {});
                setStudent(data.student);
            }
        } catch (error) {
            console.error('❌ [Attendance] Initialization error:', error);
            toast.error('Không thể tải dữ liệu ban đầu');
        } finally {
            setInitialLoading(false);
        }
    };

    const fetchClassesByYear = async () => {
        try {
            const res = await parentChildrenApi.getStudentClassesByYear(selectedYear);
            const data = res.data.data;
            setClasses(data.classes);

            if (data.classes.length > 0) {
                setSelectedClass(data.classes[0]._id);
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

    const fetchWeeks = async () => {
        try {
            if (!selectedYear) return;

            const res = await parentChildrenApi.getScheduleWeeks(selectedYear);
            const data = res.data.data;

            if (!data || !data.weeks || data.weeks.length === 0) {
                setWeeks([]);
                setSelectedWeek('');
                return;
            }

            const weeksList = data.weeks;
            setWeeks(weeksList);

            // ✅ ĐỒNG BỘ LOGIC: Tự động chọn tuần hiện tại bao gồm cả T7, CN
            const today = dayjs();
            const currentWeek = weeksList.find((w) => {
                const start = dayjs(w.startDate).startOf('day');
                const endOfSunday = start.add(6, 'day').endOf('day');
                return today.isSameOrAfter(start) && today.isSameOrBefore(endOfSunday);
            });

            setSelectedWeek(currentWeek ? currentWeek.weekNumber.toString() : weeksList[0].weekNumber.toString());
        } catch (error) {
            console.error('❌ Error fetching weeks:', error);
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await parentChildrenApi.getAttendance({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const data = res.data.data;
            setAttendanceData(data);
            setCurrentWeekData(data.weekData);
            setHolidays(data.holidays || []);
            setDays(data.days || []);
            setAttendanceMap(data.attendanceMap || {});
            setStudent(data.student);
        } catch (error) {
            console.error('❌ Error fetching attendance:', error);
            if (error?.response?.status !== 404) {
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin điểm danh');
            }
            setAttendanceData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (newYearId) => {
        setSelectedYear(newYearId);
        setClasses([]);
        setSelectedClass('');
        setWeeks([]);
        setSelectedWeek('');
        setAttendanceData(null);
    };

    const formatWeekDisplay = (week) => {
        if (!week.startDate || !week.endDate) {
            return `Tuần ${week.weekNumber}`;
        }
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    const isHoliday = (date) => {
        if (!date) return false;
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    };

    if (initialLoading) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress />
                    </Box>
                </PageContainer>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Điểm danh' }]} />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Điểm danh hằng tuần
                    </Typography>

                    {/* Filters */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                        {/* Select Năm học */}
                        <Grid item xs={12} sm={4}>
                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5,
                                        '&:hover fieldset': { borderColor: '#0071bc' },
                                        '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#0071bc' },
                                    '& .MuiSelect-icon': { color: '#6f6f6f' },
                                }}
                            >
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => handleYearChange(e.target.value)}
                                    label="Năm học"
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    '&:hover': { bgcolor: '#e3f2fd', color: '#0071bc' },
                                                    '&.Mui-selected': {
                                                        bgcolor: '#e3f2fd !important',
                                                        color: '#0071bc',
                                                        fontWeight: 700,
                                                    },
                                                },
                                            },
                                        },
                                    }}
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
                                <FormControl
                                    fullWidth
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            '&:hover fieldset': { borderColor: '#0071bc' },
                                            '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#0071bc' },
                                        '& .MuiSelect-icon': { color: '#6f6f6f' },
                                    }}
                                >
                                    <InputLabel>Lớp học</InputLabel>
                                    <Select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        label="Lớp học"
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    '& .MuiMenuItem-root': {
                                                        '&:hover': { bgcolor: '#e3f2fd', color: '#0071bc' },
                                                        '&.Mui-selected': {
                                                            bgcolor: '#e3f2fd !important',
                                                            color: '#0071bc',
                                                            fontWeight: 700,
                                                        },
                                                    },
                                                },
                                            },
                                        }}
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

                        {/* Select Tuần */}
                        {weeks.length > 0 && (
                            <Grid item xs={12} sm={4}>
                                <FormControl
                                    fullWidth
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            '&:hover fieldset': { borderColor: '#0071bc' },
                                            '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#0071bc' },
                                        '& .MuiSelect-icon': { color: '#6f6f6f' },
                                    }}
                                >
                                    <InputLabel>Tuần</InputLabel>
                                    <Select
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(e.target.value)}
                                        label="Tuần"
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    maxHeight: 48 * 6 + 8, // Giới hạn 6 mục
                                                    '&::-webkit-scrollbar': { width: '6px' },
                                                    '&::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1' },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        backgroundColor: '#0071bc',
                                                        borderRadius: '4px',
                                                    },
                                                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#005a9e' },
                                                    '& .MuiMenuItem-root': {
                                                        '&:hover': { bgcolor: '#e3f2fd', color: '#0071bc' },
                                                        '&.Mui-selected': {
                                                            bgcolor: '#e3f2fd !important',
                                                            color: '#0071bc',
                                                            fontWeight: 700,
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        {weeks.map((week) => (
                                            <MenuItem key={week.weekNumber} value={week.weekNumber.toString()}>
                                                {formatWeekDisplay(week)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                    </Grid>

                    {/* Alerts */}
                    {selectedYear && (
                        <Alert
                            severity={selectedYear === activeYearId ? 'success' : 'warning'}
                            sx={{ mb: 2, borderRadius: 2 }}
                        >
                            {selectedYear === activeYearId ? (
                                <>
                                    <strong>Năm học đang hoạt động</strong>
                                </>
                            ) : (
                                <>
                                    <strong>Năm học đã kết thúc</strong> - Đang xem dữ liệu lịch sử
                                </>
                            )}
                        </Alert>
                    )}

                    {classes.length === 0 && selectedYear && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            Không tìm thấy lớp học nào của con bạn trong năm học này
                        </Alert>
                    )}

                    {weeks.length === 0 && selectedYear && selectedClass && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            Năm học này chưa có thời khóa biểu. Vui lòng liên hệ nhà trường.
                        </Alert>
                    )}

                    {/* ✅ UPDATED: Student Info Cards - 3 Cards Layout */}
                    {student && attendanceData && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {/* Card 1: Thông tin học sinh */}
                            <Grid item xs={12} md={4}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: '2px solid #e3f2fd',
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 16px rgba(25, 118, 210, 0.2)',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <PersonIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Học sinh
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a202c' }}>
                                                    {student.fullName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {student.studentCode}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Card 2: Vắng trong tuần */}
                            <Grid item xs={12} md={4}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: '2px solid #fff3e0',
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 16px rgba(255, 152, 0, 0.2)',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <AbsentWeekIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Tổng vắng trong tuần {currentWeekData?.weekNumber}
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a202c' }}>
                                                    {attendanceData.absentInWeek} ngày
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dayjs(currentWeekData?.startDate).format('DD/MM')} -{' '}
                                                    {dayjs(currentWeekData?.endDate).format('DD/MM')}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Card 3: Vắng trong năm */}
                            <Grid item xs={12} md={4}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: '2px solid #ffebee',
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 16px rgba(211, 47, 47, 0.2)',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <AbsentYearIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Tổng vắng trong năm học
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a202c' }}>
                                                    {attendanceData.totalAbsentInYear} ngày
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {attendanceData.academicYear.fromYear}-
                                                    {attendanceData.academicYear.toYear}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : !attendanceData || !currentWeekData ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            {!selectedYear
                                ? 'Vui lòng chọn năm học'
                                : !selectedClass
                                  ? 'Vui lòng chọn lớp học'
                                  : !selectedWeek
                                    ? 'Vui lòng chọn tuần'
                                    : 'Chưa có dữ liệu điểm danh cho tuần này'}
                        </Alert>
                    ) : (
                        /* Table */
                        <TableContainer
                            component={Paper}
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                overflow: 'auto',
                            }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {WEEKDAYS.map((day, index) => {
                                            const date = days[index];
                                            return (
                                                <TableCell
                                                    key={day}
                                                    align="center"
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: '#e3f2fd',
                                                        minWidth: 150,
                                                    }}
                                                >
                                                    {day} ({dayjs(date).format('DD/MM')})
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    <TableRow>
                                        {days.map((date) => {
                                            const holiday = isHoliday(date);
                                            const attendance = attendanceMap[date];
                                            const chipProps = getStatusChipProps(attendance?.status);

                                            if (holiday) {
                                                return (
                                                    <TableCell
                                                        key={date}
                                                        sx={{
                                                            bgcolor: '#ffebee',
                                                            verticalAlign: 'middle',
                                                            textAlign: 'center',
                                                            py: 3,
                                                        }}
                                                    >
                                                        <Chip label="Ngày Nghỉ" color="error" size="medium" />
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell
                                                    key={date}
                                                    sx={{
                                                        bgcolor: '#fafafa',
                                                        verticalAlign: 'top',
                                                        py: 2,
                                                        px: 2,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    <Box>
                                                        <Chip
                                                            label={chipProps.label}
                                                            color={chipProps.color}
                                                            size="medium"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '1rem',
                                                                minWidth: 50,
                                                            }}
                                                        />
                                                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                            {chipProps.fullLabel}
                                                        </Typography>
                                                        {attendance?.note && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                display="block"
                                                                sx={{ mt: 0.5, fontStyle: 'italic' }}
                                                            >
                                                                {attendance.note}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default Attendance;
