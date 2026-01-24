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

    // ✅ HÀM KHỞI TẠO TỔNG THỂ (FETCH NHANH CÙNG LÚC)
    const initializeData = async () => {
        try {
            setInitialLoading(true);

            // Bước 1: Tải danh sách năm học
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

            // Bước 2: Tải song song Lớp học, Tuần và Ngày nghỉ của năm học đó
            const [classRes, weekRes, scheduleRes] = await Promise.all([
                parentChildrenApi.getStudentClassesByYear(yearId),
                parentChildrenApi.getScheduleWeeks(yearId),
                scheduleApi.getByAcademicYear(yearId),
            ]);

            // Xử lý Lớp học
            const classList = classRes.data.data.classes || [];
            setClasses(classList);
            const firstClassId = classList.length > 0 ? classList[0]._id : '';
            setSelectedClass(firstClassId);

            // Xử lý Ngày nghỉ
            if (scheduleRes.data.data) {
                const holidaysRes = await scheduleApi.getHolidays(scheduleRes.data.data._id);
                setHolidays(holidaysRes.data.data.holidays || []);
            }

            // Xử lý Tuần & Tự động chọn tuần hiện tại
            const weeksList = weekRes.data.data.weeks || [];
            setWeeks(weeksList);

            let weekNumToFetch = '';
            if (weeksList.length > 0) {
                const today = dayjs();
                const currentWeek = weeksList.find((w) => {
                    const start = dayjs(w.startDate).startOf('day');
                    // ✅ Mở rộng phạm vi đến hết ngày Chủ Nhật
                    const endOfSunday = start.add(6, 'day').endOf('day');
                    return today.isSameOrAfter(start) && today.isSameOrBefore(endOfSunday);
                });

                weekNumToFetch = currentWeek ? currentWeek.weekNumber.toString() : weeksList[0].weekNumber.toString();
                setSelectedWeek(weekNumToFetch);
            }

            // Bước 3: Nếu có đủ thông tin, tải luôn nội dung thời khóa biểu
            if (yearId && firstClassId && weekNumToFetch) {
                const planRes = await parentChildrenApi.getWeeklyPlan({
                    academicYearId: yearId,
                    classId: firstClassId,
                    weekNumber: weekNumToFetch,
                });
                setWeeklyPlan(planRes.data.data.weeklyPlan);
                setWeekData(planRes.data.data.weekData);
            }
        } catch (error) {
            console.error('❌ [Schedule] Error initializing:', error);
            toast.error('Lỗi khi khởi tạo dữ liệu thời khóa biểu');
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        initializeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Effect xử lý khi người dùng thay đổi Năm học thủ công
    useEffect(() => {
        // Chỉ chạy khi không phải là lần load đầu tiên (tránh lặp request vì initializeData đã làm rồi)
        if (selectedYear && !initialLoading) {
            const reloadData = async () => {
                setLoading(true);
                try {
                    // Bước 1: Fetch song song Lớp học và Tuần
                    const [classRes, weekRes] = await Promise.all([
                        parentChildrenApi.getStudentClassesByYear(selectedYear),
                        parentChildrenApi.getScheduleWeeks(selectedYear),
                    ]);

                    // Bước 2: Xử lý danh sách lớp
                    const classList = classRes.data.data.classes || [];
                    setClasses(classList);
                    setSelectedClass(classList.length > 0 ? classList[0]._id : '');

                    // Bước 3: Xử lý danh sách tuần và Logic Auto-select
                    const weeksList = weekRes.data.data.weeks || [];
                    setWeeks(weeksList);

                    if (weeksList.length > 0) {
                        // Kiểm tra nếu năm học đang chọn là năm học active
                        const isSelectingActiveYear = selectedYear === activeYearId;

                        if (isSelectingActiveYear) {
                            // ✅ NẾU CHỌN NĂM ACTIVE: Tìm tuần hiện tại theo thời gian thực (Bao gồm T7, CN)
                            const today = dayjs();
                            const currentWeek = weeksList.find((w) => {
                                const start = dayjs(w.startDate).startOf('day');
                                // ✅ Mở rộng phạm vi đến hết ngày Chủ Nhật
                                const endOfSunday = start.add(6, 'day').endOf('day');
                                return today.isSameOrAfter(start) && today.isSameOrBefore(endOfSunday);
                            });

                            setSelectedWeek(
                                currentWeek ? currentWeek.weekNumber.toString() : weeksList[0].weekNumber.toString(),
                            );
                        } else {
                            // NẾU CHỌN NĂM CŨ: Mặc định chọn tuần 1
                            setSelectedWeek(weeksList[0].weekNumber.toString());
                        }
                    } else {
                        setSelectedWeek('');
                    }

                    // Bước 4: Cập nhật lại danh sách ngày nghỉ cho năm học mới
                    fetchHolidays();
                } catch (error) {
                    console.error('❌ [Schedule] Error reloading data:', error);
                    toast.error('Lỗi khi tải dữ liệu năm học mới');
                } finally {
                    setLoading(false);
                }
            };
            reloadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Effect xử lý khi đổi Lớp học hoặc Tuần thủ công
    useEffect(() => {
        if (selectedClass && selectedYear && selectedWeek && !initialLoading) {
            fetchWeeklyPlan();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedWeek]);

    useEffect(() => {
        if (selectedClass && selectedYear && selectedWeek) {
            fetchWeeklyPlan();
        } else {
            setWeeklyPlan(null);
            setWeekData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear, selectedWeek]);

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
                                    <strong>Năm học đã kết thúc</strong>
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
                                                    {day} ({date.format('DD/MM')})
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
                                                                ———
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
