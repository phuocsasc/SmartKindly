// client/src/pages/Parent/ViewInfo/Children.jsx

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
    Card,
    CardContent,
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Home as HomeIcon,
    Save as SaveIcon,
    FamilyRestroom as FamilyIcon,
    Badge as BadgeIcon,
    Wc as GenderIcon,
    CalendarToday as CalendarIcon,
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

                // Set form data
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

                console.log('✅ [Children] Fetched data:', data);
            } catch (error) {
                console.error('❌ [Children] Error:', error);
                toast.error(error?.response?.data?.message || 'Không thể tải thông tin học sinh');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchChildrenInfo();
        }
    }, [user]);

    const handleUpdate = async () => {
        // Validation
        if (formData.motherPhone && !/^[0-9]{10}$/.test(formData.motherPhone)) {
            toast.error('Số điện thoại mẹ phải có đúng 10 chữ số!');
            return;
        }
        if (formData.fatherPhone && !/^[0-9]{10}$/.test(formData.fatherPhone)) {
            toast.error('Số điện thoại bố phải có đúng 10 chữ số!');
            return;
        }
        if (formData.motherEmail && !/^\S+@\S+\.\S+$/.test(formData.motherEmail)) {
            toast.error('Email mẹ không hợp lệ!');
            return;
        }
        if (formData.fatherEmail && !/^\S+@\S+\.\S+$/.test(formData.fatherEmail)) {
            toast.error('Email bố không hợp lệ!');
            return;
        }

        try {
            setSaving(true);
            const response = await parentChildrenApi.updateChildrenInfo(formData);
            const updatedStudent = response.data.data;

            setChildrenData((prev) => ({
                ...prev,
                student: updatedStudent,
            }));

            toast.success('Cập nhật thông tin thành công!');
        } catch (error) {
            console.error('❌ [Children] Update error:', error);
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
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

    if (!childrenData) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Không có dữ liệu
                        </Typography>
                    </Paper>
                </PageContainer>
            </MainLayout>
        );
    }

    const { student, currentClass, currentAcademicYear } = childrenData;

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb items={[{ text: 'Xem thông tin', icon: SchoolIcon }, { text: 'Thông tin trẻ' }]} />

                <Grid container spacing={3}>
                    {/* ✅ THÔNG TIN HỌC SINH */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#f5f7fa' }}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        mx: 'auto',
                                        mb: 2,
                                        bgcolor: '#667eea',
                                        fontSize: 40,
                                    }}
                                >
                                    <PersonIcon sx={{ fontSize: 60 }} />
                                </Avatar>
                                <Typography variant="h5" fontWeight={700}>
                                    {student.fullName}
                                </Typography>
                                {student.nickname && (
                                    <Typography variant="body2" color="text.secondary">
                                        Biệt danh: {student.nickname}
                                    </Typography>
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <BadgeIcon fontSize="small" color="primary" />
                                            <Typography variant="caption" color="text.secondary">
                                                Mã học sinh
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {student.studentCode}
                                        </Typography>
                                    </CardContent>
                                </Card>

                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <GenderIcon fontSize="small" color="primary" />
                                            <Typography variant="caption" color="text.secondary">
                                                Giới tính
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {student.gender}
                                        </Typography>
                                    </CardContent>
                                </Card>

                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <CalendarIcon fontSize="small" color="primary" />
                                            <Typography variant="caption" color="text.secondary">
                                                Ngày sinh
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {dayjs(student.birthDate).format('DD/MM/YYYY')}
                                        </Typography>
                                    </CardContent>
                                </Card>

                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <PersonIcon fontSize="small" color="primary" />
                                            <Typography variant="caption" color="text.secondary">
                                                Dân tộc
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {student.ethnicity}
                                        </Typography>
                                    </CardContent>
                                </Card>

                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <SchoolIcon fontSize="small" color="primary" />
                                            <Typography variant="caption" color="text.secondary">
                                                Nhóm tuổi
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {student.currentAgeGroup}
                                        </Typography>
                                    </CardContent>
                                </Card>

                                {currentClass && currentAcademicYear && (
                                    <Card variant="outlined" sx={{ bgcolor: '#e8f5e9' }}>
                                        <CardContent>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Năm học {currentAcademicYear.fromYear}-{currentAcademicYear.toYear}
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} color="success.main">
                                                {currentClass.name}
                                            </Typography>
                                            {currentClass.homeRoomTeacher && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        GVCN: {currentClass.homeRoomTeacher.fullName}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                <Card variant="outlined">
                                    <CardContent>
                                        <Chip
                                            label={student.status}
                                            color={student.status === 'Đang học' ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </CardContent>
                                </Card>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* ✅ FORM CẬP NHẬT THÔNG TIN GIA ĐÌNH */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 4, borderRadius: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#667eea' }}>
                                <FamilyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Thông tin gia đình
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
                                {/* Thông tin mẹ */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight={600} color="error.main" gutterBottom>
                                        👩 Thông tin mẹ
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Họ và tên mẹ"
                                        value={formData.motherName}
                                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Năm sinh mẹ"
                                        value={formData.motherBirthYear}
                                        onChange={(e) => setFormData({ ...formData, motherBirthYear: e.target.value })}
                                        inputProps={{ min: 1940, max: new Date().getFullYear() }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Số điện thoại mẹ"
                                        value={formData.motherPhone}
                                        onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                                        InputProps={{
                                            startAdornment: <PhoneIcon color="primary" sx={{ mr: 1 }} />,
                                        }}
                                        placeholder="0901234567"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        label="Email mẹ"
                                        value={formData.motherEmail}
                                        onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                                        InputProps={{
                                            startAdornment: <EmailIcon color="primary" sx={{ mr: 1 }} />,
                                        }}
                                        placeholder="email"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider />
                                </Grid>

                                {/* Thông tin bố */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight={600} color="primary.main" gutterBottom>
                                        👨 Thông tin bố
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Họ và tên bố"
                                        value={formData.fatherName}
                                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Năm sinh bố"
                                        value={formData.fatherBirthYear}
                                        onChange={(e) => setFormData({ ...formData, fatherBirthYear: e.target.value })}
                                        inputProps={{ min: 1940, max: new Date().getFullYear() }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Số điện thoại bố"
                                        value={formData.fatherPhone}
                                        onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                                        InputProps={{
                                            startAdornment: <PhoneIcon color="primary" sx={{ mr: 1 }} />,
                                        }}
                                        placeholder="0901234567"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        label="Email bố"
                                        value={formData.fatherEmail}
                                        onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                                        InputProps={{
                                            startAdornment: <EmailIcon color="primary" sx={{ mr: 1 }} />,
                                        }}
                                        placeholder="[email protected]"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider />
                                </Grid>

                                {/* Thông tin địa chỉ */}
                                <Grid item xs={12}>
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                        color="secondary.main"
                                        gutterBottom
                                    >
                                        🏠 Thông tin địa chỉ
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Địa chỉ thường trú"
                                        value={formData.permanentAddress}
                                        onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                                        multiline
                                        rows={2}
                                        InputProps={{
                                            startAdornment: <HomeIcon color="primary" sx={{ mr: 1 }} />,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Địa chỉ hiện tại"
                                        value={formData.currentAddress}
                                        onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                                        multiline
                                        rows={2}
                                        InputProps={{
                                            startAdornment: <HomeIcon color="primary" sx={{ mr: 1 }} />,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                        sx={{
                                            borderRadius: 3,
                                            py: 1.5,
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
                                        }}
                                    >
                                        Lưu cập nhật
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
