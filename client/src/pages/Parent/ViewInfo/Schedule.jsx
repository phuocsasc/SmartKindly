// client/src/pages/Parent/ViewInfo/Schedule.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
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
    Chip,
    Alert,
} from '@mui/material';
import { DoneOutlined as DoneIcon } from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { scheduleApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

function Schedule() {
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

    const [weeklyPlan, setWeeklyPlan] = useState(null);
    const [weekData, setWeekData] = useState(null);
    const [holidays, setHolidays] = useState([]); // ✅ ADD: State for holidays

    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchClassesByYear();
            fetchHolidays(); // ✅ ADD: Fetch holidays when year changes
        } else {
            setClasses([]);
            setSelectedClass('');
            setWeeks([]);
            setSelectedWeek('');
            setWeeklyPlan(null);
            setWeekData(null);
            setHolidays([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (selectedClass && selectedYear) {
            fetchWeeks();
        } else {
            setWeeks([]);
            setSelectedWeek('');
            setWeeklyPlan(null);
            setWeekData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear]);

    useEffect(() => {
        if (selectedClass && selectedYear && selectedWeek) {
            fetchWeeklyPlan();
        } else {
            setWeeklyPlan(null);
            setWeekData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear, selectedWeek]);

    const fetchAcademicYears = async () => {
        try {
            setInitialLoading(true);
            const res = await parentChildrenApi.getAcademicYears();
            const data = res.data.data;

            setAcademicYears(data.academicYears);
            setActiveYearId(data.activeYearId);

            if (data.activeYearId) {
                setSelectedYear(data.activeYearId);
            } else if (data.academicYears.length > 0) {
                setSelectedYear(data.academicYears[0]._id);
            }
        } catch (error) {
            console.error('❌ [Schedule] Error fetching academic years:', error);
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách năm học');
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
            console.error('❌ [Schedule] Error fetching classes:', error);
            toast.error(error?.response?.data?.message || 'Không thể tải danh sách lớp học');
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

            setWeeks(data.weeks);
            setSelectedWeek(data.weeks[0].weekNumber.toString());
        } catch (error) {
            console.error('❌ [Schedule] Error fetching weeks:', error);
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    // ✅ ADD: Fetch holidays
    const fetchHolidays = async () => {
        try {
            if (!selectedYear) return;

            const scheduleRes = await scheduleApi.getByAcademicYear(selectedYear);
            const schedule = scheduleRes.data.data;

            if (schedule) {
                const holidaysRes = await scheduleApi.getHolidays(schedule._id);
                setHolidays(holidaysRes.data.data.holidays || []);
                console.log('✅ [Schedule] Holidays loaded:', holidaysRes.data.data.holidays?.length || 0);
            } else {
                setHolidays([]);
            }
        } catch (error) {
            console.error('❌ [Schedule] Error fetching holidays:', error);
            setHolidays([]);
            // Don't show toast for 404 (no schedule yet)
            if (error?.response?.status !== 404) {
                toast.error('Lỗi khi tải danh sách ngày nghỉ!');
            }
        }
    };

    // ✅ ADD: Check if date is holiday
    const isHoliday = (date) => {
        if (!date) return false;
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    };

    const fetchWeeklyPlan = async () => {
        try {
            setLoading(true);
            const res = await parentChildrenApi.getWeeklyPlan({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const data = res.data.data;
            setWeeklyPlan(data.weeklyPlan);
            setWeekData(data.weekData);
        } catch (error) {
            console.error('❌ [Schedule] Error fetching weekly plan:', error);
            if (error?.response?.status !== 404) {
                toast.error(error?.response?.data?.message || 'Không thể tải kế hoạch giáo dục');
            }
            setWeeklyPlan(null);
            setWeekData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (newYearId) => {
        console.log('📅 [Schedule] Changing year to:', newYearId);

        // Reset all dependent states
        setSelectedYear(newYearId);
        setClasses([]);
        setSelectedClass('');
        setWeeks([]);
        setSelectedWeek('');
        setWeeklyPlan(null);
        setWeekData(null);
        setHolidays([]);
    };

    const formatWeekDisplay = (week) => {
        if (!week.startDate || !week.endDate) {
            return `Tuần ${week.weekNumber}`;
        }
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    const getDayContent = (dayIndex, periodId) => {
        if (!weeklyPlan) return null;

        const dayMapping = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const dayKey = dayMapping[dayIndex];
        const dayActivities = weeklyPlan[dayKey] || [];

        const activity = dayActivities.find((a) => {
            const activityId = a.activityPeriodId?._id || a.activityPeriodId;
            const targetId = periodId?._id || periodId;
            return activityId?.toString() === targetId?.toString();
        });

        return activity?.detailedContent || '';
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
                <PageBreadcrumb items={[{ text: 'Thời khóa biểu' }]} />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#667eea' }}>
                        Thời khóa biểu
                    </Typography>

                    {/* Filters */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                        {/* Select Năm học */}
                        <Grid item xs={12} sm={3}>
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
                            <Grid item xs={12} sm={3}>
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

                        {/* Select Tuần */}
                        {weeks.length > 0 && (
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Tuần</InputLabel>
                                    <Select
                                        value={selectedWeek}
                                        onChange={(e) => setSelectedWeek(e.target.value)}
                                        label="Tuần"
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
                    {selectedYear && selectedYear !== activeYearId && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                            <strong>Năm học đã kết thúc</strong> - Đang xem dữ liệu lịch sử
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

                    {/* Loading */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : !weeklyPlan || !weekData ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            {!selectedYear
                                ? 'Vui lòng chọn năm học'
                                : !selectedClass
                                  ? 'Vui lòng chọn lớp học'
                                  : !selectedWeek
                                    ? 'Vui lòng chọn tuần'
                                    : 'Chưa có kế hoạch giáo dục cho tuần này'}
                        </Alert>
                    ) : (
                        /* Table */
                        <TableContainer
                            component={Paper}
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                maxHeight: 600,
                                overflow: 'auto',
                            }}
                        >
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#ede7f6',
                                                minWidth: 150,
                                                borderRight: '2px solid #d1c4e9',
                                            }}
                                        >
                                            Mốc hoạt động
                                        </TableCell>
                                        {WEEKDAYS.map((day, index) => {
                                            const date = dayjs(weekData.startDate).add(index, 'day');
                                            return (
                                                <TableCell
                                                    key={day}
                                                    align="center"
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: '#e3f2fd',
                                                        minWidth: 200,
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography variant="body2">{day}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {date.format('DD/MM')}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {weekData.activityPeriods.map((period, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell
                                                sx={{
                                                    borderRight: '2px solid #d1c4e9',
                                                    bgcolor: '#f9f9f9',
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600} color="primary">
                                                        {period.startTime} - {period.endTime}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {period.description}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            {WEEKDAYS.map((day, dayIndex) => {
                                                const date = dayjs(weekData.startDate).add(dayIndex, 'day');
                                                const holiday = isHoliday(date);

                                                // ✅ CHANGE: Show "Ngày Nghỉ" chip if holiday
                                                if (holiday) {
                                                    return (
                                                        <TableCell
                                                            key={day}
                                                            sx={{
                                                                bgcolor: '#ffebee',
                                                                verticalAlign: 'middle',
                                                                textAlign: 'center',
                                                                py: 1,
                                                                px: 1.5,
                                                            }}
                                                        >
                                                            <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                        </TableCell>
                                                    );
                                                }

                                                // ✅ Normal day - show content
                                                const content = getDayContent(
                                                    dayIndex,
                                                    period._id || period.activityPeriodId,
                                                );
                                                const hasContent = content && content.trim().length > 0;

                                                return (
                                                    <TableCell
                                                        key={day}
                                                        sx={{
                                                            bgcolor: '#fafafa',
                                                            verticalAlign: 'top',
                                                            py: 1,
                                                            px: 1.5,
                                                        }}
                                                    >
                                                        {hasContent ? (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    color: '#424242',
                                                                    lineHeight: 1.6,
                                                                }}
                                                            >
                                                                {content}
                                                            </Typography>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.disabled"
                                                                align="center"
                                                            >
                                                                —
                                                            </Typography>
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
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default Schedule;
