// client/src/pages/Parent/ViewInfo/WeeklyCertificate.jsx

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
    Card,
    CardContent,
    Stack,
    Divider,
} from '@mui/material';
import {
    DoneOutlined as DoneIcon,
    LocalFlorist as LocalFloristIcon,
    Person as PersonIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import HoaBeNgon from '/hoa_be_ngoan.png';

function WeeklyCertificate() {
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

    const [certificateData, setCertificateData] = useState(null);
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [student, setStudent] = useState(null);
    const [certificate, setCertificate] = useState(null);

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
            setCertificateData(null);
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
            setCertificateData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedYear]);

    // ✅ Fetch certificate when week changes
    useEffect(() => {
        if (selectedClass && selectedYear && selectedWeek) {
            fetchWeeklyCertificate();
        } else {
            setCertificateData(null);
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

            // Step 3: Load certificate
            if (yearId && firstClassId && weekNumToFetch) {
                const certRes = await parentChildrenApi.getWeeklyCertificate({
                    academicYearId: yearId,
                    classId: firstClassId,
                    weekNumber: weekNumToFetch,
                });
                const data = certRes.data.data;
                setCertificateData(data);
                setCurrentWeekData(data.weekData);
                setStudent(data.student);
                setCertificate(data.certificate);
            }
        } catch (error) {
            console.error('❌ [WeeklyCertificate] Initialization error:', error);
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

    const fetchWeeklyCertificate = async () => {
        try {
            setLoading(true);
            const res = await parentChildrenApi.getWeeklyCertificate({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
            });

            const data = res.data.data;
            setCertificateData(data);
            setCurrentWeekData(data.weekData);
            setStudent(data.student);
            setCertificate(data.certificate);
        } catch (error) {
            console.error('❌ Error fetching weekly certificate:', error);
            if (error?.response?.status !== 404) {
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin phiếu bé ngoan');
            }
            setCertificateData(null);
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
        setCertificateData(null);
    };

    const formatWeekDisplay = (week) => {
        if (!week.startDate || !week.endDate) {
            return `Tuần ${week.weekNumber}`;
        }
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
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
                <PageBreadcrumb items={[{ text: 'Phiếu bé ngoan' }]} />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#667eea' }}>
                        Phiếu bé ngoan hằng tuần
                    </Typography>

                    {/* Filters */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                        {/* Select Năm học */}
                        <Grid item xs={12} sm={4}>
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
                            <Grid item xs={12} sm={4}>
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
                            <Grid item xs={12} sm={4}>
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
                    {student && certificateData && (
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

                            {/* Card 2: Tuần hiện tại */}
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
                                            <LocalFloristIcon sx={{ fontSize: 40, color: '#ff4081' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Tuần {currentWeekData?.weekNumber}
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a202c' }}>
                                                    {certificate?.isGoodChild ? 'ĐẠT BÉ NGOAN' : 'Chưa đạt'}
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

                            {/* Card 3: Tổng phiếu trong năm */}
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
                                            <CalendarIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Tổng phiếu bé ngoan trong năm học
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a202c' }}>
                                                    {certificateData.totalCertificatesInYear} phiếu
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {certificateData.academicYear.fromYear}-
                                                    {certificateData.academicYear.toYear}
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
                    ) : !certificateData || !currentWeekData ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            {!selectedYear
                                ? 'Vui lòng chọn năm học'
                                : !selectedClass
                                  ? 'Vui lòng chọn lớp học'
                                  : !selectedWeek
                                    ? 'Vui lòng chọn tuần'
                                    : 'Chưa có dữ liệu phiếu bé ngoan cho tuần này'}
                        </Alert>
                    ) : (
                        /* Certificate Display */
                        <Card
                            sx={{
                                borderRadius: 4,
                                border: certificate?.isGoodChild ? '3px solid #ff4081' : '2px dashed #e0e0e0',
                                bgcolor: certificate?.isGoodChild ? '#fff0f5' : '#fafafa',
                                position: 'relative',
                                overflow: 'visible',
                                transition: 'all 0.4s ease',
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                {/* Certificate Header */}
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Box
                                        component="img"
                                        src={HoaBeNgon}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            borderRadius: 3,
                                            objectFit: 'contain',
                                            mb: 2,
                                            filter: certificate?.isGoodChild ? 'none' : 'grayscale(100%) opacity(0.4)',
                                            transform: certificate?.isGoodChild ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        }}
                                    />
                                    <Typography
                                        variant="h4"
                                        fontWeight={700}
                                        sx={{
                                            color: certificate?.isGoodChild ? '#ff4081' : 'text.disabled',
                                            mb: 1,
                                        }}
                                    >
                                        {certificate?.isGoodChild ? 'PHIẾU BÉ NGOAN' : 'CHƯA ĐẠT BÉ NGOAN'}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                {/* Certificate Details */}
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Box
                                            sx={{
                                                bgcolor: '#fff',
                                                p: 2,
                                                borderRadius: 2,
                                                border: '1px solid #e0e0e0',
                                            }}
                                        >
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Nhận xét của giáo viên:
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: certificate?.comment ? '#424242' : 'text.disabled',
                                                    fontStyle: certificate?.comment ? 'normal' : 'italic',
                                                    whiteSpace: 'pre-line',
                                                    minHeight: 60,
                                                }}
                                            >
                                                {certificate?.comment || 'Chưa có nhận xét'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    {certificate && (
                                        <>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Giáo viên tạo phiếu:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {certificate.createdBy?.fullName || 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dayjs(certificate.createdAt).format('HH:mm:ss DD/MM/YYYY')}
                                                </Typography>
                                            </Grid>

                                            {certificate.lastUpdatedBy && (
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Cập nhật cuối:
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {certificate.lastUpdatedBy.fullName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dayjs(certificate.updatedAt).format('HH:mm:ss DD/MM/YYYY')}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </>
                                    )}
                                </Grid>

                                {/* Congratulation Message */}
                                {certificate?.isGoodChild && (
                                    <Box
                                        sx={{
                                            mt: 3,
                                            p: 2,
                                            bgcolor: '#fff',
                                            borderRadius: 2,
                                            border: '2px solid #ff4081',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography variant="h6" fontWeight={700} sx={{ color: '#ff4081' }}>
                                            🎉 Chúc mừng con đã đạt Phiếu Bé Ngoan! 🎉
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Con hãy tiếp tục cố gắng để nhận thêm nhiều phiếu bé ngoan nữa nhé!
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default WeeklyCertificate;
