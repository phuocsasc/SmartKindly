// client/src/pages/Parent/ViewInfo/DailyAssessment.jsx

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
    CheckCircle as CheckCircleIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

// Helper: Get attendance chip props
const getAttendanceChipProps = (status) => {
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

function DailyAssessment() {
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

    const [assessmentData, setAssessmentData] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [days, setDays] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [assessmentMap, setAssessmentMap] = useState({});
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
            setAssessmentData(null);
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
            setAssessmentData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear]);

    // ✅ Fetch assessment when week changes
    useEffect(() => {
        if (selectedClass && selectedYear && selectedWeek) {
            fetchDailyAssessment();
        } else {
            setAssessmentData(null);
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

            // Step 3: Load assessment
            if (yearId && firstClassId && weekNumToFetch) {
                const assessmentRes = await parentChildrenApi.getDailyAssessment({
                    academicYearId: yearId,
                    classId: firstClassId,
                    weekNumber: weekNumToFetch,
                });
                const data = assessmentRes.data.data;
                setAssessmentData(data);
                setCurrentWeekData(data.weekData);
                setHolidays(data.holidays || []);
                setDays(data.days || []);
                setAttendanceMap(data.attendanceMap || {});
                setAssessmentMap(data.assessmentMap || {});
                setStudent(data.student);
            }
        } catch (error) {
            console.error('❌ [DailyAssessment] Initialization error:', error);
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

    const fetchDailyAssessment = async () => {
        try {
            setLoading(true);
            const res = await parentChildrenApi.getDailyAssessment({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const data = res.data.data;
            setAssessmentData(data);
            setCurrentWeekData(data.weekData);
            setHolidays(data.holidays || []);
            setDays(data.days || []);
            setAttendanceMap(data.attendanceMap || {});
            setAssessmentMap(data.assessmentMap || {});
            setStudent(data.student);
        } catch (error) {
            console.error('❌ Error fetching daily assessment:', error);
            if (error?.response?.status !== 404) {
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin đánh giá hằng ngày');
            }
            setAssessmentData(null);
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
        setAssessmentData(null);
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
                <PageBreadcrumb items={[{ text: 'Đánh giá hằng ngày' }]} />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Đánh giá trẻ hằng ngày
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

                    {/* Student Info Cards */}
                    {student && assessmentData && (
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

                            {/* Card 2: Đã đánh giá trong tuần */}
                            <Grid item xs={12} md={4}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        border: '2px solid #e8f5e9',
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 16px rgba(76, 175, 80, 0.2)',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Đã đánh giá trong tuần {currentWeekData?.weekNumber}
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a202c' }}>
                                                    {assessmentData.assessedInWeek} ngày
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

                            {/* Card 3: Tổng đã đánh giá trong năm */}
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
                                            <CalendarIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Tổng đã đánh giá trong năm học
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a202c' }}>
                                                    {assessmentData.totalAssessedInYear} ngày
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {assessmentData.academicYear.fromYear}-
                                                    {assessmentData.academicYear.toYear}
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
                    ) : !assessmentData || !currentWeekData ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            {!selectedYear
                                ? 'Vui lòng chọn năm học'
                                : !selectedClass
                                  ? 'Vui lòng chọn lớp học'
                                  : !selectedWeek
                                    ? 'Vui lòng chọn tuần'
                                    : 'Chưa có dữ liệu đánh giá cho tuần này'}
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
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#ede7f6',
                                                minWidth: 120,
                                                borderRight: '2px solid #d1c4e9',
                                            }}
                                        >
                                            Tiêu chí
                                        </TableCell>
                                        {WEEKDAYS.map((day, index) => {
                                            const date = days[index];
                                            return (
                                                <TableCell
                                                    key={day}
                                                    align="center"
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: '#e3f2fd',
                                                        minWidth: 180,
                                                    }}
                                                >
                                                    {day} ({dayjs(date).format('DD/MM')})
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {/* Row 1: Điểm danh */}
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: '2px solid #d1c4e9',
                                                bgcolor: '#f9f9f9',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Điểm danh
                                        </TableCell>
                                        {days.map((date) => {
                                            const holiday = isHoliday(date);
                                            const attendance = attendanceMap[date];
                                            const chipProps = getAttendanceChipProps(attendance?.status);

                                            if (holiday) {
                                                return (
                                                    <TableCell
                                                        key={date}
                                                        sx={{
                                                            bgcolor: '#ffebee',
                                                            verticalAlign: 'middle',
                                                            textAlign: 'center',
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell
                                                    key={date}
                                                    sx={{
                                                        bgcolor: '#fafafa',
                                                        textAlign: 'center',
                                                        py: 2,
                                                    }}
                                                >
                                                    <Chip
                                                        label={chipProps.label}
                                                        color={chipProps.color}
                                                        size="small"
                                                        sx={{ fontWeight: 700, minWidth: 40 }}
                                                    />
                                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                        {chipProps.fullLabel}
                                                    </Typography>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Row 2: Tình hình sức khỏe */}
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: '2px solid #d1c4e9',
                                                bgcolor: '#f9f9f9',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Tình hình sức khỏe
                                        </TableCell>
                                        {days.map((date) => {
                                            const holiday = isHoliday(date);
                                            const assessment = assessmentMap[date];

                                            if (holiday) {
                                                return (
                                                    <TableCell
                                                        key={date}
                                                        sx={{
                                                            bgcolor: '#ffebee',
                                                            verticalAlign: 'middle',
                                                            textAlign: 'center',
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell
                                                    key={date}
                                                    sx={{
                                                        bgcolor: '#fafafa',
                                                        verticalAlign: 'top',
                                                        py: 1.5,
                                                        px: 1.5,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: assessment?.healthStatus
                                                                ? '#424242'
                                                                : 'text.disabled',
                                                            fontStyle: assessment?.healthStatus ? 'normal' : 'italic',
                                                            whiteSpace: 'pre-line',
                                                        }}
                                                    >
                                                        {assessment?.healthStatus || 'Chưa đánh giá'}
                                                    </Typography>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Row 3: Cảm xúc, Hành vi */}
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: '2px solid #d1c4e9',
                                                bgcolor: '#f9f9f9',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Cảm xúc, Hành vi
                                        </TableCell>
                                        {days.map((date) => {
                                            const holiday = isHoliday(date);
                                            const assessment = assessmentMap[date];

                                            if (holiday) {
                                                return (
                                                    <TableCell
                                                        key={date}
                                                        sx={{
                                                            bgcolor: '#ffebee',
                                                            verticalAlign: 'middle',
                                                            textAlign: 'center',
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell
                                                    key={date}
                                                    sx={{
                                                        bgcolor: '#fafafa',
                                                        verticalAlign: 'top',
                                                        py: 1.5,
                                                        px: 1.5,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: assessment?.emotionalBehavior
                                                                ? '#424242'
                                                                : 'text.disabled',
                                                            fontStyle: assessment?.emotionalBehavior
                                                                ? 'normal'
                                                                : 'italic',
                                                            whiteSpace: 'pre-line',
                                                        }}
                                                    >
                                                        {assessment?.emotionalBehavior || 'Chưa đánh giá'}
                                                    </Typography>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Row 4: Kiến thức, Kỹ năng */}
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: '2px solid #d1c4e9',
                                                bgcolor: '#f9f9f9',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Kiến thức, Kỹ năng
                                        </TableCell>
                                        {days.map((date) => {
                                            const holiday = isHoliday(date);
                                            const assessment = assessmentMap[date];

                                            if (holiday) {
                                                return (
                                                    <TableCell
                                                        key={date}
                                                        sx={{
                                                            bgcolor: '#ffebee',
                                                            verticalAlign: 'middle',
                                                            textAlign: 'center',
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell
                                                    key={date}
                                                    sx={{
                                                        bgcolor: '#fafafa',
                                                        verticalAlign: 'top',
                                                        py: 1.5,
                                                        px: 1.5,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: assessment?.skillsKnowledge
                                                                ? '#424242'
                                                                : 'text.disabled',
                                                            fontStyle: assessment?.skillsKnowledge
                                                                ? 'normal'
                                                                : 'italic',
                                                            whiteSpace: 'pre-line',
                                                        }}
                                                    >
                                                        {assessment?.skillsKnowledge || 'Chưa đánh giá'}
                                                    </Typography>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>

                                    {/* Row 5: Ghi chú */}
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                borderRight: '2px solid #d1c4e9',
                                                bgcolor: '#f9f9f9',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Ghi chú
                                        </TableCell>
                                        {days.map((date) => {
                                            const holiday = isHoliday(date);
                                            const assessment = assessmentMap[date];

                                            if (holiday) {
                                                return (
                                                    <TableCell
                                                        key={date}
                                                        sx={{
                                                            bgcolor: '#ffebee',
                                                            verticalAlign: 'middle',
                                                            textAlign: 'center',
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell
                                                    key={date}
                                                    sx={{
                                                        bgcolor: '#fafafa',
                                                        verticalAlign: 'top',
                                                        py: 1.5,
                                                        px: 1.5,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: assessment?.notes ? '#424242' : 'text.disabled',
                                                            fontStyle: assessment?.notes ? 'normal' : 'italic',
                                                            whiteSpace: 'pre-line',
                                                        }}
                                                    >
                                                        {assessment?.notes || 'Không có ghi chú'}
                                                    </Typography>
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

export default DailyAssessment;
