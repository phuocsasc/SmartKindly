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
    Chip,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';
import {
    DoneOutlined as DoneIcon,
    EmojiEventsOutlined as TrophyIcon,
    AssignmentOutlined as AssignmentIcon,
    ChatBubbleOutline as ChatIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';

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

    useEffect(() => {
        initializeData();
    }, []);

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
            const yearRes = await parentChildrenApi.getAcademicYears();
            const yearData = yearRes.data.data;
            setAcademicYears(yearData.academicYears);
            setActiveYearId(yearData.activeYearId);

            const yearId =
                yearData.activeYearId || (yearData.academicYears.length > 0 ? yearData.academicYears[0]._id : null);

            if (yearId) {
                setSelectedYear(yearId);
                const classRes = await parentChildrenApi.getStudentClassesByYear(yearId);
                const classData = classRes.data.data.classes || [];
                setClasses(classData);
                if (classData.length > 0) setSelectedClass(classData[0]._id);
            }
        } catch (error) {
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
            if (classData.length > 0) setSelectedClass(classData[0]._id);
        } catch (error) {
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
            setAssessmentData(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tải dữ liệu đánh giá');
            setAssessmentData(null);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress sx={{ color: '#0071bc' }} />
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
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        Đánh giá trẻ hoàn thành chương trình
                    </Typography>

                    {/* Filters */}
                    <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                        {/* Select Năm học */}
                        <Grid item xs={12} sm={6}>
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
                            <Grid item xs={12} sm={6}>
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
                    </Grid>

                    {/* Alerts */}
                    {selectedYear && (
                        <Alert
                            severity={selectedYear === activeYearId ? 'success' : 'warning'}
                            sx={{ mb: 3, fontWeight: 500 }}
                        >
                            {selectedYear === activeYearId
                                ? 'Năm học đang hoạt động'
                                : 'Năm học đã kết thúc - Đang xem dữ liệu lịch sử'}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress size={40} thickness={4} sx={{ color: '#0071bc' }} />
                        </Box>
                    ) : assessmentData?.evaluation ? (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 4 }}>
                                <AssignmentIcon sx={{ color: '#0071bc' }} />
                                <Typography variant="h6" fontWeight={600} color="#0071bc">
                                    Kết quả đánh giá chi tiết
                                </Typography>
                            </Box>

                            {/* Responsive Table / Card View */}
                            <TableContainer
                                component={Paper}
                                sx={{
                                    boxShadow: 'none',
                                    border: '1px solid #e3f2fd',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                }}
                            >
                                <Table>
                                    <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                                        <TableRow>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: 700, width: '60px', color: '#0071bc' }}
                                            >
                                                STT
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, width: '120px', color: '#0071bc' }}>
                                                Mã mục tiêu
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#0071bc' }}>
                                                Nội dung mục tiêu
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: 700, width: '100px', color: '#0071bc' }}
                                            >
                                                Điểm số
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: 700, width: '120px', color: '#0071bc' }}
                                            >
                                                Đánh giá
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {assessmentData.evaluation.assessmentDetails.map((detail, index) => {
                                            const targetInfo = assessmentData.targetDetails[String(detail.targetId)];
                                            const isPassed = detail.score >= 5;
                                            return (
                                                <TableRow
                                                    key={detail.targetId}
                                                    hover
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    <TableCell align="center">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={targetInfo?.code || 'MT...'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: '#e3f2fd',
                                                                color: '#0071bc',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ lineHeight: 1.5 }}>
                                                        {targetInfo?.content || 'N/A'}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography
                                                            fontWeight={700}
                                                            color={isPassed ? 'success.main' : 'error.main'}
                                                        >
                                                            {detail.score}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={isPassed ? <CheckCircleIcon /> : <CancelIcon />}
                                                            label={isPassed ? 'Đạt' : 'Chưa đạt'}
                                                            color={isPassed ? 'success' : 'error'}
                                                            variant="soft"
                                                            size="small"
                                                            sx={{ fontWeight: 400, minWidth: '85px' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Teacher's Note Section */}
                            {assessmentData.evaluation.note && (
                                <Box sx={{ mt: 5 }}>
                                    <Divider sx={{ mb: 4 }}>
                                        <Chip
                                            icon={<ChatIcon fontSize="small" />}
                                            label="Nhận xét của giáo viên"
                                            sx={{
                                                px: 2,
                                                bgcolor: '#0071bc',
                                                color: '#fff',
                                                '& .MuiChip-icon': { color: 'inherit' },
                                            }}
                                        />
                                    </Divider>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 2,
                                            p: 3,
                                            bgcolor: '#f5faff',
                                            borderRadius: 4,
                                            position: 'relative',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '4px',
                                                height: '100%',
                                                bgcolor: '#0071bc',
                                                borderRadius: '4px 0 0 4px',
                                            },
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.8 }}
                                            >
                                                {assessmentData.evaluation.note}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            {selectedYear && selectedClass && (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                    Chưa có dữ liệu đánh giá cho năm học này.
                                </Alert>
                            )}
                        </Box>
                    )}
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default CompletionAssessment;
