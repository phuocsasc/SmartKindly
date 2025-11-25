// client/src/pages/School/EducationPlan/Schedule/Schedule.jsx

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
    IconButton,
    Tooltip,
    Chip,
    Alert,
} from '@mui/material';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { scheduleApi, academicYearApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import ScheduleDialog from './ScheduleDialog';
import ScheduleCopyDialog from './ScheduleCopyDialog';
import dayjs from '~/config/dayjsConfig';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HolidaysConfigDialog from './HolidaysConfigDialog';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

function Schedule() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [schedule, setSchedule] = useState(null);
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openCopyDialog, setOpenCopyDialog] = useState(false);
    const [openHolidaysDialog, setOpenHolidaysDialog] = useState(false);
    const [holidays, setHolidays] = useState([]);

    const canCreate = hasPermission(PERMISSIONS.CREATE_SCHEDULE);
    const isActiveYear = selectedYear === activeYearId;

    useEffect(() => {
        fetchAcademicYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchSchedule();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        if (selectedWeek && schedule) {
            const weekData = schedule.weeks.find((w) => w.weekNumber === parseInt(selectedWeek));
            setCurrentWeekData(weekData || null);
        }
    }, [selectedWeek, schedule]);

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

    const fetchSchedule = async () => {
        try {
            setLoading(true);

            const res = await scheduleApi.getByAcademicYear(selectedYear);
            const scheduleData = res.data.data;

            if (!scheduleData) {
                // ✅ Nếu chưa có schedule, tự động khởi tạo
                if (isActiveYear && canCreate) {
                    await initializeSchedule();
                } else {
                    setSchedule(null);
                    setWeeks([]);
                    setSelectedWeek('');
                    setCurrentWeekData(null);
                }
                return;
            }

            setSchedule(scheduleData);
            setWeeks(scheduleData.weeks || []);

            if (scheduleData.weeks && scheduleData.weeks.length > 0) {
                setSelectedWeek(scheduleData.weeks[0].weekNumber.toString());
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setSchedule(null);
            setWeeks([]);
        } finally {
            setLoading(false);
        }
    };

    const initializeSchedule = async () => {
        try {
            await scheduleApi.initialize({ academicYearId: selectedYear });
            toast.success('Khởi tạo thời khóa biểu thành công!');
            fetchSchedule();
        } catch (error) {
            console.error('Error initializing schedule:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi khởi tạo thời khóa biểu!');
        }
    };

    const handleAddPeriod = () => {
        if (!schedule) {
            toast.error('Chưa có thời khóa biểu cho năm học này!');
            return;
        }
        setOpenDialog(true);
    };

    const formatWeekDisplay = (week) => {
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    const formatDateDisplay = (date, weekday) => {
        const d = dayjs(date);
        return `${weekday} (${d.format('DD/MM')})`;
    };

    // Fetch holidays khi có schedule
    useEffect(() => {
        if (schedule) {
            fetchHolidays();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schedule]);

    const fetchHolidays = async () => {
        try {
            const res = await scheduleApi.getHolidays(schedule._id);
            setHolidays(res.data.data.holidays || []);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
    };

    const isHoliday = (date) => {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    };
    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Kế hoạch giáo dục', icon: HistoryEduOutlinedIcon, href: '#' },
                        { text: 'Thời khóa biểu' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Thời khóa biểu
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Select năm học */}
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

                            {/* Select tuần */}
                            {weeks.length > 0 && (
                                <FormControl size="small" sx={{ minWidth: 200 }}>
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

                            {/* Nút Thêm mốc hoạt động */}
                            {canCreate && isActiveYear && schedule && (
                                <Tooltip title="Cấu hình mốc hoạt động">
                                    <IconButton
                                        onClick={handleAddPeriod}
                                        sx={{
                                            color: '#667eea',
                                            '&:hover': {
                                                bgcolor: 'rgba(102, 126, 234, 0.08)',
                                            },
                                        }}
                                    >
                                        <AddCircleOutlineIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* ✅ Nút cấu hình ngày nghỉ */}
                            {canCreate && isActiveYear && schedule && (
                                <Tooltip title="Cấu hình ngày nghỉ">
                                    <IconButton
                                        onClick={() => setOpenHolidaysDialog(true)}
                                        sx={{
                                            color: '#f44336',
                                            '&:hover': {
                                                bgcolor: 'rgba(244, 67, 54, 0.08)',
                                            },
                                        }}
                                    >
                                        <EventBusyIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Nút Copy từ năm học cũ */}
                            {canCreate && isActiveYear && schedule && (
                                <Tooltip title="Copy mốc hoạt động từ năm học cũ">
                                    <IconButton
                                        onClick={() => setOpenCopyDialog(true)}
                                        sx={{
                                            color: '#5a3680',
                                            '&:hover': {
                                                bgcolor: 'rgba(118, 75, 162, 0.04)',
                                            },
                                        }}
                                    >
                                        <ContentCopyIcon />
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
                                        <strong>Năm học đang hoạt động</strong>
                                    </>
                                ) : (
                                    <>
                                        <strong>Năm học đã kết thúc</strong>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : !schedule ? (
                        <Alert severity="info">Chưa có thời khóa biểu cho năm học này.</Alert>
                    ) : !currentWeekData ? (
                        <Alert severity="warning">Vui lòng chọn tuần để xem thời khóa biểu.</Alert>
                    ) : currentWeekData.activityPeriods.length === 0 ? (
                        <Alert severity="warning">
                            Tuần này chưa có mốc hoạt động nào. Vui lòng click "Cấu hình mốc hoạt động" để thêm.
                        </Alert>
                    ) : (
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
                                                    {formatDateDisplay(date, day)}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {currentWeekData.activityPeriods.map((period, idx) => (
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
                                            {WEEKDAYS.map((day, index) => {
                                                const date = dayjs(currentWeekData.startDate).add(index, 'day');
                                                const holiday = isHoliday(date);

                                                return (
                                                    <TableCell
                                                        key={day}
                                                        align="center"
                                                        sx={{
                                                            bgcolor: holiday ? '#ffebee' : '#fafafa',
                                                            height: 80,
                                                            position: 'relative',
                                                        }}
                                                    >
                                                        {holiday ? (
                                                            <Chip label="Ngày Nghỉ" color="error" size="small" />
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
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

            {/* Dialog cấu hình mốc hoạt động */}
            {openDialog && schedule && (
                <ScheduleDialog
                    open={openDialog}
                    scheduleId={schedule._id}
                    existingPeriods={currentWeekData?.activityPeriods || []}
                    totalWeeks={weeks.length}
                    onClose={() => setOpenDialog(false)}
                    onSuccess={() => {
                        setOpenDialog(false);
                        fetchSchedule();
                    }}
                />
            )}

            {/* Dialog copy từ năm học cũ */}
            <ScheduleCopyDialog
                open={openCopyDialog}
                currentYearId={activeYearId}
                onClose={() => setOpenCopyDialog(false)}
                onSuccess={() => {
                    setOpenCopyDialog(false);
                    fetchSchedule();
                }}
            />

            {/* Dialog cấu hình ngày nghỉ */}
            <HolidaysConfigDialog
                open={openHolidaysDialog}
                scheduleId={schedule?._id}
                weeks={weeks}
                onClose={() => setOpenHolidaysDialog(false)}
                onSuccess={() => {
                    setOpenHolidaysDialog(false);
                    fetchHolidays();
                    fetchSchedule();
                }}
            />
        </MainLayout>
    );
}

export default Schedule;
