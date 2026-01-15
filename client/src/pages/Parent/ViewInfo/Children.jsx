import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    CircularProgress,
    Divider,
    Chip,
    Avatar,
    Stack,
    InputAdornment,
} from '@mui/material';
import {
    School as SchoolIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Home as HomeIcon,
    Save as SaveIcon,
    FamilyRestroom as FamilyIcon,
    Badge as BadgeIcon,
    Wc as GenderIcon,
    CalendarToday as CalendarIcon,
    Face as FaceIcon,
    HistoryEdu as EthnicityIcon,
    EscalatorWarning as AgeIcon,
} from '@mui/icons-material';
import MainLayout from '~/layouts/ParentLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { parentChildrenApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

function Children() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [childrenData, setChildrenData] = useState(null);

    const [formData, setFormData] = useState({
        motherName: '',
        motherBirthYear: '',
        motherPhone: '',
        motherEmail: '',
        fatherName: '',
        fatherBirthYear: '',
        fatherPhone: '',
        fatherEmail: '',
        permanentAddress: '',
        currentAddress: '',
    });

    useEffect(() => {
        const fetchChildrenInfo = async () => {
            try {
                setLoading(true);
                const response = await parentChildrenApi.getChildrenInfo();
                const data = response.data.data;
                setChildrenData(data);
                setFormData({
                    motherName: data.student.motherName || '',
                    motherBirthYear: data.student.motherBirthYear || '',
                    motherPhone: data.student.motherPhone || '',
                    motherEmail: data.student.motherEmail || '',
                    fatherName: data.student.fatherName || '',
                    fatherBirthYear: data.student.fatherBirthYear || '',
                    fatherPhone: data.student.fatherPhone || '',
                    fatherEmail: data.student.fatherEmail || '',
                    permanentAddress: data.student.permanentAddress || '',
                    currentAddress: data.student.currentAddress || '',
                });
            } catch (error) {
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin học sinh');
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchChildrenInfo();
    }, [user]);

    const handleUpdate = async () => {
        // ... (Giữ nguyên logic validation cũ)
        try {
            setSaving(true);
            const response = await parentChildrenApi.updateChildrenInfo(formData);
            setChildrenData((prev) => ({ ...prev, student: response.data.data }));
            toast.success('Cập nhật thông tin thành công!');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                        <CircularProgress sx={{ color: '#667eea' }} />
                    </Box>
                </PageContainer>
            </MainLayout>
        );

    const { student, currentClass, currentAcademicYear } = childrenData;

    // Helper component cho các item thông tin nhỏ
    const InfoDetail = ({ icon: Icon, label, value, color = '#667eea' }) => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.6)',
                border: '1px solid #edf2f7',
            }}
        >
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 40, height: 40 }}>
                <Icon fontSize="small" />
            </Avatar>
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#2d3748' }}>
                    {value || 'Chưa cập nhật'}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Thông tin trẻ' }]} />

                <Grid container spacing={4}>
                    {/* ✅ SIDEBAR: PROFILE HỌC SINH */}
                    <Grid item xs={12} lg={4}>
                        <Stack spacing={3}>
                            <Paper
                                sx={{
                                    p: 4,
                                    borderRadius: 6,
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Trang trí góc */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -20,
                                        right: -20,
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        opacity: 0.1,
                                    }}
                                />

                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Avatar
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            mx: 'auto',
                                            mb: 2,
                                            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.25)',
                                            border: '4px solid #fff',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        }}
                                    >
                                        <FaceIcon sx={{ fontSize: 70 }} />
                                    </Avatar>
                                    <Typography variant="h5" fontWeight={700} sx={{ color: '#1a202c' }}>
                                        {student.fullName}
                                    </Typography>
                                    <Chip
                                        label={student.nickname ? `"${student.nickname}"` : 'Học sinh'}
                                        size="small"
                                        sx={{ mt: 1, bgcolor: '#ebf4ff', color: '#3182ce', fontWeight: 600 }}
                                    />
                                </Box>

                                <Stack spacing={1.5}>
                                    <InfoDetail
                                        icon={BadgeIcon}
                                        label="Mã học sinh"
                                        value={student.studentCode}
                                        color="#4c51bf"
                                    />
                                    <InfoDetail
                                        icon={GenderIcon}
                                        label="Giới tính"
                                        value={student.gender}
                                        color="#ed64a6"
                                    />
                                    <InfoDetail
                                        icon={CalendarIcon}
                                        label="Ngày sinh"
                                        value={dayjs(student.birthDate).format('DD/MM/YYYY')}
                                        color="#38b2ac"
                                    />
                                    <InfoDetail
                                        icon={EthnicityIcon}
                                        label="Dân tộc"
                                        value={student.ethnicity}
                                        color="#ecc94b"
                                    />
                                    <InfoDetail
                                        icon={AgeIcon}
                                        label="Nhóm tuổi"
                                        value={student.currentAgeGroup}
                                        color="#9f7aea"
                                    />
                                </Stack>
                            </Paper>

                            {/* CARD LỚP HỌC */}
                            {currentClass && (
                                <Paper
                                    sx={{
                                        p: 3,
                                        borderRadius: 6,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                                            <SchoolIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                                                Lớp hiện tại • {currentAcademicYear?.fromYear}-
                                                {currentAcademicYear?.toYear}
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700}>
                                                {currentClass.name}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        GVCN:{' '}
                                        <strong>{currentClass.homeRoomTeacher?.fullName || 'Đang cập nhật'}</strong>
                                    </Typography>
                                    <Chip
                                        label={student.status}
                                        size="small"
                                        sx={{
                                            mt: 2,
                                            bgcolor: student.status === 'Đang học' ? '#48bb78' : '#f56565',
                                            color: 'white',
                                            fontWeight: 700,
                                        }}
                                    />
                                </Paper>
                            )}
                        </Stack>
                    </Grid>

                    {/* ✅ MAIN CONTENT: FORM CẬP NHẬT */}
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 6, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
                                <Avatar sx={{ bgcolor: '#ebf4ff', color: '#3182ce' }}>
                                    <FamilyIcon />
                                </Avatar>
                                <Typography variant="h6" fontWeight={700} color="#2d3748">
                                    Thông tin gia đình & Liên hệ
                                </Typography>
                            </Stack>

                            <Grid container spacing={4}>
                                {/* SECTION MẸ */}
                                <Grid item xs={12} md={6}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            mb: 2,
                                            color: '#e53e3e',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }}
                                        />
                                        THÔNG TIN MẸ
                                    </Typography>
                                    <Stack spacing={2.5}>
                                        <TextField
                                            fullWidth
                                            label="Họ và tên mẹ"
                                            value={formData.motherName}
                                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                            variant="filled"
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Năm sinh"
                                            type="number"
                                            value={formData.motherBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, motherBirthYear: e.target.value })
                                            }
                                            variant="filled"
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Số điện thoại"
                                            value={formData.motherPhone}
                                            onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                                            variant="filled"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PhoneIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            value={formData.motherEmail}
                                            onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                                            variant="filled"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                    </Stack>
                                </Grid>

                                {/* SECTION BỐ */}
                                <Grid item xs={12} md={6}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            mb: 2,
                                            color: '#3182ce',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }}
                                        />
                                        THÔNG TIN BỐ
                                    </Typography>
                                    <Stack spacing={2.5}>
                                        <TextField
                                            fullWidth
                                            label="Họ và tên bố"
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                            variant="filled"
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Năm sinh"
                                            type="number"
                                            value={formData.fatherBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, fatherBirthYear: e.target.value })
                                            }
                                            variant="filled"
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Số điện thoại"
                                            value={formData.fatherPhone}
                                            onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                                            variant="filled"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PhoneIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            value={formData.fatherEmail}
                                            onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                                            variant="filled"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                        />
                                    </Stack>
                                </Grid>

                                {/* SECTION ĐỊA CHỈ */}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            mb: 2,
                                            color: '#718096',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <HomeIcon fontSize="small" /> ĐỊA CHỈ CƯ TRÚ
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={2}
                                                label="Địa chỉ thường trú"
                                                value={formData.permanentAddress}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, permanentAddress: e.target.value })
                                                }
                                                variant="filled"
                                                sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={2}
                                                label="Địa chỉ hiện tại"
                                                value={formData.currentAddress}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, currentAddress: e.target.value })
                                                }
                                                variant="filled"
                                                sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        startIcon={
                                            saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />
                                        }
                                        sx={{
                                            borderRadius: 4,
                                            py: 2,
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            boxShadow: '0 10px 20px rgba(102, 126, 234, 0.4)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                                transform: 'translateY(-2px)',
                                                transition: 'all 0.2s',
                                            },
                                        }}
                                    >
                                        {saving ? 'Đang lưu dữ liệu...' : 'Lưu tất cả thay đổi'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </PageContainer>
        </MainLayout>
    );
}

export default Children;
