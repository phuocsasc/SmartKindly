import { useState, useEffect } from 'react';
import { Typography, Paper, Box, TextField, Button, CircularProgress, Divider, Chip } from '@mui/material';
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

                {/* Page Content */}
                <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="h5" fontWeight={600}>
                                    Thông tin nhà trường
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Mã trường: <strong>{schoolData?.schoolId}</strong>
                                </Typography>
                            </Box>
                        </Box>
                        {!canUpdate && <Chip label="Chỉ xem" color="default" size="small" sx={{ fontWeight: 600 }} />}
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Form */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Section: Thông tin cơ bản */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 2,
                                    color: 'secondary.main',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 3, height: 14, bgcolor: 'secondary.main', borderRadius: 1 }} />
                                Thông tin cơ bản
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Tên trường học"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!canUpdate}
                                    required
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Tên viết tắt"
                                        value={formData.abbreviation}
                                        disabled
                                        helperText="Không thể thay đổi"
                                        fullWidth
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                    <TextField
                                        label="Mã số thuế"
                                        value={formData.taxCode}
                                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                                        disabled={!canUpdate}
                                        fullWidth
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                </Box>

                                <TextField
                                    label="Địa chỉ"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    disabled={!canUpdate}
                                    required
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* Section: Thông tin liên hệ */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 2,
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 3, height: 14, bgcolor: 'primary.main', borderRadius: 1 }} />
                                Thông tin liên hệ
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Tên hiệu trưởng"
                                    value={formData.manager}
                                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    disabled={!canUpdate}
                                    required
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Số điện thoại"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!canUpdate}
                                        required
                                        fullWidth
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                    <TextField
                                        label="Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!canUpdate}
                                        fullWidth
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                    />
                                </Box>

                                <TextField
                                    label="Website"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    disabled={!canUpdate}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* Section: Thông tin khác */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 2,
                                    color: 'success.main',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: 3, height: 14, bgcolor: 'success.main', borderRadius: 1 }} />
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
                                            required: true,
                                            fullWidth: true,
                                            size: 'small',
                                            sx: { '& .MuiOutlinedInput-root': { borderRadius: 1.5 } },
                                        },
                                    }}
                                />

                                <TextField
                                    label="Trạng thái"
                                    value={formData.status ? 'Hoạt động' : 'Không hoạt động'}
                                    disabled
                                    helperText="Không thể thay đổi"
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>
                        </Box>

                        {/* Action Buttons */}
                        {canUpdate && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        textTransform: 'none',
                                        minWidth: 150,
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Cập nhật thông tin'}
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
