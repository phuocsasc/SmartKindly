import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    IconButton,
    Grid,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { childrenManagementApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import { VIETNAM_ETHNICITIES } from '~/utils/vietnamEthnicities';

// ✅ THÊM: Constants cho age groups
const AGE_GROUPS = [
    { value: '12-24 tháng', label: '12-24 tháng' },
    { value: '24-36 tháng', label: '24-36 tháng' },
    { value: '3-4 tuổi', label: '3-4 tuổi' },
    { value: '4-5 tuổi', label: '4-5 tuổi' },
    { value: '5-6 tuổi', label: '5-6 tuổi' },
];

function ChildrenManagementDialog({ open, mode, childData, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        // Thông tin học sinh
        fullName: '',
        nickname: '',
        birthDate: null,
        gender: '',
        ethnicity: 'Kinh',

        // Thông tin học tập
        enrollmentDate: null,
        currentAgeGroup: '', // ✅ THÊM
        status: 'Đang học',

        // Thông tin gia đình
        motherName: '',
        motherBirthYear: '',
        motherPhone: '',
        motherEmail: '',
        fatherName: '',
        fatherBirthYear: '',
        fatherPhone: '',
        fatherEmail: '',

        // Thông tin địa chỉ
        permanentAddress: '',
        currentAddress: '',
    });

    const isCreateMode = mode === 'create';
    // ✅ THÊM: Check xem học sinh đã có lớp chưa (chỉ khi edit)
    const hasClass = mode === 'edit' && childData?.hasClass === true;

    useEffect(() => {
        if (mode === 'edit' && childData) {
            setFormData({
                fullName: childData.fullName || '',
                nickname: childData.nickname || '',
                birthDate: childData.birthDate ? dayjs(childData.birthDate) : null,
                gender: childData.gender || '',
                ethnicity: childData.ethnicity || 'Kinh',
                enrollmentDate: childData.enrollmentDate ? dayjs(childData.enrollmentDate) : null,
                currentAgeGroup: childData.currentAgeGroup || '', // ✅ THÊM
                status: childData.status || 'Đang học',
                motherName: childData.motherName || '',
                motherBirthYear: childData.motherBirthYear || '',
                motherPhone: childData.motherPhone || '',
                motherEmail: childData.motherEmail || '',
                fatherName: childData.fatherName || '',
                fatherBirthYear: childData.fatherBirthYear || '',
                fatherPhone: childData.fatherPhone || '',
                fatherEmail: childData.fatherEmail || '',
                permanentAddress: childData.permanentAddress || '',
                currentAddress: childData.currentAddress || '',
            });
        } else if (mode === 'create') {
            setFormData({
                fullName: '',
                nickname: '',
                birthDate: null,
                gender: '',
                ethnicity: 'Kinh',
                enrollmentDate: null,
                currentAgeGroup: '', // ✅ THÊM
                status: 'Đang học',
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
        }
    }, [mode, childData, open]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.fullName.trim()) {
            toast.error('Vui lòng nhập họ và tên!');
            return;
        }
        if (!formData.birthDate) {
            toast.error('Vui lòng chọn ngày sinh!');
            return;
        }
        if (!formData.gender) {
            toast.error('Vui lòng chọn giới tính!');
            return;
        }
        if (!formData.ethnicity) {
            toast.error('Vui lòng chọn dân tộc!');
            return;
        }
        if (!formData.enrollmentDate) {
            toast.error('Vui lòng chọn ngày nhập học!');
            return;
        }
        // ✅ THÊM: Validate currentAgeGroup
        if (!formData.currentAgeGroup) {
            toast.error('Vui lòng chọn nhóm tuổi hiện tại!');
            return;
        }
        if (!formData.permanentAddress.trim()) {
            toast.error('Vui lòng nhập địa chỉ thường trú!');
            return;
        }
        if (!formData.currentAddress.trim()) {
            toast.error('Vui lòng nhập địa chỉ hiện tại!');
            return;
        }

        // Validate phone numbers
        if (formData.motherPhone && !/^[0-9]{10}$/.test(formData.motherPhone)) {
            toast.error('Số điện thoại mẹ phải có đúng 10 chữ số!');
            return;
        }
        if (formData.fatherPhone && !/^[0-9]{10}$/.test(formData.fatherPhone)) {
            toast.error('Số điện thoại bố phải có đúng 10 chữ số!');
            return;
        }

        // Validate emails
        if (formData.motherEmail && !/^\S+@\S+\.\S+$/.test(formData.motherEmail)) {
            toast.error('Email mẹ không hợp lệ!');
            return;
        }
        if (formData.fatherEmail && !/^\S+@\S+\.\S+$/.test(formData.fatherEmail)) {
            toast.error('Email bố không hợp lệ!');
            return;
        }

        try {
            setLoading(true);

            const dataToSubmit = {
                ...formData,
                birthDate: formData.birthDate.format('YYYY-MM-DD'),
                enrollmentDate: formData.enrollmentDate.format('YYYY-MM-DD'),
                motherBirthYear: formData.motherBirthYear ? Number(formData.motherBirthYear) : null,
                fatherBirthYear: formData.fatherBirthYear ? Number(formData.fatherBirthYear) : null,
            };

            if (isCreateMode) {
                await childrenManagementApi.create(dataToSubmit);
                toast.success('Thêm trẻ thành công!');
            } else {
                await childrenManagementApi.update(childData._id, dataToSubmit);
                toast.success('Cập nhật thông tin thành công!');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 3,
                        maxHeight: '90vh',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        py: 1.5,
                        position: 'relative',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                            {isCreateMode ? <AddCircleOutlineIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                        </Avatar>
                        <Typography variant="h6" fontWeight={600}>
                            {isCreateMode ? 'Thêm trẻ mới' : 'Cập nhật thông tin trẻ'}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ mt: 3, pb: 0, overflowY: 'auto' }}>
                    {/* ✅ THÊM: Cảnh báo khi học sinh đã có lớp */}
                    {hasClass && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight={600}>
                                Học sinh đã có lớp
                            </Typography>
                            <Typography variant="body2">
                                Không thể thay đổi <strong>Trạng thái</strong> và <strong>Nhóm tuổi hiện tại</strong>{' '}
                                khi học sinh đã có lớp học.
                            </Typography>
                        </Alert>
                    )}
                    {/* Section 1: Thông tin học sinh */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                                👤 Thông tin học sinh
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                {/* Họ và tên */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Họ và tên *"
                                        placeholder="VD: Nguyễn Văn An"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        fullWidth
                                        size="small"
                                        required
                                    />
                                </Grid>

                                {/* Biệt danh */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Biệt danh"
                                        placeholder="VD: Bé Bảo"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>

                                {/* Ngày sinh */}
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Ngày sinh *"
                                        value={formData.birthDate}
                                        onChange={(newValue) => setFormData({ ...formData, birthDate: newValue })}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                fullWidth: true,
                                                required: true,
                                            },
                                        }}
                                    />
                                </Grid>

                                {/* Giới tính */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth size="small" required>
                                        <InputLabel>Giới tính *</InputLabel>
                                        <Select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            label="Giới tính *"
                                        >
                                            <MenuItem value="">-- Chọn --</MenuItem>
                                            <MenuItem value="Nam">Nam</MenuItem>
                                            <MenuItem value="Nữ">Nữ</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* Dân tộc */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth size="small" required>
                                        <InputLabel>Dân tộc *</InputLabel>
                                        <Select
                                            value={formData.ethnicity}
                                            onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                                            label="Dân tộc *"
                                        >
                                            {VIETNAM_ETHNICITIES.map((eth) => (
                                                <MenuItem key={eth.code} value={eth.name}>
                                                    {eth.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* Ngày nhập học */}
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Ngày nhập học *"
                                        value={formData.enrollmentDate}
                                        onChange={(newValue) => setFormData({ ...formData, enrollmentDate: newValue })}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                fullWidth: true,
                                                required: true,
                                            },
                                        }}
                                    />
                                </Grid>

                                {/* ✅ Nhóm tuổi hiện tại - DISABLE khi hasClass */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth size="small" required disabled={hasClass}>
                                        <InputLabel>Nhóm tuổi hiện tại *</InputLabel>
                                        <Select
                                            value={formData.currentAgeGroup}
                                            onChange={(e) =>
                                                setFormData({ ...formData, currentAgeGroup: e.target.value })
                                            }
                                            label="Nhóm tuổi hiện tại *"
                                        >
                                            <MenuItem value="">-- Chọn --</MenuItem>
                                            {AGE_GROUPS.map((group) => (
                                                <MenuItem key={group.value} value={group.value}>
                                                    {group.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {hasClass && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mt: 0.5, display: 'block' }}
                                        >
                                            Không thể thay đổi (Nhóm tuổi) khi học sinh đã có lớp
                                        </Typography>
                                    )}
                                </Grid>

                                {/* ✅ Trạng thái - DISABLE khi hasClass */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth size="small" required disabled={hasClass}>
                                        <InputLabel>Trạng thái *</InputLabel>
                                        <Select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            label="Trạng thái *"
                                        >
                                            <MenuItem value="Đang học">Đang học</MenuItem>
                                            <MenuItem value="Nghỉ học">Nghỉ học</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {hasClass && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mt: 0.5, display: 'block' }}
                                        >
                                            Không thể thay đổi (Trạng thái) khi học sinh đã có lớp
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Section 2: Thông tin gia đình */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1" fontWeight={600} color="secondary.main">
                                👨‍👩‍👧 Thông tin gia đình
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                {/* Mẹ */}
                                <Grid item xs={12}>
                                    <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                                        Thông tin mẹ
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Họ và tên mẹ"
                                        value={formData.motherName}
                                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Năm sinh mẹ"
                                        type="number"
                                        value={formData.motherBirthYear}
                                        onChange={(e) => setFormData({ ...formData, motherBirthYear: e.target.value })}
                                        fullWidth
                                        size="small"
                                        inputProps={{ min: 1940, max: new Date().getFullYear() }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Số điện thoại mẹ"
                                        value={formData.motherPhone}
                                        onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                                        fullWidth
                                        size="small"
                                        placeholder="VD: 0901234567"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Email mẹ"
                                        type="email"
                                        value={formData.motherEmail}
                                        onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                                        fullWidth
                                        size="small"
                                        placeholder="VD: [email protected]"
                                    />
                                </Grid>

                                {/* Bố */}
                                <Grid item xs={12}>
                                    <Box sx={{ borderTop: '1px solid #e0e0e0', my: 1 }} />
                                    <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                                        Thông tin bố
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Họ và tên bố"
                                        value={formData.fatherName}
                                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Năm sinh bố"
                                        type="number"
                                        value={formData.fatherBirthYear}
                                        onChange={(e) => setFormData({ ...formData, fatherBirthYear: e.target.value })}
                                        fullWidth
                                        size="small"
                                        inputProps={{ min: 1940, max: new Date().getFullYear() }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Số điện thoại bố"
                                        value={formData.fatherPhone}
                                        onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                                        fullWidth
                                        size="small"
                                        placeholder="VD: 0901234567"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Email bố"
                                        type="email"
                                        value={formData.fatherEmail}
                                        onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                                        fullWidth
                                        size="small"
                                        placeholder="VD: [email protected]"
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>

                    {/* Section 3: Thông tin địa chỉ */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1" fontWeight={600} color="error.main">
                                📍 Thông tin địa chỉ
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Địa chỉ thường trú *"
                                        value={formData.permanentAddress}
                                        onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                                        fullWidth
                                        size="small"
                                        required
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Địa chỉ hiện tại *"
                                        value={formData.currentAddress}
                                        onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                                        fullWidth
                                        size="small"
                                        required
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </DialogContent>

                <Box sx={{ borderTop: '1px solid #e0e0e0' }} />

                <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit" size="small">
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary" size="small" disabled={loading}>
                        {loading ? <CircularProgress size={20} color="inherit" /> : isCreateMode ? 'Thêm' : 'Cập nhật'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}

export default ChildrenManagementDialog;
