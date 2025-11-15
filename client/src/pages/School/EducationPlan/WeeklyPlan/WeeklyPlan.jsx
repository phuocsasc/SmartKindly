// client/src/pages/School/EducationPlan/WeeklyPlan/WeeklyPlan.jsx

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
    IconButton,
    Tooltip,
    Chip,
} from '@mui/material';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import WeeklyPlanCopyDialog from './WeeklyPlanCopyDialog';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { weeklyPlanApi, academicYearApi, scheduleApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import WeeklyPlanDialog from './WeeklyPlanDialog';
import dayjs from '~/config/dayjsConfig';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

function WeeklyPlan() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const [openCopyPopup, setOpenCopyPopup] = useState(false);
    const [copyInfo, setCopyInfo] = useState(null);

    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [weeklyPlan, setWeeklyPlan] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);

    const isActiveYear = selectedYear === activeYearId;
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_MONTHLY_PLAN) && isActiveYear;

    useEffect(() => {
        fetchAcademicYears();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch classes khi selectedYear thay đổi
    useEffect(() => {
        if (selectedYear) {
            fetchAccessibleClassesByYear(selectedYear);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ Fetch weeks when class OR year changes
    useEffect(() => {
        if (selectedClass && selectedYear) {
            fetchWeeks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear]);

    // ✅ Fetch weekly plan when week OR year changes
    useEffect(() => {
        if (selectedClass && selectedWeek && selectedYear) {
            fetchWeeklyPlan();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedWeek, selectedYear]);

    // ✅ Fetch danh sách lớp THEO NĂM HỌC ĐƯỢC CHỌN
    const fetchAccessibleClassesByYear = async (yearId) => {
        try {
            console.log('📋 [WeeklyPlan] Fetching classes for year:', yearId);
            const res = await weeklyPlanApi.getAccessibleClassesByYear(yearId);
            const data = res.data.data;

            console.log('📋 [WeeklyPlan] Classes received:', data.classes?.length || 0);

            setClasses(data.classes || []);
            if (data.classes && data.classes.length > 0) {
                setSelectedClass(data.classes[0]._id);
            } else {
                setSelectedClass('');
            }
        } catch (error) {
            console.error('Error fetching accessible classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
            setClasses([]);
            setSelectedClass('');
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;
            setAcademicYears(years);

            const activeYear = years.find((y) => y.status === 'active');
            if (activeYear) {
                setActiveYearId(activeYear._id);
                setSelectedYear(activeYear._id);
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    const fetchWeeks = async () => {
        try {
            if (!selectedYear) return;

            const res = await scheduleApi.getByAcademicYear(selectedYear);
            const scheduleData = res.data.data;

            if (!scheduleData || !scheduleData.weeks || scheduleData.weeks.length === 0) {
                setWeeks([]);
                setSelectedWeek('');
                return;
            }

            setWeeks(scheduleData.weeks);
            setSelectedWeek(scheduleData.weeks[0].weekNumber.toString());
        } catch (error) {
            console.error('Error fetching weeks:', error);
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    const fetchWeeklyPlan = async () => {
        try {
            setLoading(true);

            const res = await weeklyPlanApi.getByClassAndWeek(selectedClass, selectedWeek, selectedYear);
            const data = res.data.data;

            setWeeklyPlan(data.weeklyPlan);
        } catch (error) {
            console.error('Error fetching weekly plan:', error);
            setWeeklyPlan(null);
            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || 'Lỗi khi tải kế hoạch tuần!');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (classId) => {
        setSelectedClass(classId);
        setWeeks([]);
        setSelectedWeek('');
        setWeeklyPlan(null);
    };

    const handleYearChange = (yearId) => {
        setSelectedYear(yearId);
        setClasses([]);
        setSelectedClass('');
        setWeeks([]);
        setSelectedWeek('');
        setWeeklyPlan(null);
    };

    const handleAddPlan = (dayName, dayIndex, period) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể cập nhật kế hoạch cho năm học đang hoạt động!');
            return;
        }

        if (!canUpdate) {
            toast.warning('Bạn không có quyền cập nhật kế hoạch!');
            return;
        }

        const dayMapping = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const dayKey = dayMapping[dayIndex];
        const allActivitiesOfDay = weeklyPlan[dayKey] || [];

        const currentActivity = allActivitiesOfDay.find(
            (a) => a.activityPeriodId.toString() === period.activityPeriodId.toString(),
        );

        const classData = classes.find((c) => c._id === selectedClass);
        const weekData = weeks.find((w) => w.weekNumber === parseInt(selectedWeek));

        setDialogData({
            classId: selectedClass,
            className: classData?.name || '',
            weekNumber: parseInt(selectedWeek),
            dayName,
            date: formatDateDisplay(dayjs(weekData?.startDate).add(dayIndex, 'day')),
            activityPeriodId: period.activityPeriodId,
            startTime: period.startTime,
            endTime: period.endTime,
            description: period.description,
            detailedContent: currentActivity?.detailedContent || '',
            allActivitiesOfDay,
        });

        setOpenDialog(true);
    };

    // ✅ Handler copy tuần với ConfirmDialog
    const handleCopyWeek = async () => {
        if (!selectedClass || !selectedWeek) {
            toast.warning('Vui lòng chọn lớp học và tuần!');
            return;
        }

        if (!isActiveYear) {
            toast.warning('Chỉ có thể copy kế hoạch trong năm học đang hoạt động!');
            return;
        }

        if (!canUpdate) {
            toast.warning('Bạn không có quyền copy kế hoạch!');
            return;
        }

        const classData = classes.find((c) => c._id === selectedClass);
        const totalWeeks = weeks.length;
        const remainingWeeks = totalWeeks - parseInt(selectedWeek);

        if (remainingWeeks <= 0) {
            toast.warning('Đây là tuần cuối cùng, không thể copy sang các tuần sau!');
            return;
        }
        // 👉 Mở popup mới
        setCopyInfo({
            className: classData?.name,
            selectedWeek,
            remainingWeeks,
            totalWeeks,
        });
        setOpenCopyPopup(true);
    };

    const formatWeekDisplay = (week) => {
        if (!week.startDate || !week.endDate) {
            return `Tuần ${week.weekNumber}`;
        }
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    const formatDateDisplay = (date) => {
        return dayjs(date).format('DD/MM');
    };

    const getDayContent = (dayIndex, periodId) => {
        if (!weeklyPlan) return null;

        const dayMapping = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const dayKey = dayMapping[dayIndex];
        const dayActivities = weeklyPlan[dayKey] || [];

        const activity = dayActivities.find((a) => {
            const activityId = a.activityPeriodId?._id || a.activityPeriodId;
            const targetId = periodId?._id || periodId;
            return activityId.toString() === targetId.toString();
        });

        return activity?.detailedContent || '';
    };

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Kế hoạch giáo dục', icon: HistoryEduOutlinedIcon, href: '#' },
                        { text: 'Kế hoạch giáo dục chi tiết theo tuần' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Kế hoạch giáo dục chi tiết theo tuần
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* ✅ Select năm học - ĐẶT TRƯỚC */}
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => handleYearChange(e.target.value)}
                                    label="Năm học"
                                >
                                    {academicYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: year.status === 'active' ? 600 : 400,
                                                        color:
                                                            year.status === 'active' ? 'success.main' : 'text.primary',
                                                    }}
                                                >
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

                            {/* ✅ Select lớp học - SAU KHI CÓ NĂM HỌC */}
                            {classes.length > 0 && (
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Lớp học</InputLabel>
                                    <Select
                                        value={selectedClass}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                        label="Lớp học"
                                    >
                                        {classes.map((cls) => (
                                            <MenuItem key={cls._id} value={cls._id}>
                                                {cls.name} - {cls.ageGroup}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* Select tuần */}
                            {weeks.length > 0 && (
                                <FormControl size="small" sx={{ minWidth: 250 }}>
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
                            )}

                            {/* ✅ Nút Copy tuần */}
                            {canUpdate &&
                                isActiveYear &&
                                selectedWeek &&
                                weeklyPlan &&
                                weeklyPlan.monday.length > 0 && (
                                    <Tooltip title={`Copy tuần ${selectedWeek} sang các tuần sau`}>
                                        <IconButton
                                            onClick={handleCopyWeek}
                                            sx={{
                                                color: '#667eea',
                                                bgcolor: 'rgba(102, 126, 234, 0.08)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(102, 126, 234, 0.15)',
                                                },
                                            }}
                                        >
                                            <FileCopyOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                        </Box>
                    </Box>

                    {/* Thông báo năm học */}
                    {selectedYear && (
                        <Box
                            sx={{
                                mb: 2,
                                p: 1.5,
                                bgcolor: isActiveYear ? '#e8f5e9' : '#fff3e0',
                                borderRadius: 1,
                                border: `1px solid ${isActiveYear ? '#4caf50' : '#ff9800'}`,
                            }}
                        >
                            <Typography variant="body2" color={isActiveYear ? 'success.main' : 'warning.main'}>
                                {isActiveYear ? (
                                    <>
                                        <strong>Năm học đang hoạt động</strong> -{' '}
                                        {user?.role === 'giao_vien'
                                            ? 'Bạn có thể cập nhật kế hoạch lớp mình phụ trách'
                                            : user?.role === 'to_truong'
                                              ? 'Bạn có thể cập nhật kế hoạch các lớp trong khối mình quản lý'
                                              : 'Có thể cập nhật kế hoạch tất cả các lớp'}
                                    </>
                                ) : (
                                    <>
                                        <strong>Năm học đã kết thúc</strong>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    )}

                    {/* Alert khi không có lớp */}
                    {selectedYear && classes.length === 0 && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            {user?.role === 'to_truong'
                                ? 'Bạn chưa được phân công quản lý khối nào trong năm học này, hoặc chưa có lớp học nào thuộc khối bạn quản lý.'
                                : user?.role === 'giao_vien'
                                  ? 'Bạn chưa được phân công làm giáo viên chủ nhiệm lớp nào trong năm học này.'
                                  : 'Chưa có lớp học nào trong năm học này.'}
                        </Alert>
                    )}

                    {/* Loading / Content */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : !selectedYear ? (
                        <Alert severity="info">Vui lòng chọn năm học để xem kế hoạch.</Alert>
                    ) : !selectedClass ? (
                        classes.length === 0 ? null : (
                            <Alert severity="info">Vui lòng chọn lớp học để xem kế hoạch.</Alert>
                        )
                    ) : weeks.length === 0 ? (
                        <Alert severity="warning">
                            Năm học <strong>{academicYears.find((y) => y._id === selectedYear)?.fromYear}</strong>-
                            <strong>{academicYears.find((y) => y._id === selectedYear)?.toYear}</strong> chưa có thời
                            khóa biểu. {isActiveYear && 'Vui lòng liên hệ Ban giám hiệu để thiết lập.'}
                        </Alert>
                    ) : !selectedWeek ? (
                        <Alert severity="info">Vui lòng chọn tuần để xem kế hoạch.</Alert>
                    ) : !weeklyPlan ? (
                        <Alert severity="warning">
                            Chưa có kế hoạch giáo dục chi tiết cho tuần {selectedWeek} của năm học này.
                        </Alert>
                    ) : weeklyPlan.monday.length === 0 ? (
                        <Alert severity="warning">
                            Tuần {selectedWeek} chưa có mốc hoạt động nào trong thời khóa biểu.{' '}
                            {isActiveYear && 'Vui lòng liên hệ Ban giám hiệu.'}
                        </Alert>
                    ) : (
                        <TableContainer
                            component={Paper}
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                maxHeight: '75vh',
                                overflowY: 'auto',
                                overflowX: 'auto', // để bảng vẫn scroll ngang nếu bị tràn
                                '&::-webkit-scrollbar': { width: '6px' },
                                '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#0964a1a4',
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                            }}
                        >
                            <Table stickyHeader sx={{ minWidth: 1000 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#ede7f6',
                                                minWidth: 140,
                                                borderRight: '2px solid #d1c4e9',
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 3,
                                            }}
                                        >
                                            Mốc hoạt động
                                        </TableCell>
                                        {WEEKDAYS.map((day, index) => {
                                            const weekData = weeks.find((w) => w.weekNumber === parseInt(selectedWeek));
                                            const date = weekData?.startDate
                                                ? dayjs(weekData.startDate).add(index, 'day')
                                                : null;
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
                                                    {day} {date ? `(${formatDateDisplay(date)})` : ''}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {weeklyPlan.monday.map((period, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell
                                                sx={{
                                                    borderRight: '2px solid #d1c4e9',
                                                    bgcolor: '#f9f9f9',
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 2,
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
                                                const content = getDayContent(dayIndex, period.activityPeriodId);
                                                const hasContent = content && content.trim().length > 0;

                                                return (
                                                    <TableCell
                                                        key={day}
                                                        sx={{
                                                            bgcolor: '#fafafa',
                                                            verticalAlign: 'top',
                                                            py: 1,
                                                            px: 0.5,
                                                            position: 'relative',
                                                        }}
                                                    >
                                                        {hasContent ? (
                                                            <Box
                                                                sx={{
                                                                    maxHeight: 200,
                                                                    overflowY: 'overlay',
                                                                    paddingRight: 0,
                                                                    scrollbarGutter: 'stable both-edges',
                                                                    '&::-webkit-scrollbar': {
                                                                        width: '6px',
                                                                    },
                                                                    '&::-webkit-scrollbar-track': {
                                                                        backgroundColor: '#e3f2fd',
                                                                    },
                                                                    '&::-webkit-scrollbar-thumb': {
                                                                        backgroundColor: '#0964a1a4',
                                                                        borderRadius: '4px',
                                                                    },
                                                                    '&::-webkit-scrollbar-thumb:hover': {
                                                                        backgroundColor: '#0071BC',
                                                                    },
                                                                }}
                                                            >
                                                                <Chip
                                                                    label={
                                                                        <Box>
                                                                            <Typography
                                                                                variant="body2"
                                                                                sx={{
                                                                                    whiteSpace: 'pre-wrap',
                                                                                    wordBreak: 'break-word',
                                                                                    py: 0.5,
                                                                                    fontSize: '0.875rem',
                                                                                    lineHeight: 1.4,
                                                                                    color: '#000',
                                                                                }}
                                                                            >
                                                                                {content}
                                                                            </Typography>
                                                                        </Box>
                                                                    }
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: 'auto',
                                                                        minHeight: 60,
                                                                        bgcolor: '#e3f2fd',
                                                                        borderRadius: 1.5,
                                                                        display: 'flex',
                                                                        alignItems: 'flex-start',
                                                                        justifyContent: 'flex-start',
                                                                        '& .MuiChip-label': {
                                                                            display: 'block',
                                                                            width: '100%',
                                                                            padding: '8px 12px',
                                                                            whiteSpace: 'normal',
                                                                        },
                                                                    }}
                                                                />

                                                                {canUpdate && isActiveYear && (
                                                                    <Tooltip title="Chỉnh sửa">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleAddPlan(day, dayIndex, period)
                                                                            }
                                                                            sx={{
                                                                                position: 'absolute',
                                                                                top: -4,
                                                                                right: 0,
                                                                                color: '#667eea',
                                                                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                                                                '&:hover': {
                                                                                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                                                                                },
                                                                                zIndex: 1,
                                                                            }}
                                                                        >
                                                                            <EditOutlinedIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    minHeight: 60,
                                                                }}
                                                            >
                                                                {canUpdate && isActiveYear ? (
                                                                    <Tooltip title="Thêm kế hoạch">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="success"
                                                                            onClick={() =>
                                                                                handleAddPlan(day, dayIndex, period)
                                                                            }
                                                                            sx={{
                                                                                '&:hover': {
                                                                                    bgcolor: 'rgba(76, 175, 80, 0.08)',
                                                                                },
                                                                            }}
                                                                        >
                                                                            <AddCircleOutlineIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        —
                                                                    </Typography>
                                                                )}
                                                            </Box>
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
                    {weeklyPlan && weeklyPlan.monday.length > 0 && isActiveYear && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                <strong>Chú thích:</strong>
                            </Typography>
                            <Chip
                                icon={<AddCircleOutlineIcon fontSize="small" />}
                                label="Thêm kế hoạch"
                                size="small"
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                icon={<EditOutlinedIcon fontSize="small" />}
                                label="Chỉnh sửa"
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            <Chip
                                icon={<FileCopyOutlinedIcon fontSize="small" sx={{ color: '#667eea' }} />}
                                label="Copy tuần này sang các tuần sau"
                                size="small"
                                sx={{
                                    borderColor: '#667eea',
                                    color: '#667eea',
                                }}
                                variant="outlined"
                            />
                        </Box>
                    )}
                </Paper>
            </PageContainer>

            {/* Dialog */}
            <WeeklyPlanDialog
                open={openDialog}
                data={dialogData}
                onClose={() => setOpenDialog(false)}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchWeeklyPlan();
                }}
            />

            {/* Dialog */}
            <WeeklyPlanCopyDialog
                open={openCopyPopup}
                onClose={() => setOpenCopyPopup(false)}
                copyInfo={copyInfo}
                onConfirm={async () => {
                    try {
                        const res = await weeklyPlanApi.copyToFollowingWeeks({
                            classId: selectedClass,
                            weekNumber: parseInt(selectedWeek),
                        });

                        toast.success(res.data.data.message || 'Copy kế hoạch thành công!');
                        fetchWeeklyPlan();
                        setOpenCopyPopup(false);
                    } catch (error) {
                        toast.error('Lỗi khi copy kế hoạch!');
                    }
                }}
            />
        </MainLayout>
    );
}

export default WeeklyPlan;
