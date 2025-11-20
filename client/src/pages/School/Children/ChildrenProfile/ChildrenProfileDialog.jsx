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
    Divider,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Alert,
    Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { childrenProfileApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import { useUser } from '~/contexts/UserContext';

// Constants

const ENROLLMENT_FORMS = ['Xét tuyển', 'Trúng tuyển', 'Chuyển đến từ trường khác'];

const SWIMMING_LEVELS = ['Chưa biết', 'Biết sơ cấp', 'Biết bơi thành thạo'];

const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'Không rõ'];

const FAMILY_COMPONENTS = ['Công nhân', 'Nông dân', 'Khác'];

function ChildrenProfileDialog({ open, mode, profileData, academicYearId, onClose, onSuccess }) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [accessibleAgeGroups, setAccessibleAgeGroups] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(false);

    const [formData, setFormData] = useState({
        // Thông tin cơ bản
        fullName: '',
        birthDate: null,
        gender: '',
        ageGroup: '',
        classId: '',
        status: 'Đang học',
        enrollmentDate: null,
        enrollmentForm: '',

        // Thông tin khai sinh
        birthPlace: '',
        hometown: '',
        permanentAddress: '',
        temporaryAddress: '',
        ethnicity: '',
        religion: '',

        // Thông tin bổ sung
        swimmingLevel: '',
        bloodType: '',
        hasComputer: '',
        hasSmartphone: '',
        familyComponent: '',

        // Thông tin bố
        fatherName: '',
        fatherBirthYear: '',
        fatherOccupation: '',
        fatherPhone: '',
        fatherEmail: '',

        // Thông tin mẹ
        motherName: '',
        motherBirthYear: '',
        motherOccupation: '',
        motherPhone: '',
        motherEmail: '',

        // Thông tin người giám hộ
        guardianName: '',
        guardianBirthYear: '',
        guardianOccupation: '',
        guardianPhone: '',
        guardianEmail: '',
    });

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    // Fetch accessible age groups based on user role
    useEffect(() => {
        if (open && academicYearId) {
            fetchAccessibleAgeGroups();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, academicYearId]);

    // Load profile data when editing
    useEffect(() => {
        if (open && mode === 'edit' && profileData) {
            setFormData({
                fullName: profileData.fullName || '',
                birthDate: profileData.birthDate ? dayjs(profileData.birthDate) : null,
                gender: profileData.gender || '',
                ageGroup: profileData.ageGroup || '',
                classId: profileData.classId?._id || '',
                status: profileData.status || 'Đang học',
                enrollmentDate: profileData.enrollmentDate ? dayjs(profileData.enrollmentDate) : null,
                enrollmentForm: profileData.enrollmentForm || '',
                birthPlace: profileData.birthPlace || '',
                hometown: profileData.hometown || '',
                permanentAddress: profileData.permanentAddress || '',
                temporaryAddress: profileData.temporaryAddress || '',
                ethnicity: profileData.ethnicity || '',
                religion: profileData.religion || '',
                swimmingLevel: profileData.swimmingLevel || '',
                bloodType: profileData.bloodType || '',
                hasComputer: profileData.hasComputer || '',
                hasSmartphone: profileData.hasSmartphone || '',
                familyComponent: profileData.familyComponent || '',
                fatherName: profileData.fatherName || '',
                fatherBirthYear: profileData.fatherBirthYear || '',
                fatherOccupation: profileData.fatherOccupation || '',
                fatherPhone: profileData.fatherPhone || '',
                fatherEmail: profileData.fatherEmail || '',
                motherName: profileData.motherName || '',
                motherBirthYear: profileData.motherBirthYear || '',
                motherOccupation: profileData.motherOccupation || '',
                motherPhone: profileData.motherPhone || '',
                motherEmail: profileData.motherEmail || '',
                guardianName: profileData.guardianName || '',
                guardianBirthYear: profileData.guardianBirthYear || '',
                guardianOccupation: profileData.guardianOccupation || '',
                guardianPhone: profileData.guardianPhone || '',
                guardianEmail: profileData.guardianEmail || '',
            });

            // Fetch classes for the selected age group
            if (profileData.ageGroup) {
                fetchClassesByAgeGroup(profileData.ageGroup);
            }
        } else if (open && mode === 'create') {
            // Reset form for create mode
            setFormData({
                fullName: '',
                birthDate: null,
                gender: '',
                ageGroup: '',
                classId: '',
                status: 'Đang học',
                enrollmentDate: null,
                enrollmentForm: '',
                birthPlace: '',
                hometown: '',
                permanentAddress: '',
                temporaryAddress: '',
                ethnicity: '',
                religion: '',
                swimmingLevel: '',
                bloodType: '',
                hasComputer: '',
                hasSmartphone: '',
                familyComponent: '',
                fatherName: '',
                fatherBirthYear: '',
                fatherOccupation: '',
                fatherPhone: '',
                fatherEmail: '',
                motherName: '',
                motherBirthYear: '',
                motherOccupation: '',
                motherPhone: '',
                motherEmail: '',
                guardianName: '',
                guardianBirthYear: '',
                guardianOccupation: '',
                guardianPhone: '',
                guardianEmail: '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, profileData]);

    // Fetch accessible age groups based on user role and permissions
    const fetchAccessibleAgeGroups = async () => {
        try {
            const res = await childrenProfileApi.getAccessibleAgeGroups(academicYearId);
            const ageGroups = res.data.data.ageGroups || [];
            setAccessibleAgeGroups(ageGroups);

            // Auto-select for teachers (they only have 1 age group)
            if (user?.role === 'giao_vien' && ageGroups.length === 1) {
                setFormData((prev) => ({ ...prev, ageGroup: ageGroups[0] }));
                fetchClassesByAgeGroup(ageGroups[0]);
            }
        } catch (error) {
            console.error('Error fetching accessible age groups:', error);
            toast.error('Lỗi khi tải danh sách nhóm tuổi!');
        }
    };

    // Fetch classes by age group
    const fetchClassesByAgeGroup = async (ageGroup) => {
        if (!ageGroup || !academicYearId) return;

        try {
            setLoadingClasses(true);
            const res = await childrenProfileApi.getClassesByAgeGroup(academicYearId, ageGroup);
            const classes = res.data.data.classes || [];
            setAvailableClasses(classes);

            // Auto-select for teachers (they only have 1 class)
            if (user?.role === 'giao_vien' && classes.length === 1) {
                setFormData((prev) => ({ ...prev, classId: classes[0]._id }));
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
        } finally {
            setLoadingClasses(false);
        }
    };

    // Handle age group change
    const handleAgeGroupChange = (ageGroup) => {
        setFormData({ ...formData, ageGroup, classId: '' });
        setAvailableClasses([]);
        fetchClassesByAgeGroup(ageGroup);
    };

    // Validate form
    const validateForm = () => {
        if (!formData.fullName.trim()) {
            toast.error('Vui lòng nhập họ và tên học sinh!');
            return false;
        }
        if (!formData.birthDate) {
            toast.error('Vui lòng chọn ngày sinh!');
            return false;
        }
        if (!formData.gender) {
            toast.error('Vui lòng chọn giới tính!');
            return false;
        }
        if (!formData.ageGroup) {
            toast.error('Vui lòng chọn khối nhóm tuổi!');
            return false;
        }
        if (!formData.classId) {
            toast.error('Vui lòng chọn lớp học!');
            return false;
        }
        if (!formData.enrollmentDate) {
            toast.error('Vui lòng chọn ngày nhập học!');
            return false;
        }
        if (!formData.permanentAddress.trim()) {
            toast.error('Vui lòng nhập địa chỉ thường trú!');
            return false;
        }
        if (!formData.temporaryAddress.trim()) {
            toast.error('Vui lòng nhập địa chỉ tạm trú!');
            return false;
        }
        if (!formData.ethnicity.trim()) {
            toast.error('Vui lòng nhập dân tộc!');
            return false;
        }
        return true;
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            const dataToSubmit = {
                ...formData,
                academicYearId,
                birthDate: formData.birthDate ? formData.birthDate.toISOString() : null,
                enrollmentDate: formData.enrollmentDate ? formData.enrollmentDate.toISOString() : null,
            };

            if (mode === 'create') {
                await childrenProfileApi.create(dataToSubmit);
                toast.success('Thêm hồ sơ trẻ em thành công!');
            } else {
                await childrenProfileApi.update(profileData._id, dataToSubmit);
                toast.success('Cập nhật hồ sơ trẻ em thành công!');
            }

            onSuccess();
        } catch (error) {
            console.error('Error submitting profile:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    // Check if age group and class are disabled (for teachers)
    const isAgeGroupDisabled = user?.role === 'giao_vien' && accessibleAgeGroups.length === 1;
    const isClassDisabled = user?.role === 'giao_vien' && availableClasses.length === 1;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    },
                }}
            >
                {/* Header */}
                <DialogTitle
                    sx={{
                        background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                        color: '#fff',
                        py: 1,
                        position: 'relative',
                        mb: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                width: 30,
                                height: 30,
                            }}
                        >
                            {isCreateMode ? (
                                <AddCircleOutlineIcon fontSize="small" />
                            ) : isViewMode ? (
                                <VisibilityIcon fontSize="small" />
                            ) : (
                                <EditIcon fontSize="small" />
                            )}
                        </Avatar>
                        <Typography variant="h6" fontWeight={600}>
                            {isCreateMode
                                ? 'Thêm hồ sơ trẻ em mới'
                                : isViewMode
                                  ? 'Xem hồ sơ trẻ em'
                                  : 'Chỉnh sửa hồ sơ trẻ em'}
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
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                    >
                        <CloseIcon fontSize="small" sx={{ color: 'red' }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent
                    sx={{
                        px: 3,
                        py: 2.5,
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        mt: -2,
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                        '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            '&:hover fieldset': {
                                borderColor: '#1976d2',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                            },
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Accordion 1: Thông tin cơ bản */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                                    👤 Thông tin cơ bản
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Họ và tên */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Họ và tên *"
                                            placeholder="VD: Nguyễn Thị Minh Hòa"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            fullWidth
                                            size="small"
                                            required
                                            disabled={isViewMode}
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
                                            disabled={isViewMode}
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
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="Nam">Nam</MenuItem>
                                                <MenuItem value="Nữ">Nữ</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Khối nhóm tuổi */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl
                                            fullWidth
                                            size="small"
                                            required
                                            disabled={isAgeGroupDisabled || isViewMode}
                                        >
                                            <InputLabel>Khối nhóm tuổi *</InputLabel>
                                            <Select
                                                value={formData.ageGroup}
                                                onChange={(e) => handleAgeGroupChange(e.target.value)}
                                                label="Khối nhóm tuổi *"
                                            >
                                                {accessibleAgeGroups.map((group) => (
                                                    <MenuItem key={group} value={group}>
                                                        {group}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        {isAgeGroupDisabled && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ mt: 0.5, display: 'block' }}
                                            >
                                                Chỉ hiển thị nhóm tuổi của lớp bạn được phân công
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Lớp học */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl
                                            fullWidth
                                            size="small"
                                            required
                                            disabled={
                                                !formData.ageGroup || loadingClasses || isClassDisabled || isViewMode
                                            }
                                        >
                                            <InputLabel>Tên lớp *</InputLabel>
                                            <Select
                                                value={formData.classId}
                                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                                label="Tên lớp *"
                                            >
                                                {availableClasses.map((cls) => (
                                                    <MenuItem key={cls._id} value={cls._id}>
                                                        {cls.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        {loadingClasses && (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                                <CircularProgress size={20} />
                                            </Box>
                                        )}
                                        {isClassDisabled && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ mt: 0.5, display: 'block' }}
                                            >
                                                Chỉ hiển thị lớp học bạn được phân công
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Trạng thái */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small" required>
                                            <InputLabel>Trạng thái *</InputLabel>
                                            <Select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                label="Trạng thái *"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="Đang học">Đang học</MenuItem>
                                                <MenuItem value="Nghỉ học">Nghỉ học</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Ngày nhập học */}
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="Ngày nhập học *"
                                            value={formData.enrollmentDate}
                                            onChange={(newValue) =>
                                                setFormData({ ...formData, enrollmentDate: newValue })
                                            }
                                            format="DD/MM/YYYY"
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                    required: true,
                                                },
                                            }}
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Hình thức nhập học */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Hình thức</InputLabel>
                                            <Select
                                                value={formData.enrollmentForm}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, enrollmentForm: e.target.value })
                                                }
                                                label="Hình thức"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {ENROLLMENT_FORMS.map((form) => (
                                                    <MenuItem key={form} value={form}>
                                                        {form}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Accordion 2: Thông tin khai sinh */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="secondary.main">
                                    📋 Thông tin khai sinh
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Nơi sinh */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Nơi sinh"
                                            placeholder="VD: Bệnh viện phụ sản Cần Thơ"
                                            value={formData.birthPlace}
                                            onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Quê quán */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Quê quán"
                                            placeholder="VD: Xã Mỹ Lộc, huyện Tam Bình, tỉnh Vĩnh Long"
                                            value={formData.hometown}
                                            onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Địa chỉ thường trú */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Địa chỉ thường trú *"
                                            placeholder="VD: số 9, Nguyễn Thái Học, Phường Long Châu, tỉnh Vĩnh Long"
                                            value={formData.permanentAddress}
                                            onChange={(e) =>
                                                setFormData({ ...formData, permanentAddress: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            required
                                            multiline
                                            rows={2}
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Địa chỉ tạm trú */}
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Địa chỉ tạm trú *"
                                            placeholder="VD: số 9, Nguyễn Thái Học, Phường Long Châu, tỉnh Vĩnh Long"
                                            value={formData.temporaryAddress}
                                            onChange={(e) =>
                                                setFormData({ ...formData, temporaryAddress: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            required
                                            multiline
                                            rows={2}
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Dân tộc */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Dân tộc *"
                                            placeholder="VD: Kinh"
                                            value={formData.ethnicity}
                                            onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                                            fullWidth
                                            size="small"
                                            required
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    {/* Tôn giáo */}
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Tôn giáo"
                                            placeholder="VD: Không"
                                            value={formData.religion}
                                            onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Accordion 3: Thông tin bổ sung */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="success.main">
                                    ⚕️ Thông tin bổ sung
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {/* Biết bơi */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Biết bơi</InputLabel>
                                            <Select
                                                value={formData.swimmingLevel}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, swimmingLevel: e.target.value })
                                                }
                                                label="Biết bơi"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {SWIMMING_LEVELS.map((level) => (
                                                    <MenuItem key={level} value={level}>
                                                        {level}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Nhóm máu */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Nhóm máu</InputLabel>
                                            <Select
                                                value={formData.bloodType}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, bloodType: e.target.value })
                                                }
                                                label="Nhóm máu"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {BLOOD_TYPES.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Phụ huynh có máy tính */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Phụ huynh có máy tính</InputLabel>
                                            <Select
                                                value={formData.hasComputer}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, hasComputer: e.target.value })
                                                }
                                                label="Phụ huynh có máy tính"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                <MenuItem value="Có">Có</MenuItem>
                                                <MenuItem value="Không">Không</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Phụ huynh có smartphone */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Phụ huynh có smartphone</InputLabel>
                                            <Select
                                                value={formData.hasSmartphone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, hasSmartphone: e.target.value })
                                                }
                                                label="Phụ huynh có smartphone"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                <MenuItem value="Có">Có</MenuItem>
                                                <MenuItem value="Không">Không</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Thành phần gia đình */}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Thành phần gia đình</InputLabel>
                                            <Select
                                                value={formData.familyComponent}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, familyComponent: e.target.value })
                                                }
                                                label="Thành phần gia đình"
                                                disabled={isViewMode}
                                            >
                                                <MenuItem value="">-- Chọn --</MenuItem>
                                                {FAMILY_COMPONENTS.map((comp) => (
                                                    <MenuItem key={comp} value={comp}>
                                                        {comp}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Accordion 4: Thông tin bố */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="info.main">
                                    👨 Thông tin bố
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Tên bố"
                                            placeholder="VD: Nguyễn Văn Hùng"
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Năm sinh bố"
                                            placeholder="VD: 1980"
                                            value={formData.fatherBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, fatherBirthYear: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            type="number"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nghề nghiệp bố"
                                            placeholder="VD: Xây Dựng"
                                            value={formData.fatherOccupation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, fatherOccupation: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="SĐT bố"
                                            placeholder="VD: 0909123456"
                                            value={formData.fatherPhone}
                                            onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            label="Email bố"
                                            placeholder="VD: nguyenvanhung@gmail.com"
                                            value={formData.fatherEmail}
                                            onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                                            fullWidth
                                            size="small"
                                            type="email"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Accordion 5: Thông tin mẹ */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="error.main">
                                    👩 Thông tin mẹ
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Tên mẹ"
                                            placeholder="VD: Trần Thị Minh Lan"
                                            value={formData.motherName}
                                            onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Năm sinh mẹ"
                                            placeholder="VD: 1982"
                                            value={formData.motherBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, motherBirthYear: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            type="number"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nghề nghiệp mẹ"
                                            placeholder="VD: Giáo viên"
                                            value={formData.motherOccupation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, motherOccupation: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="SĐT mẹ"
                                            placeholder="VD: 0909987654"
                                            value={formData.motherPhone}
                                            onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            label="Email mẹ"
                                            placeholder="VD: tranthiminhlan@gmail.com"
                                            value={formData.motherEmail}
                                            onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                                            fullWidth
                                            size="small"
                                            type="email"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Accordion 6: Thông tin người giám hộ */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1" fontWeight={600} color="warning.main">
                                    👥 Thông tin người giám hộ
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Tên người giám hộ"
                                            placeholder="VD: Lê Thị Hồng"
                                            value={formData.guardianName}
                                            onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Năm sinh người giám hộ"
                                            placeholder="VD: 1975"
                                            value={formData.guardianBirthYear}
                                            onChange={(e) =>
                                                setFormData({ ...formData, guardianBirthYear: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            type="number"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="Nghề nghiệp người giám hộ"
                                            placeholder="VD: Công nhân"
                                            value={formData.guardianOccupation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, guardianOccupation: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            label="SĐT người giám hộ"
                                            placeholder="VD: 0909345678"
                                            value={formData.guardianPhone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, guardianPhone: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            disabled={isViewMode}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            label="Email người giám hộ"
                                            placeholder="VD: lethihong@gmail.com"
                                            value={formData.guardianEmail}
                                            onChange={(e) =>
                                                setFormData({ ...formData, guardianEmail: e.target.value })
                                            }
                                            fullWidth
                                            size="small"
                                            type="email"
                                            disabled={isViewMode}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Warning for teachers */}
                        {(isAgeGroupDisabled || isClassDisabled) && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    ℹ️ Bạn chỉ có thể thêm/sửa hồ sơ trẻ trong lớp học mà bạn được phân công giảng dạy.
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            px: 2.5,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {isViewMode ? 'Đóng' : 'Hủy'}
                    </Button>
                    {!isViewMode && (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                            size="small"
                            sx={{
                                borderRadius: 1.5,
                                px: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                boxShadow: 2,
                                background: 'linear-gradient(135deg, #0071bc 100%, #aee2ff 100%)',
                                '&:hover': {
                                    boxShadow: 3,
                                    background: 'linear-gradient(135deg, #1180caff 100%, #aee2ff 100%)',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={20} sx={{ color: '#fff' }} />
                            ) : isCreateMode ? (
                                'Tạo mới'
                            ) : (
                                'Cập nhật'
                            )}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}

export default ChildrenProfileDialog;
