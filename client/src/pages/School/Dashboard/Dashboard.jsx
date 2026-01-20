// client/src/pages/School/Dashboard/Dashboard.jsx

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
    Alert,
    Grid,
} from '@mui/material';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import { useUser } from '~/contexts/UserContext';
import { dashboardApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

// Import dashboard components
import TotalChildren from './TotalChildren';
import TotalClasses from './TotalClasses';
import TotalMeals from './TotalMeals';
import TotalMenus from './TotalMenus';
import StudentsPerClass from './StudentsPerClass';
import AttendanceStats from './AttendanceStats';
import AssessmentStats from './AssessmentStats';
import CertificateStats from './CertificateStats';
import YearTargetStats from './YearTargetStats';
import ActivityStats from './ActivityStats';

// ✅ 1. CẤU HÌNH CHIỀU CAO TẠI ĐÂY (Đơn vị: px)
const ROW_HEIGHTS = {
    row1: 400, // Hàng 1: Các thẻ tổng quan (TotalChildren, TotalClasses...)
    row2: 500, // Hàng 2: Các biểu đồ chi tiết (Học sinh, Điểm danh, Đánh giá)
    row3: 500, // Hàng 3: Các thống kê bổ sung (Chứng chỉ, Ăn uống...)
};

function Dashboard() {
    const { user } = useUser();

    // State
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // ✅ ADD: Initial loading state
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [stats, setStats] = useState(null);

    // ✅ Fetch available years
    const fetchAcademicYears = async () => {
        try {
            const res = await dashboardApi.getAvailableYears();
            const years = res.data.data.years;
            setAcademicYears(years);

            // Auto-select active year
            const activeYear = years.find((y) => y.status === 'active');
            return activeYear ? activeYear._id : null;
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
            return null;
        }
    };

    // ✅ Fetch accessible classes
    const fetchClasses = async (yearId) => {
        if (!yearId) return null;

        try {
            const res = await dashboardApi.getAccessibleClasses(yearId);
            const classList = res.data.data.classes;
            setClasses(classList);

            // Return first class ID
            return classList.length > 0 ? classList[0]._id : null;
        } catch (error) {
            console.error('Error fetching classes:', error);
            setClasses([]);
            return null;
        }
    };

    // ✅ Fetch available weeks
    const fetchWeeks = async (yearId) => {
        if (!yearId) return null;

        try {
            const res = await dashboardApi.getAvailableWeeks(yearId);
            const weeksData = res.data.data.weeks;
            setWeeks(weeksData);

            if (weeksData.length > 0) {
                // Lấy thời gian hiện tại theo cấu hình dayjs (đã import từ config có thể là VN)
                // Nếu dayjsConfig chưa set timezone, bạn có thể dùng dayjs().tz('Asia/Ho_Chi_Minh')
                const today = dayjs();

                const currentWeek = weeksData.find((w) => {
                    // startOf('day') và endOf('day') giúp bao phủ toàn bộ ngày đầu và ngày cuối của tuần
                    const start = dayjs(w.startDate).startOf('day');
                    const end = dayjs(w.endDate).endOf('day');

                    return today.isSameOrAfter(start) && today.isSameOrBefore(end);
                });

                // Nếu tìm thấy tuần hiện tại thì trả về, không thì mặc định lấy tuần 1
                return currentWeek ? currentWeek.weekNumber.toString() : weeksData[0].weekNumber.toString();
            }

            return null;
        } catch (error) {
            console.error('Error fetching weeks:', error);
            setWeeks([]);
            return null;
        }
    };

    // ✅ Fetch dashboard stats
    const fetchStats = async (yearId, classId, weekNum) => {
        console.log('🔍 [fetchStats] Called with:', { yearId, classId, weekNum });

        if (!yearId || !classId || !weekNum) {
            console.warn('⚠️ [fetchStats] Missing params:', { yearId, classId, weekNum });
            setStats(null);
            return;
        }

        try {
            setLoading(true);
            console.log('📤 [fetchStats] Sending request:', {
                academicYearId: yearId,
                classId: classId,
                weekNumber: weekNum,
            });

            const res = await dashboardApi.getStats({
                academicYearId: yearId,
                classId: classId,
                weekNumber: weekNum,
            });

            setStats(res.data.data);
            console.log('✅ Dashboard stats loaded:', res.data.data);
        } catch (error) {
            console.error('❌ Error fetching dashboard stats:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Lỗi khi tải thống kê!');
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Initialize: Load all data sequentially
    const initializeDashboard = async () => {
        try {
            setInitialLoading(true);
            console.log('🚀 [initializeDashboard] Starting...');

            // Step 1: Load academic years
            const yearId = await fetchAcademicYears();
            console.log('✅ Step 1 - Year ID:', yearId);

            if (!yearId) {
                console.log('⚠️ No active academic year found');
                setInitialLoading(false);
                return;
            }

            setSelectedYear(yearId);

            // Step 2: Load classes for selected year
            const firstClassId = await fetchClasses(yearId);
            console.log('✅ Step 2 - First Class ID:', firstClassId);

            if (!firstClassId) {
                console.log('⚠️ No accessible classes found');
                setInitialLoading(false);
                return;
            }

            setSelectedClass(firstClassId);

            // Step 3: Load weeks for selected year
            const firstWeekNumber = await fetchWeeks(yearId);
            console.log('✅ Step 3 - First Week Number:', firstWeekNumber);

            if (!firstWeekNumber) {
                console.log('⚠️ No weeks found');
                setInitialLoading(false);
                return;
            }

            setSelectedWeek(firstWeekNumber);

            // Step 4: Load stats with all required params
            console.log('✅ Step 4 - Calling fetchStats with:', {
                yearId,
                firstClassId,
                firstWeekNumber,
            });

            await fetchStats(yearId, firstClassId, firstWeekNumber);
            console.log('✅ [initializeDashboard] Completed successfully');
        } catch (error) {
            console.error('❌ Error initializing dashboard:', error);
            toast.error('Lỗi khi khởi tạo trang thống kê!');
        } finally {
            setInitialLoading(false);
        }
    };

    // ✅ Load initial data on mount
    useEffect(() => {
        initializeDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ When year changes: reload classes and weeks
    useEffect(() => {
        console.log('🔄 [useEffect Year] Triggered:', { selectedYear, initialLoading });

        if (selectedYear && !initialLoading) {
            const reloadData = async () => {
                console.log('🔄 Reloading data for new year...');
                setSelectedClass('');
                setWeeks([]);
                setSelectedWeek('');
                setStats(null);

                const firstClassId = await fetchClasses(selectedYear);
                console.log('✅ New first class ID:', firstClassId);
                if (!firstClassId) return;

                setSelectedClass(firstClassId);

                const firstWeekNumber = await fetchWeeks(selectedYear);
                console.log('✅ New first week number:', firstWeekNumber);
                if (!firstWeekNumber) return;

                setSelectedWeek(firstWeekNumber);

                console.log('✅ Calling fetchStats with new data:', {
                    selectedYear,
                    firstClassId,
                    firstWeekNumber,
                });

                await fetchStats(selectedYear, firstClassId, firstWeekNumber);
            };

            reloadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ When class changes: reload stats
    useEffect(() => {
        console.log('🔄 [useEffect Class] Triggered:', {
            selectedYear,
            selectedClass,
            selectedWeek,
            initialLoading,
        });

        if (selectedYear && selectedClass && selectedWeek && !initialLoading) {
            console.log('✅ Calling fetchStats from class change...');
            fetchStats(selectedYear, selectedClass, selectedWeek);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass]);

    // ✅ When week changes: reload stats
    useEffect(() => {
        console.log('🔄 [useEffect Week] Triggered:', {
            selectedYear,
            selectedClass,
            selectedWeek,
            initialLoading,
        });

        if (selectedYear && selectedClass && selectedWeek && !initialLoading) {
            console.log('✅ Calling fetchStats from week change...');
            fetchStats(selectedYear, selectedClass, selectedWeek);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWeek]);

    // ✅ Format week label
    const formatWeekLabel = (week) => {
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // ✅ Show initial loading
    if (initialLoading) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 40 }}>
                            <CircularProgress />
                            <Typography variant="body1" sx={{ ml: 2 }}>
                                Đang tải dữ liệu...
                            </Typography>
                        </Box>
                    </Paper>
                </PageContainer>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <PageContainer>
                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2, bgcolor: '#f8f9fa' }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Thống kê tổng quan
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Academic Year Select */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    label="Năm học"
                                    disabled={academicYears.length === 0}
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

                            {/* Class Select */}
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
                                            {cls.name} - {cls.ageGroup}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Week Select */}
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

                    {/* No academic years */}
                    {academicYears.length === 0 && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            Chưa có năm học nào. Vui lòng khai báo năm học trước.
                        </Alert>
                    )}

                    {/* No classes warning */}
                    {classes.length === 0 && selectedYear && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            {user?.role === 'to_truong'
                                ? 'Bạn chưa được phân công quản lý khối nào trong năm học này.'
                                : user?.role === 'giao_vien'
                                  ? 'Bạn chưa được phân công làm giáo viên chủ nhiệm lớp nào.'
                                  : 'Chưa có lớp học nào trong năm học này.'}
                        </Alert>
                    )}

                    {/* Loading stats */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 40 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Show stats */}
                    {!loading && selectedYear && selectedClass && selectedWeek && stats && (
                        <Grid container spacing={3}>
                            {/* Row 1: Common stats (4 items) */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ height: ROW_HEIGHTS.row1 }}>
                                    <TotalChildren data={stats.totalChildren} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ height: ROW_HEIGHTS.row1 }}>
                                    <TotalClasses data={stats.totalClasses} classesList={stats.classesList} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ height: ROW_HEIGHTS.row1 }}>
                                    <TotalMeals data={stats.totalMealsByType} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ height: ROW_HEIGHTS.row1 }}>
                                    <TotalMenus data={stats.totalMenusByAgeGroup} />
                                </Box>
                            </Grid>

                            {/* Row 2: Class-specific stats (3 items) */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row2 }}>
                                    <YearTargetStats data={stats.yearTargetsByAgeGroup} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row2 }}>
                                    <ActivityStats data={stats.activitiesByAgeGroup} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row2 }}>
                                    <StudentsPerClass data={stats.classStudents} classInfo={stats.classInfo} />
                                </Box>
                            </Grid>

                            {/* Row 3: More stats (3 items) */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row3 }}>
                                    <AttendanceStats
                                        data={stats.attendanceStatsByDay}
                                        weekNumber={stats.weekNumber}
                                        classInfo={stats.classInfo}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row3 }}>
                                    <AssessmentStats
                                        data={stats.assessmentStatsByDay}
                                        weekNumber={stats.weekNumber}
                                        classInfo={stats.classInfo}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ height: ROW_HEIGHTS.row3 }}>
                                    <CertificateStats
                                        data={stats.certificateStats}
                                        weekNumber={stats.weekNumber}
                                        classInfo={stats.classInfo}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    )}

                    {/* No data message */}
                    {!loading && selectedYear && selectedClass && selectedWeek && !stats && (
                        <Alert severity="info">Không có dữ liệu thống kê cho lựa chọn này.</Alert>
                    )}

                    {/* Missing selection message */}
                    {!loading && (!selectedYear || !selectedClass || !selectedWeek) && academicYears.length > 0 && (
                        <Alert severity="info">Vui lòng chọn năm học, lớp học và tuần để xem thống kê.</Alert>
                    )}
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default Dashboard;
