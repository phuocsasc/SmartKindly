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
    Chip,
    Avatar,
    FormGroup,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { classApi } from '~/apis/classApi';
import { toast } from 'react-toastify';

const GRADES = ['Nhà trẻ', 'Mầm', 'Chồi', 'Lá'];

function ClassDialog({ open, mode, classData, academicYearId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        grade: '',
        ageGroup: '',
        name: '',
        homeRoomTeacher: '',
        description: '',
        sessions: {
            morning: false,
            afternoon: false,
            evening: false,
        },
    });

    const [loading, setLoading] = useState(false);
    const [ageGroups, setAgeGroups] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [loadingAgeGroups, setLoadingAgeGroups] = useState(false);

    const isCreateMode = mode === 'create';

    useEffect(() => {
        const initializeForm = async () => {
            if (mode === 'edit' && classData) {
                console.log('📋 [ClassDialog] Edit mode - classData:', classData);

                // ✅ Fetch dữ liệu TRƯỚC
                if (classData.grade) {
                    await fetchAgeGroupsByGrade(classData.grade);
                    await fetchAvailableTeachers();
                }

                // ✅ SAU ĐÓ mới set formData
                setFormData({
                    grade: classData.grade || '',
                    ageGroup: classData.ageGroup || '',
                    name: classData.name || '',
                    homeRoomTeacher: classData.homeRoomTeacherId || '', // ✅ Sử dụng ID
                    description: classData.description || '',
                    sessions: {
                        morning: classData.sessions?.morning || false,
                        afternoon: classData.sessions?.afternoon || false,
                        evening: classData.sessions?.evening || false,
                    },
                });

                console.log('✅ [ClassDialog] Form initialized with teacher ID:', classData.homeRoomTeacherId);
            } else {
                setFormData({
                    grade: '',
                    ageGroup: '',
                    name: '',
                    homeRoomTeacher: '',
                    description: '',
                    sessions: {
                        morning: false,
                        afternoon: false,
                        evening: false,
                    },
                });
                setAgeGroups([]);
                setAvailableTeachers([]);
            }
        };

        if (open) {
            initializeForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, classData, open]);

    // ✅ Fetch age groups by grade
    const fetchAgeGroupsByGrade = async (grade) => {
        if (!grade) return;

        try {
            setLoadingAgeGroups(true);
            const res = await classApi.getAgeGroupsByGrade(grade);

            // ✅ FIX: Kiểm tra response structure
            const ageGroups = res.data?.data?.ageGroups || [];
            setAgeGroups(ageGroups);

            console.log('✅ [fetchAgeGroupsByGrade] Loaded:', ageGroups);
        } catch (error) {
            console.error('Error fetching age groups:', error);
            toast.error('Lỗi khi tải danh sách Nhóm tuổi!');
            setAgeGroups([]); // ✅ Set empty array on error
        } finally {
            setLoadingAgeGroups(false);
        }
    };

    // ✅ Fetch available teachers
    const fetchAvailableTeachers = async () => {
        if (!academicYearId) return;

        try {
            setLoadingTeachers(true);

            const currentClassId = mode === 'edit' ? classData?.id : null;

            console.log('🔍 [fetchAvailableTeachers] Params:', {
                academicYearId,
                currentClassId,
            });

            const res = await classApi.getAvailableTeachers(academicYearId, currentClassId);

            // ✅ FIX: Kiểm tra response structure
            const teachers = res.data?.data?.teachers || res.data?.data || [];
            setAvailableTeachers(teachers);

            console.log('✅ [fetchAvailableTeachers] Loaded:', {
                count: teachers.length,
                teacherIds: teachers.map((t) => t._id),
            });
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast.error('Lỗi khi tải danh sách giáo viên!');
            setAvailableTeachers([]); // ✅ Set empty array on error
        } finally {
            setLoadingTeachers(false);
        }
    };

    // Handle grade change
    const handleGradeChange = (grade) => {
        setFormData({ ...formData, grade, ageGroup: '' });
        fetchAgeGroupsByGrade(grade);

        // Fetch teachers khi đã chọn grade
        if (!availableTeachers.length) {
            fetchAvailableTeachers();
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.grade) {
            toast.error('Vui lòng chọn khối!');
            return;
        }
        if (!formData.ageGroup) {
            toast.error('Vui lòng chọn Nhóm tuổi!');
            return;
        }
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên lớp!');
            return;
        }
        if (!formData.homeRoomTeacher) {
            toast.error('Vui lòng chọn giáo viên chủ nhiệm!');
            return;
        }
        if (!formData.sessions.morning && !formData.sessions.afternoon && !formData.sessions.evening) {
            toast.error('Vui lòng chọn ít nhất một buổi học!');
            return;
        }

        try {
            setLoading(true);

            const dataToSubmit = {
                ...formData,
            };

            console.log('📤 [ClassDialog] Data to submit:', dataToSubmit);

            if (mode === 'create') {
                await classApi.create(dataToSubmit);
                toast.success('Tạo lớp học thành công!');
            } else {
                // ✅ FIX: Sử dụng classData.id (đã được map từ _id)
                const classId = classData?.id;

                if (!classId) {
                    console.error('❌ [ClassDialog] Missing class ID:', classData);
                    toast.error('Không tìm thấy ID lớp học!');
                    return;
                }

                console.log('📝 [ClassDialog] Updating class with ID:', classId);

                await classApi.update(classId, dataToSubmit);
                toast.success('Cập nhật lớp học thành công!');
            }

            onSuccess();
            onClose();

            onSuccess();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
                        {isCreateMode ? <AddCircleOutlineIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {isCreateMode ? 'Thêm lớp học mới' : 'Chỉnh sửa lớp học'}
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
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    py: 2.5,
                    maxHeight: '70vh', // 👈 cần có để xuất hiện scroll
                    overflowY: 'auto',
                    mt: -2,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#0964a1a4', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Section: Thông tin cơ bản */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mt: 2,
                                mb: 1.5,
                                color: '#667eea',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#667eea', borderRadius: 1 }} />
                            Thông tin cơ bản
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Khối */}
                            <FormControl fullWidth size="small">
                                <InputLabel>Khối *</InputLabel>
                                <Select
                                    value={formData.grade}
                                    onChange={(e) => handleGradeChange(e.target.value)}
                                    label="Khối *"
                                >
                                    <MenuItem value="">-- Chọn khối --</MenuItem>
                                    {GRADES.map((grade) => (
                                        <MenuItem key={grade} value={grade}>
                                            {grade}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Nhóm tuổi */}
                            <FormControl fullWidth size="small" disabled={!formData.grade || loadingAgeGroups}>
                                <InputLabel>Nhóm tuổi *</InputLabel>
                                <Select
                                    value={formData.ageGroup}
                                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                                    label="Nhóm tuổi *"
                                >
                                    <MenuItem value="">-- Chọn Nhóm tuổi --</MenuItem>
                                    {ageGroups.map((group) => (
                                        <MenuItem key={group} value={group}>
                                            {group}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Tên lớp */}
                            <TextField
                                label="Tên lớp"
                                placeholder="VD: Nhà trẻ 1, Mầm 1, ..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                fullWidth
                                size="small"
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Section: Giáo viên chủ nhiệm */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: '#764ba2',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#764ba2', borderRadius: 1 }} />
                            Giáo viên chủ nhiệm
                        </Typography>

                        {loadingTeachers ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : availableTeachers.length === 0 ? (
                            <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                                Không có giáo viên khả dụng.
                            </Alert>
                        ) : (
                            <FormControl fullWidth size="small">
                                <InputLabel>Chọn giáo viên *</InputLabel>
                                <Select
                                    value={formData.homeRoomTeacher}
                                    onChange={(e) => setFormData({ ...formData, homeRoomTeacher: e.target.value })}
                                    label="Chọn giáo viên *"
                                >
                                    <MenuItem value="">-- Chọn giáo viên --</MenuItem>
                                    {availableTeachers.map((teacher) => (
                                        <MenuItem key={teacher._id} value={teacher._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonOutlinedIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{teacher.fullName}</Typography>
                                                <Chip label={teacher.username} size="small" variant="outlined" />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                    <Divider />

                    {/* Section: Buổi học */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: '#ff9800',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#ff9800', borderRadius: 1 }} />
                            Buổi học *
                        </Typography>

                        <FormGroup row>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.sessions.morning}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sessions: { ...formData.sessions, morning: e.target.checked },
                                            })
                                        }
                                        sx={{
                                            color: '#667eea',
                                            '&.Mui-checked': { color: '#667eea' },
                                        }}
                                    />
                                }
                                label="Sáng"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.sessions.afternoon}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sessions: { ...formData.sessions, afternoon: e.target.checked },
                                            })
                                        }
                                        sx={{
                                            color: '#667eea',
                                            '&.Mui-checked': { color: '#667eea' },
                                        }}
                                    />
                                }
                                label="Chiều"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.sessions.evening}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sessions: { ...formData.sessions, evening: e.target.checked },
                                            })
                                        }
                                        sx={{
                                            color: '#667eea',
                                            '&.Mui-checked': { color: '#667eea' },
                                        }}
                                    />
                                }
                                label="Tối"
                            />
                        </FormGroup>
                    </Box>

                    <Divider />

                    {/* Section: Ghi chú */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1.5,
                                color: '#9e9e9e',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Box sx={{ width: 3, height: 14, bgcolor: '#9e9e9e', borderRadius: 1 }} />
                            Ghi chú
                        </Typography>

                        <TextField
                            label="Mô tả/Ghi chú"
                            placeholder="Nhập mô tả hoặc ghi chú..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={3}
                            fullWidth
                            size="small"
                        />
                    </Box>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
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
                    Hủy
                </Button>
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
            </DialogActions>
        </Dialog>
    );
}

export default ClassDialog;
