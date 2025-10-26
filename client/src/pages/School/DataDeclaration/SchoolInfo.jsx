import { useState, useEffect } from 'react';
import {
    Typography,
    Paper,
    Box,
    TextField,
    Button,
    CircularProgress,
    Divider,
    Chip,
    Avatar,
    Fade,
} from '@mui/material';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SchoolIcon from '@mui/icons-material/School';
import { useUser } from '~/contexts/UserContext';
import { schoolApi } from '~/apis/schoolApi';
import { toast } from 'react-toastify';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from '~/config/dayjsConfig';
import { PERMISSIONS } from '~/config/rbacConfig';
import { usePermission } from '~/hooks/usePermission';

function SchoolInfo() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [schoolData, setSchoolData] = useState(null);

    // ✅ Kiểm tra quyền cập nhật
    const canUpdate =
        hasPermission(PERMISSIONS.UPDATE_SCHOOL_INFO) && user?.role === 'ban_giam_hieu' && user?.isRoot === true;

    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        address: '',
        taxCode: '',
        manager: '',
        phone: '',
        email: '',
        website: '',
        establishmentDate: null,
        status: true,
    });

    // ✅ Fetch school data - FIX warning + xử lý không có schoolId
    useEffect(() => {
        // ✅ Nếu user chưa load, chờ
        if (!user) {
            console.log('⏳ User chưa được load');
            return;
        }

        // ✅ Nếu user không có schoolId, hiển thị thông báo
        if (!user.schoolId) {
            console.log('❌ User không có schoolId:', user);
            toast.error('Bạn chưa được gán vào trường học nào', {
                toastId: 'no-school-id', // Tránh hiển thị nhiều lần
            });
            setInitialLoading(false);
            return;
        }

        // ✅ Fetch school info
        const fetchSchoolInfo = async () => {
            try {
                setInitialLoading(true);
                console.log('🔍 Fetching school info for schoolId:', user.schoolId);

                const response = await schoolApi.getSchoolInfo();
                console.log('✅ School info fetched:', response.data);

                const school = response.data.data;

                setSchoolData(school);
                setFormData({
                    name: school.name || '',
                    abbreviation: school.abbreviation || '',
                    address: school.address || '',
                    taxCode: school.taxCode || '',
                    manager: school.manager || '',
                    phone: school.phone || '',
                    email: school.email || '',
                    website: school.website || '',
                    establishmentDate: school.establishmentDate ? dayjs(school.establishmentDate) : null,
                    status: school.status ?? true,
                });
            } catch (error) {
                console.error('❌ Error fetching school info:', error);
                console.error('❌ Error response:', error.response?.data);

                const errorMessage = error.response?.data?.message || 'Không thể tải thông tin trường học';
                toast.error(errorMessage);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchSchoolInfo();
    }, [user?.schoolId]); // ✅ Chỉ chạy lại khi schoolId thay đổi

    // ✅ Handle update
    const handleUpdate = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên trường học!');
            return;
        }
        if (!formData.address.trim()) {
            toast.error('Vui lòng nhập địa chỉ!');
            return;
        }
        if (!formData.manager.trim()) {
            toast.error('Vui lòng nhập tên hiệu trưởng!');
            return;
        }
        if (!formData.phone.trim()) {
            toast.error('Vui lòng nhập số điện thoại!');
            return;
        }
        if (!formData.establishmentDate) {
            toast.error('Vui lòng chọn ngày thành lập!');
            return;
        }

        try {
            setLoading(true);

            const dataToSubmit = {
                ...formData,
                establishmentDate: formData.establishmentDate.format('YYYY-MM-DD'),
            };

            await schoolApi.updateSchoolInfo(dataToSubmit);
            toast.success('Cập nhật thông tin trường học thành công!');

            // Refresh data
            const response = await schoolApi.getSchoolInfo();
            const school = response.data.data;
            setSchoolData(school);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Loading state
    if (initialLoading) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                        <CircularProgress />
                    </Box>
                </PageContainer>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <PageContainer>
                {/* Breadcrumb */}
                <PageBreadcrumb
                    items={[
                        { text: 'Khai báo dữ liệu', icon: StorageOutlinedIcon, href: '#' },
                        { text: 'Thông tin nhà trường' },
                    ]}
                />

                {/* Header Card */}
                <Fade in timeout={500}>
                    <Paper
                        elevation={3}
                        sx={{
                            borderRadius: 3,
                            p: 2,
                            mb: 0,
                            background: 'linear-gradient(135deg, #e3f2fd 0%, #f9f9ff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 20px rgba(0, 113, 188, 0.1)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                                sx={{
                                    bgcolor: '#0071bc',
                                    width: 50,
                                    height: 50,
                                    boxShadow: '0 0 10px rgba(0, 113, 188, 0.3)',
                                }}
                            >
                                <SchoolIcon sx={{ fontSize: 28, color: '#fff' }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={700} color="primary">
                                    Thông tin nhà trường
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Mã trường: <strong>{schoolData?.schoolId}</strong>
                                </Typography>
                            </Box>
                        </Box>

                        {!canUpdate && (
                            <Chip
                                label="Chế độ xem"
                                color="default"
                                sx={{
                                    fontWeight: 600,
                                    bgcolor: '#eceff1',
                                    color: '#555',
                                }}
                            />
                        )}
                    </Paper>
                </Fade>

                {/* Form Card */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        boxShadow: '0 6px 16px rgba(0,0,0,0.05)',
                        backgroundColor: '#fff',
                        /* ✅ Style chung cho input */
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,

                            // ✅ Khi hover viền sáng màu xanh nhạt
                            '&:hover fieldset': {
                                borderColor: '#0071bc',
                            },

                            // ✅ Khi focus viền đậm màu xanh biển
                            '&.Mui-focused fieldset': {
                                borderColor: '#0071bc',
                                borderWidth: 2,
                            },
                        },

                        // ✅ Đổi màu label khi focus
                        '& label.Mui-focused': {
                            color: '#0071bc',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* ===== Thông tin cơ bản ===== */}
                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 2,
                                    fontWeight: 700,
                                    color: '#c02c15ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 4, height: 16, bgcolor: '#c02c15ff', borderRadius: 2 }} />
                                Thông tin cơ bản
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Tên trường học"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!canUpdate}
                                    size="small"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&.Mui-focused fieldset': { borderColor: '#0071bc', borderWidth: 2 },
                                            '&:hover fieldset': { borderColor: '#aee2ff' },
                                        },
                                        '& label.Mui-focused': { color: '#0071bc' },
                                    }}
                                />

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Tên viết tắt"
                                        value={formData.abbreviation}
                                        disabled
                                        helperText="Tiền tố trước tên tài khoản.Không thể thay đổi"
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Mã số thuế"
                                        value={formData.taxCode}
                                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                                        disabled={!canUpdate}
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                                <TextField
                                    label="Địa chỉ"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    disabled={!canUpdate}
                                    required
                                    multiline
                                    rows={2}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* ===== Thông tin liên hệ ===== */}
                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 2,
                                    fontWeight: 700,
                                    color: '#0071bc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 4, height: 16, bgcolor: '#0071bc', borderRadius: 2 }} />
                                Thông tin liên hệ
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Tên hiệu trưởng"
                                    value={formData.manager}
                                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    disabled={!canUpdate}
                                    size="small"
                                    fullWidth
                                />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Số điện thoại"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!canUpdate}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!canUpdate}
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                                <TextField
                                    label="Website"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    disabled={!canUpdate}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* ===== Thông tin khác ===== */}
                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 2,
                                    fontWeight: 700,
                                    color: '#2e7d32',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 4, height: 16, bgcolor: '#2e7d32', borderRadius: 2 }} />
                                Thông tin khác
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <DatePicker
                                    label="Ngày thành lập"
                                    value={formData.establishmentDate}
                                    onChange={(newValue) => setFormData({ ...formData, establishmentDate: newValue })}
                                    disabled={!canUpdate}
                                    format="DD/MM/YYYY"
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#0071bc',
                                                        borderWidth: 2,
                                                    },
                                                    '&:hover fieldset': { borderColor: '#aee2ff' },
                                                },
                                                '& label.Mui-focused': { color: '#0071bc' },
                                            },
                                        },
                                    }}
                                />

                                <TextField
                                    label="Trạng thái"
                                    value={formData.status ? 'Hoạt động' : 'Không hoạt động'}
                                    disabled
                                    helperText="Không thể thay đổi"
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                        </Box>

                        {/* ===== Action Buttons ===== */}
                        {canUpdate && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    sx={{
                                        px: 2,
                                        // py: 1,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        boxShadow: '0 3px 10px rgba(0, 113, 188, 0.3)',
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                                        '&:hover': {
                                            boxShadow: 3,
                                            background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                                        },
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={22} sx={{ color: '#fff' }} />
                                    ) : (
                                        'Cập nhật thông tin'
                                    )}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </PageContainer>
        </MainLayout>
    );
}

export default SchoolInfo;
