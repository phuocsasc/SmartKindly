// client/src/pages/Parent/ViewInfo/CompletionAssessment.jsx

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
    Chip,
    Avatar,
    Rating,
    Divider,
    Stack,
} from '@mui/material';
import {
    DoneOutlined as DoneIcon,
    EmojiEventsOutlined as TrophyIcon,
    StarRounded as StarIcon,
    School as SchoolIcon,
    Cake as CakeIcon,
    Wc as GenderIcon,
    Person as TeacherIcon,
    AccountBalance as PrincipalIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function CompletionAssessment() {
    const { user } = useUser();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');

    const [assessmentData, setAssessmentData] = useState(null);
    const [schoolInfo, setSchoolInfo] = useState(null); // ✅ ADD

    // ✅ Initialize
    useEffect(() => {
        initializeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ Fetch assessment when filters change
    useEffect(() => {
        if (selectedYear && selectedClass) {
            fetchAssessment();
        } else {
            setAssessmentData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedClass]);

    const initializeData = async () => {
        try {
            setInitialLoading(true);

            // ✅ Step 1: Load school info
            const schoolRes = await parentChildrenApi.getSchoolInfo();
            setSchoolInfo(schoolRes.data.data);

            // Step 2: Load academic years
            const yearRes = await parentChildrenApi.getAcademicYears();
            const yearData = yearRes.data.data;
            setAcademicYears(yearData.academicYears);
            setActiveYearId(yearData.activeYearId);

            const yearId =
                yearData.activeYearId || (yearData.academicYears.length > 0 ? yearData.academicYears[0]._id : null);

            if (yearId) {
                setSelectedYear(yearId);

                // Step 3: Load classes for selected year
                const classRes = await parentChildrenApi.getStudentClassesByYear(yearId);
                const classData = classRes.data.data.classes || [];
                setClasses(classData);

                if (classData.length > 0) {
                    setSelectedClass(classData[0]._id);
                }
            }
        } catch (error) {
            console.error('Error initializing:', error);
            toast.error('Không thể tải dữ liệu ban đầu');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleYearChange = async (newYearId) => {
        setSelectedYear(newYearId);
        setSelectedClass('');
        setAssessmentData(null);

        try {
            const res = await parentChildrenApi.getStudentClassesByYear(newYearId);
            const classData = res.data.data.classes || [];
            setClasses(classData);

            if (classData.length > 0) {
                setSelectedClass(classData[0]._id);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            toast.error('Không thể tải danh sách lớp học');
        }
    };

    const fetchAssessment = async () => {
        try {
            setLoading(true);

            const res = await parentChildrenApi.getCompletionAssessment({
                academicYearId: selectedYear,
                classId: selectedClass,
            });

            const data = res.data.data;
            setAssessmentData(data);
        } catch (error) {
            console.error('Error fetching assessment:', error);
            toast.error(error.response?.data?.message || 'Không thể tải dữ liệu đánh giá');
            setAssessmentData(null);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Helper component for info row
    const InfoRow = ({ icon: Icon, label, value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Icon sx={{ color: '#667eea', fontSize: 20 }} />
            <Box>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                    {value || 'Chưa cập nhật'}
                </Typography>
            </Box>
        </Box>
    );

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
                <PageBreadcrumb items={[{ text: 'Cuối độ tuổi', icon: TrophyIcon }]} />

                <Paper sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#667eea' }}>
                        Đánh giá trẻ hoàn thành chương trình
                    </Typography>

                    {/* ✅ School Info Header */}
                    {schoolInfo && (
                        <Card sx={{ mb: 3, bgcolor: '#f0f4ff', borderRadius: 2 }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <InfoRow icon={SchoolIcon} label="Tên trường" value={schoolInfo.name} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <InfoRow icon={PrincipalIcon} label="Hiệu trưởng" value={schoolInfo.manager} />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {/* Filters */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                        {/* Select Năm học */}
                        <Grid item xs={12} sm={6}>
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
                            <Grid item xs={12} sm={6}>
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
                    </Grid>

                    {/* Loading */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* No data */}
                    {!loading && !assessmentData && selectedYear && selectedClass && (
                        <Alert severity="info">Không có dữ liệu đánh giá cho năm học và lớp đã chọn.</Alert>
                    )}

                    {/* Assessment Data */}
                    {!loading && assessmentData && (
                        <>
                            {/* ✅ Student Info Card - Enhanced */}
                            <Card sx={{ mb: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                <CardContent>
                                    <Grid container spacing={3} alignItems="center">
                                        {/* Avatar */}
                                        <Grid item>
                                            <Avatar
                                                src={assessmentData.student.avatar || '/default-avatar.png'}
                                                sx={{ width: 80, height: 80 }}
                                            />
                                        </Grid>

                                        {/* Student Info */}
                                        <Grid item xs>
                                            <Stack spacing={2}>
                                                <Box>
                                                    <Typography variant="h6" fontWeight={700}>
                                                        {assessmentData.student.fullName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Mã HS: {assessmentData.student.studentCode}
                                                    </Typography>
                                                </Box>

                                                <Grid container spacing={2}>
                                                    {/* ✅ Ngày sinh */}
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <InfoRow
                                                            icon={CakeIcon}
                                                            label="Ngày sinh"
                                                            value={
                                                                assessmentData.student.birthDate
                                                                    ? dayjs(assessmentData.student.birthDate).format(
                                                                          'DD/MM/YYYY',
                                                                      )
                                                                    : null
                                                            }
                                                        />
                                                    </Grid>

                                                    {/* ✅ Giới tính */}
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <InfoRow
                                                            icon={GenderIcon}
                                                            label="Giới tính"
                                                            value={assessmentData.student.gender}
                                                        />
                                                    </Grid>

                                                    {/* ✅ Lớp học */}
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <InfoRow
                                                            icon={SchoolIcon}
                                                            label="Lớp học"
                                                            value={assessmentData.classData.name}
                                                        />
                                                    </Grid>

                                                    {/* ✅ GVCN */}
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <InfoRow
                                                            icon={TeacherIcon}
                                                            label="GVCN"
                                                            value={assessmentData.classData.homeRoomTeacher}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Stack>
                                        </Grid>

                                        {/* Năm học badge */}
                                        <Grid item>
                                            <Chip
                                                label={`${assessmentData.academicYear.fromYear}-${assessmentData.academicYear.toYear}`}
                                                color="primary"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Evaluation */}
                            {assessmentData.evaluation ? (
                                <>
                                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#667eea' }}>
                                        📊 Kết quả đánh giá
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {assessmentData.evaluation.assessmentDetails.map((detail) => {
                                            const targetInfo = assessmentData.targetDetails[String(detail.targetId)];
                                            return (
                                                <Grid item xs={12} key={detail.targetId}>
                                                    <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <Box sx={{ flex: 1 }}>
                                                                <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                                    <Chip
                                                                        label={targetInfo?.code || 'MT...'}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: '#eef2ff',
                                                                            color: '#4f46e5',
                                                                            fontWeight: 700,
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {targetInfo?.content || 'Đang tải...'}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ textAlign: 'center', ml: 2 }}>
                                                                <Rating
                                                                    value={detail.score}
                                                                    max={10}
                                                                    readOnly
                                                                    icon={
                                                                        <StarIcon
                                                                            fontSize="small"
                                                                            sx={{ color: '#fbbf24' }}
                                                                        />
                                                                    }
                                                                    emptyIcon={
                                                                        <StarIcon
                                                                            fontSize="small"
                                                                            sx={{ color: '#d1d5db' }}
                                                                        />
                                                                    }
                                                                />
                                                                <Typography
                                                                    variant="h6"
                                                                    fontWeight={700}
                                                                    color="#667eea"
                                                                >
                                                                    {detail.score}/10
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>

                                    {/* Note */}
                                    {assessmentData.evaluation.note && (
                                        <>
                                            <Divider sx={{ my: 3 }} />
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: '#667eea' }}>
                                                📝 Nhận xét của giáo viên
                                            </Typography>
                                            <Paper sx={{ p: 2, bgcolor: '#fffbeb', borderRadius: 2 }}>
                                                <Typography variant="body1">
                                                    {assessmentData.evaluation.note}
                                                </Typography>
                                            </Paper>
                                        </>
                                    )}

                                    {/* Footer */}
                                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Đánh giá bởi: {assessmentData.evaluation.createdBy?.fullName || 'N/A'}
                                        </Typography>
                                    </Box>
                                </>
                            ) : (
                                <Alert severity="warning">
                                    Chưa có đánh giá hoàn thành chương trình cho năm học này.
                                </Alert>
                            )}
                        </>
                    )}
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default CompletionAssessment;
