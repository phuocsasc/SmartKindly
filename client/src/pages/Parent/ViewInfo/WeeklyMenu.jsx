// client/src/pages/Parent/ViewInfo/WeeklyMenu.jsx

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
} from '@mui/material';
import { DoneOutlined as DoneIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

function WeeklyMenu() {
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

    const [menuData, setMenuData] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [menuApplies, setMenuApplies] = useState([]);
    const [menuAgeGroup, setMenuAgeGroup] = useState('');

    // ✅ Khởi tạo dữ liệu ban đầu
    useEffect(() => {
        initializeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch classes khi đổi năm học
    useEffect(() => {
        if (selectedYear) {
            fetchClassesByYear();
        } else {
            setClasses([]);
            setSelectedClass('');
            setWeeks([]);
            setSelectedWeek('');
            setMenuData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Fetch weeks khi đổi lớp
    useEffect(() => {
        if (selectedClass && selectedYear) {
            fetchWeeks();
        } else {
            setWeeks([]);
            setSelectedWeek('');
            setMenuData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear]);

    // ✅ Fetch menu khi đổi tuần
    useEffect(() => {
        if (selectedClass && selectedYear && selectedWeek) {
            fetchWeeklyMenu();
        } else {
            setMenuData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear, selectedWeek]);

    const initializeData = async () => {
        try {
            setInitialLoading(true);

            // Bước 1: Tải năm học
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

            // Bước 2: Tải lớp học và tuần
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

            // Bước 3: Tải thực đơn
            if (yearId && firstClassId && weekNumToFetch) {
                const menuRes = await parentChildrenApi.getWeeklyMenu({
                    academicYearId: yearId,
                    classId: firstClassId,
                    weekNumber: weekNumToFetch,
                });
                const data = menuRes.data.data;
                setMenuData(data);
                setCurrentWeekData(data.weekData);
                setHolidays(data.holidays || []);
                setMenuApplies(data.menuApplies || []);
                setMenuAgeGroup(data.menuAgeGroup || '');
            }
        } catch (error) {
            console.error('❌ [WeeklyMenu] Initialization error:', error);
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

    const fetchWeeklyMenu = async () => {
        try {
            setLoading(true);
            const res = await parentChildrenApi.getWeeklyMenu({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const data = res.data.data;
            setMenuData(data);
            setCurrentWeekData(data.weekData);
            setHolidays(data.holidays || []);
            setMenuApplies(data.menuApplies || []);
            setMenuAgeGroup(data.menuAgeGroup || '');
        } catch (error) {
            console.error('❌ Error fetching weekly menu:', error);
            if (error?.response?.status !== 404) {
                toast.error(error?.response?.data?.message || 'Không thể tải thực đơn hằng tuần');
            }
            setMenuData(null);
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
        setMenuData(null);
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

    const getMenuApply = (dayOfWeek) => {
        return menuApplies.find((m) => m.dayOfWeek === dayOfWeek);
    };

    const getMealData = (dayOfWeek, mealSession) => {
        const menuApply = getMenuApply(dayOfWeek);
        if (!menuApply) return null;

        const meals = menuApply.menuSnapshot?.meals?.[mealSession] || [];
        return meals;
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
                <PageBreadcrumb
                    items={[{ text: 'Xem thông tin', icon: RestaurantIcon }, { text: 'Thực đơn hằng tuần' }]}
                />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#667eea' }}>
                        Thực đơn hằng tuần
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

                        {/* Nhóm tuổi thực đơn */}
                        {menuAgeGroup && (
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small" disabled>
                                    <InputLabel>Nhóm tuổi thực đơn</InputLabel>
                                    <Select value={menuAgeGroup} label="Nhóm tuổi thực đơn">
                                        <MenuItem value={menuAgeGroup}>{menuAgeGroup}</MenuItem>
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
                    ) : !menuData || !currentWeekData ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            {!selectedYear
                                ? 'Vui lòng chọn năm học'
                                : !selectedClass
                                  ? 'Vui lòng chọn lớp học'
                                  : !selectedWeek
                                    ? 'Vui lòng chọn tuần'
                                    : 'Chưa có thực đơn cho tuần này'}
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
                                                minWidth: 120,
                                                borderRight: '2px solid #d1c4e9',
                                            }}
                                        >
                                            Bữa ăn
                                        </TableCell>
                                        {WEEKDAYS.map((day, index) => {
                                            const date = dayjs(currentWeekData.startDate).add(index, 'day');
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
                                    {MEAL_SESSIONS.map((session) => (
                                        <TableRow key={session} hover>
                                            <TableCell
                                                sx={{
                                                    borderRight: '2px solid #d1c4e9',
                                                    bgcolor: '#f9f9f9',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {session}
                                            </TableCell>
                                            {WEEKDAYS.map((day, dayIndex) => {
                                                const date = dayjs(currentWeekData.startDate).add(dayIndex, 'day');
                                                const holiday = isHoliday(date);

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

                                                const meals = getMealData(day, session);
                                                const hasMeals = meals && meals.length > 0;

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
                                                        {hasMeals ? (
                                                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                                {meals.map((meal, idx) => (
                                                                    <li key={idx}>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{ color: '#424242' }}
                                                                        >
                                                                            {meal.name}
                                                                        </Typography>
                                                                    </li>
                                                                ))}
                                                            </Box>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.disabled"
                                                                align="center"
                                                                sx={{ fontStyle: 'italic' }}
                                                            >
                                                                Chưa có thực đơn
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

export default WeeklyMenu;
