import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Chip,
} from '@mui/material';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { schoolMenuApplyApi, academicYearApi, scheduleApi, schoolNutritionalStandardApi, schoolApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import MenuApplyDialog from './MenuApplyDialog';
import ConfirmDialog from '~/components/common/ConfirmDialog';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MenuApplyCopyDialog from './MenuApplyCopyDialog';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'; // ✅ NEW
import { exportWeeklyMenuToPdf } from '~/utils/weeklyMenuPdfExport'; // ✅ NEW

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

function MenuApply() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);
    const { dialogState, showConfirm, handleCancel } = useConfirmDialog();

    // State
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [ageGroups, setAgeGroups] = useState([]);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [currentWeekData, setCurrentWeekData] = useState(null);
    const [menuApplies, setMenuApplies] = useState([]);
    const [holidays, setHolidays] = useState([]);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create');
    const [dialogData, setDialogData] = useState(null);
    const [openCopyDialog, setOpenCopyDialog] = useState(false);
    const [copyInfo, setCopyInfo] = useState(null);
    const [exportingPdf, setExportingPdf] = useState(false);

    // Permissions
    const canCreate = hasPermission(PERMISSIONS.CREATE_MENU_APPLY);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_MENU_APPLY);
    const canDelete = hasPermission(PERMISSIONS.DELETE_MENU_APPLY);

    const isActiveYear = selectedYear === activeYearId;

    // Fetch academic years
    const fetchAcademicYears = async () => {
        try {
            console.log('🔍 Fetching academic years...');
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            console.log('✅ Academic years response:', res.data);

            const items = res.data?.data?.academicYears || [];
            setAcademicYears(items);

            const activeYear = items.find((y) => y.status === 'active');
            if (activeYear) {
                setActiveYearId(activeYear._id);
                setSelectedYear(activeYear._id);
                console.log('✅ Active year found:', activeYear);
            } else {
                console.warn('⚠️ No active academic year found');
                if (items.length > 0) {
                    setSelectedYear(items[0]._id);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching academic years:', error);
            console.error('Response:', error.response?.data);
            setError('Không thể tải danh sách năm học. Vui lòng kiểm tra kết nối và thử lại.');
            toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách năm học!');
        }
    };

    // Fetch age groups
    const fetchAgeGroups = async () => {
        try {
            console.log('🔍 Fetching age groups...');
            const res = await schoolNutritionalStandardApi.getAll({ page: 1, limit: 100 });
            console.log('✅ Age groups response:', res.data);

            const standards = res.data?.data?.standards || [];
            const uniqueGroups = [...new Set(standards.map((s) => s.ageGroup))].filter(Boolean);
            setAgeGroups(uniqueGroups);

            if (uniqueGroups.length > 0) {
                setSelectedAgeGroup(uniqueGroups[0]);
                console.log('✅ Age groups found:', uniqueGroups);
            } else {
                console.warn('⚠️ No age groups found');
            }
        } catch (error) {
            console.error('❌ Error fetching age groups:', error);
            console.error('Response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách nhóm trẻ!');
        }
    };

    // Fetch weeks
    const fetchWeeks = async () => {
        if (!selectedYear) return;

        try {
            console.log('🔍 Fetching weeks for year:', selectedYear);
            const res = await schoolMenuApplyApi.getAvailableWeeks(selectedYear);
            console.log('✅ Weeks response:', res.data);

            const weeksData = res.data?.data?.weeks || [];
            setWeeks(weeksData);

            if (weeksData.length > 0) {
                // ✅ TỰ ĐỘNG CHỌN TUẦN HIỆN TẠI (BAO GỒM CẢ T7 VÀ CN)
                const today = dayjs(); // Lấy thời gian thực (đã theo config VN)

                const currentWeek = weeksData.find((w) => {
                    // start là 00:00:00 ngày Thứ 2 đầu tuần
                    const start = dayjs(w.startDate).startOf('day');
                    // ✅ THAY ĐỔI TẠI ĐÂY: Lấy start cộng thêm 6 ngày để ra 23:59:59 ngày Chủ Nhật
                    const endOfSunday = start.add(6, 'day').endOf('day');

                    // Kiểm tra xem ngày hôm nay có nằm trong dải [Thứ 2, Chủ Nhật] không
                    return today.isSameOrAfter(start) && today.isSameOrBefore(endOfSunday);
                });

                if (currentWeek) {
                    // Nếu tìm thấy tuần chứa ngày hôm nay (kể cả cuối tuần)
                    setSelectedWeek(currentWeek.weekNumber.toString());
                    console.log('📅 Auto-selected current week:', currentWeek.weekNumber);
                } else {
                    // Nếu hôm nay không thuộc tuần nào (ví dụ đang hè/nghỉ lễ), mặc định chọn tuần đầu tiên
                    setSelectedWeek(weeksData[0].weekNumber.toString());
                    console.log('📅 Today is outside school weeks, selecting week 1');
                }
            } else {
                console.warn('⚠️ No weeks found for this academic year');
                setSelectedWeek('');
            }
        } catch (error) {
            console.error('❌ Error fetching weeks:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách tuần!');
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    // Fetch holidays
    const fetchHolidays = async () => {
        if (!selectedYear) return;

        try {
            console.log('🔍 Fetching holidays for year:', selectedYear);
            const scheduleRes = await scheduleApi.getByAcademicYear(selectedYear);
            console.log('✅ Schedule response:', scheduleRes.data);

            const schedule = scheduleRes.data?.data;

            if (schedule?.holidays) {
                setHolidays(schedule.holidays);
                console.log('✅ Holidays found:', schedule.holidays.length);
            } else {
                setHolidays([]);
            }
        } catch (error) {
            console.error('❌ Error fetching holidays:', error);
            console.error('Response:', error.response?.data);
            // Không hiển thị toast lỗi vì holidays không bắt buộc
            setHolidays([]);
        }
    };

    // Fetch menu applies
    const fetchMenuApplies = async () => {
        if (!selectedYear || !selectedAgeGroup || !selectedWeek) {
            setMenuApplies([]);
            return;
        }

        try {
            setLoading(true);
            console.log('🔍 Fetching menu applies:', {
                academicYearId: selectedYear,
                ageGroup: selectedAgeGroup,
                weekNumber: selectedWeek,
            });

            const res = await schoolMenuApplyApi.getAll({
                academicYearId: selectedYear,
                ageGroup: selectedAgeGroup,
                weekNumber: selectedWeek,
                limit: 100,
            });
            console.log('✅ Menu applies response:', res.data);

            setMenuApplies(res.data?.data?.items || []);
        } catch (error) {
            console.error('❌ Error fetching menu applies:', error);
            console.error('Response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách thực đơn áp dụng!');
            setMenuApplies([]);
        } finally {
            setLoading(false);
        }
    };

    // Get week data
    useEffect(() => {
        if (selectedWeek && weeks.length > 0) {
            const weekData = weeks.find((w) => w.weekNumber === parseInt(selectedWeek));
            setCurrentWeekData(weekData);
            console.log('📅 Current week data:', weekData);
        } else {
            setCurrentWeekData(null);
        }
    }, [selectedWeek, weeks]);

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            setInitialLoading(true);
            setError(null);
            try {
                await Promise.all([fetchAcademicYears(), fetchAgeGroups()]);
            } catch (error) {
                console.error('❌ Error loading initial data:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchWeeks();
            fetchHolidays();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    useEffect(() => {
        fetchMenuApplies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedAgeGroup, selectedWeek]);

    // Format week display
    const formatWeekDisplay = (week) => {
        if (!week) return '';
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // Check if day is holiday
    const isHoliday = (date) => {
        if (!date) return false;
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return holidays.some((holiday) => dayjs(holiday).format('YYYY-MM-DD') === dateStr);
    };

    // Get menu apply for specific day and meal
    const getMenuApply = (dayOfWeek) => {
        return menuApplies.find((m) => m.dayOfWeek === dayOfWeek);
    };

    // Get meal data for specific session
    const getMealData = (dayOfWeek, mealSession) => {
        const menuApply = getMenuApply(dayOfWeek);
        if (!menuApply) return null;

        const meals = menuApply.menuSnapshot?.meals?.[mealSession] || [];
        return meals;
    };

    // Handle add/edit menu apply
    const handleAddMenuApply = (dayOfWeek, dayIndex) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể thêm thực đơn trong năm học đang hoạt động!');
            return;
        }

        if (!canCreate) {
            toast.warning('Bạn không có quyền thêm thực đơn áp dụng!');
            return;
        }

        const date = dayjs(currentWeekData.startDate).add(dayIndex, 'day');

        if (isHoliday(date)) {
            toast.warning('Ngày này đã được cấu hình nghỉ!');
            return;
        }

        const existingApply = getMenuApply(dayOfWeek);

        setDialogMode(existingApply ? 'edit' : 'create');
        setDialogData({
            menuApplyId: existingApply?._id,
            ageGroup: selectedAgeGroup,
            weekNumber: parseInt(selectedWeek),
            dayOfWeek,
            date: date.format('YYYY-MM-DD'),
            existingMenuId: existingApply?.menuId?._id,
        });
        setOpenDialog(true);
    };

    // Handle delete
    const handleDelete = async (dayOfWeek) => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể xóa thực đơn trong năm học đang hoạt động!');
            return;
        }

        if (!canDelete) {
            toast.warning('Bạn không có quyền xóa thực đơn áp dụng!');
            return;
        }

        const menuApply = getMenuApply(dayOfWeek);
        if (!menuApply) return;

        showConfirm({
            title: 'Xác nhận xóa thực đơn áp dụng',
            message: `Bạn có chắc chắn muốn xóa thực đơn áp dụng cho ${dayOfWeek}?`,
            severity: 'error',
            confirmText: 'Xóa',
            onConfirm: async () => {
                try {
                    await schoolMenuApplyApi.delete(menuApply._id);
                    toast.success('Xóa thực đơn áp dụng thành công!');
                    fetchMenuApplies();
                } catch (error) {
                    console.error('❌ Error deleting menu apply:', error);
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa thực đơn áp dụng!');
                }
            },
        });
    };

    // ✅ NEW: Handle copy menu applies
    const handleCopyMenuApplies = () => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể nhân bản thực đơn trong năm học đang hoạt động!');
            return;
        }

        if (!canCreate) {
            toast.warning('Bạn không có quyền nhân bản thực đơn áp dụng!');
            return;
        }

        if (!selectedWeek || menuApplies.length === 0) {
            toast.warning('Tuần hiện tại chưa có thực đơn áp dụng để nhân bản!');
            return;
        }

        // Check if there are weeks after current week
        const currentWeekNum = parseInt(selectedWeek);
        const remainingWeeks = weeks.filter((w) => w.weekNumber > currentWeekNum);

        if (remainingWeeks.length === 0) {
            toast.warning('Đây là tuần cuối cùng, không thể nhân bản sang các tuần sau!');
            return;
        }

        setCopyInfo({
            ageGroup: selectedAgeGroup,
            currentWeek: currentWeekNum,
            totalWeeks: weeks.length,
            weeks: weeks,
        });
        setOpenCopyDialog(true);
    };

    // ✅ NEW: Confirm copy
    const handleConfirmCopy = async (option) => {
        try {
            const currentWeekNum = parseInt(selectedWeek);
            const remainingWeeks = weeks.filter((w) => w.weekNumber > currentWeekNum);

            let targetWeekNumbers = [];

            switch (option) {
                case 'all':
                    targetWeekNumbers = remainingWeeks.map((w) => w.weekNumber);
                    break;
                case 'odd':
                    targetWeekNumbers = remainingWeeks.filter((w) => w.weekNumber % 2 !== 0).map((w) => w.weekNumber);
                    break;
                case 'even':
                    targetWeekNumbers = remainingWeeks.filter((w) => w.weekNumber % 2 === 0).map((w) => w.weekNumber);
                    break;
                default:
                    throw new Error('Invalid copy option');
            }

            if (targetWeekNumbers.length === 0) {
                toast.warning('Không có tuần nào phù hợp để nhân bản!');
                return;
            }

            const payload = {
                academicYearId: selectedYear,
                ageGroup: selectedAgeGroup,
                sourceWeekNumber: currentWeekNum,
                targetWeekNumbers,
            };

            console.log('📤 [Copy Menu Applies] Payload:', payload);

            const res = await schoolMenuApplyApi.copyToWeeks(payload);

            const summary = res.data.data;
            toast.success(
                `Nhân bản thành công! Đã tạo ${summary.created} mới, cập nhật ${summary.updated}, bỏ qua ${summary.skipped}`,
            );

            // Refresh data
            fetchMenuApplies();
        } catch (error) {
            console.error('❌ Error copying menu applies:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi nhân bản thực đơn!');
            throw error;
        }
    };

    // ✅ NEW: Handle delete week menus
    const handleDeleteWeekMenus = () => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể xóa thực đơn trong năm học đang hoạt động!');
            return;
        }

        if (!canDelete) {
            toast.warning('Bạn không có quyền xóa thực đơn áp dụng!');
            return;
        }

        if (!selectedWeek || menuApplies.length === 0) {
            toast.warning('Tuần hiện tại chưa có thực đơn áp dụng để xóa!');
            return;
        }

        const weekInfo = weeks.find((w) => w.weekNumber === parseInt(selectedWeek));
        const weekLabel = weekInfo
            ? `Tuần ${weekInfo.weekNumber} (${dayjs(weekInfo.startDate).format('DD/MM')} - ${dayjs(weekInfo.endDate).format('DD/MM')})`
            : `Tuần ${selectedWeek}`;

        showConfirm({
            title: 'Xác nhận xóa thực đơn tuần',
            message: (
                <Box>
                    <Typography sx={{ mb: 2 }}>
                        Bạn có chắc chắn muốn xóa thực đơn <br /> <strong>{weekLabel}</strong> không?
                    </Typography>
                </Box>
            ),
            severity: 'error',
            confirmText: 'Xác nhận xóa',
            cancelText: 'Hủy',
            onConfirm: async () => {
                try {
                    const payload = {
                        academicYearId: selectedYear,
                        ageGroup: selectedAgeGroup,
                        weekNumber: parseInt(selectedWeek),
                    };

                    console.log('📤 [Delete Week Menus] Payload:', payload);

                    const res = await schoolMenuApplyApi.deleteWeekMenus(payload);

                    const summary = res.data.data;
                    toast.success(
                        `Xóa thành công! Đã xóa ${summary.deleted} thực đơn${summary.skipped > 0 ? `, bỏ qua ${summary.skipped} ngày nghỉ` : ''}`,
                    );

                    // Refresh data
                    fetchMenuApplies();
                } catch (error) {
                    console.error('❌ Error deleting week menus:', error);
                    toast.error(error.response?.data?.message || 'Lỗi khi xóa thực đơn tuần!');
                }
            },
        });
    };

    // ✅ NEW: Handle export weekly menu to PDF
    const handleExportWeeklyMenuPdf = async () => {
        if (!selectedYear || !selectedAgeGroup || !selectedWeek || !currentWeekData) {
            toast.warning('Vui lòng chọn đầy đủ năm học, nhóm trẻ và tuần để xuất PDF!');
            return;
        }

        try {
            setExportingPdf(true);

            // ✅ 1. Fetch school info
            const schoolRes = await schoolApi.getSchoolInfo();
            const schoolName = schoolRes.data?.data?.name || 'TRƯỜNG MẦM NON';

            console.log('🏫 [Export PDF] School name:', schoolName);

            // ✅ 2. Fetch nutritional standard for the age group
            const standardRes = await schoolNutritionalStandardApi.getAll({ limit: 100 });
            const standards = standardRes.data?.data?.standards || [];
            const nutritionalStandard = standards.find((s) => s.ageGroup === selectedAgeGroup);

            if (!nutritionalStandard) {
                toast.error('Không tìm thấy định mức dinh dưỡng cho nhóm trẻ này!');
                return;
            }

            // ✅ 3. Prepare data for PDF export
            const weeklyMenuData = {
                schoolName: schoolName, // ✅ USE: fetched school name
                ageGroup: selectedAgeGroup,
                weekNumber: parseInt(selectedWeek),
                weekStartDate: currentWeekData.startDate,
                weekEndDate: currentWeekData.endDate,
                menuApplies: menuApplies,
                holidays: holidays,
                nutritionalStandard: {
                    totalCalories: nutritionalStandard.totalCalories,
                    recommendedCaloriesMin: nutritionalStandard.recommendedCaloriesMin,
                    recommendedCaloriesMax: nutritionalStandard.recommendedCaloriesMax,
                },
            };

            console.log('📤 [Export Weekly Menu PDF] Data:', weeklyMenuData);

            // ✅ 4. Export PDF
            await exportWeeklyMenuToPdf(weeklyMenuData);

            toast.success('Xuất PDF thực đơn tuần thành công!');
        } catch (error) {
            console.error('❌ Error exporting weekly menu PDF:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi xuất PDF thực đơn tuần!');
        } finally {
            setExportingPdf(false);
        }
    };

    // Handle dialog close
    const handleDialogClose = () => {
        setOpenDialog(false);
        setDialogData(null);
    };

    // Handle dialog success
    const handleDialogSuccess = () => {
        fetchMenuApplies();
        handleDialogClose();
    };

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

    if (error) {
        return (
            <MainLayout user={user}>
                <PageContainer>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                </PageContainer>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Dinh dưỡng', icon: RestaurantOutlinedIcon }, { text: 'Thực đơn áp dụng' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Thực đơn áp dụng
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Academic Year */}
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    label="Năm học"
                                    disabled={academicYears.length === 0}
                                >
                                    {academicYears.length === 0 ? (
                                        <MenuItem value="">Không có năm học</MenuItem>
                                    ) : (
                                        academicYears.map((year) => (
                                            <MenuItem key={year._id} value={year._id}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: year.status === 'active' ? 600 : 400,
                                                            color:
                                                                year.status === 'active'
                                                                    ? 'success.main'
                                                                    : 'text.primary',
                                                        }}
                                                    >
                                                        {year.fromYear}-{year.toYear}
                                                    </Typography>
                                                    {year.status === 'active' && (
                                                        <DoneOutlinedIcon color="success" fontSize="small" />
                                                    )}
                                                </Box>
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>

                            {/* Age Group */}
                            {ageGroups.length > 0 && (
                                <FormControl size="small" sx={{ minWidth: 250 }}>
                                    <InputLabel>Nhóm trẻ</InputLabel>
                                    <Select
                                        value={selectedAgeGroup}
                                        onChange={(e) => setSelectedAgeGroup(e.target.value)}
                                        label="Nhóm trẻ"
                                    >
                                        {ageGroups.map((group) => (
                                            <MenuItem key={group} value={group}>
                                                {group}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* Week */}
                            {weeks.length > 0 && (
                                <FormControl size="small" sx={{ minWidth: 210 }}>
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
                            )}

                            {/* ✅ NEW: Export PDF Button */}
                            {selectedYear && selectedAgeGroup && selectedWeek && currentWeekData && (
                                <Tooltip title="Xuất file PDF thực đơn tuần">
                                    <span>
                                        <IconButton
                                            onClick={handleExportWeeklyMenuPdf}
                                            disabled={exportingPdf}
                                            sx={{
                                                color: '#e74c3c',
                                                bgcolor: 'rgba(231, 76, 60, 0.08)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(231, 76, 60, 0.15)',
                                                },
                                                '&:disabled': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                                                },
                                            }}
                                        >
                                            {exportingPdf ? (
                                                <CircularProgress size={20} sx={{ color: '#e74c3c' }} />
                                            ) : (
                                                <PictureAsPdfOutlinedIcon />
                                            )}
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}

                            {/* ✅ NEW: Copy Button */}
                            {isActiveYear && selectedWeek && menuApplies.length > 0 && canCreate && (
                                <Tooltip title="Nhân bản thực đơn cho các tuần sau">
                                    <IconButton
                                        onClick={handleCopyMenuApplies}
                                        sx={{
                                            color: '#667eea',
                                            bgcolor: 'rgba(102, 126, 234, 0.08)',
                                            '&:hover': {
                                                bgcolor: 'rgba(102, 126, 234, 0.15)',
                                            },
                                        }}
                                    >
                                        <ContentCopyIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* ✅ NEW: Delete Week Button */}
                            {isActiveYear && selectedWeek && menuApplies.length > 0 && canDelete && (
                                <Tooltip title="Xóa thực đơn tuần">
                                    <IconButton
                                        onClick={handleDeleteWeekMenus}
                                        sx={{
                                            color: '#d32f2f',
                                            bgcolor: 'rgba(211, 47, 47, 0.08)',
                                            '&:hover': {
                                                bgcolor: 'rgba(211, 47, 47, 0.15)',
                                            },
                                        }}
                                    >
                                        <DeleteSweepIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Active year indicator */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2 }}>
                            {isActiveYear ? (
                                <strong>Năm học đang hoạt động </strong>
                            ) : (
                                <strong>Năm học đã kết thúc - chỉ xem dữ liệu</strong>
                            )}
                        </Alert>
                    )}

                    {/* No data alerts */}
                    {academicYears.length === 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Chưa có năm học nào. Vui lòng tạo năm học trước!
                        </Alert>
                    )}

                    {/* Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : currentWeekData ? (
                        <TableContainer
                            component={Paper}
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                maxHeight: 600,
                                overflow: 'auto',
                                mb: 2,
                            }}
                        >
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#ede7f6',
                                                minWidth: 150,
                                                borderRight: '2px solid #d1c4e9',
                                            }}
                                        >
                                            Tên bữa ăn
                                        </TableCell>
                                        {WEEKDAYS.map((day, index) => {
                                            const date = dayjs(currentWeekData.startDate).add(index, 'day');
                                            const holiday = isHoliday(date);
                                            const menuApply = getMenuApply(day);
                                            const isLastColumn = index === WEEKDAYS.length - 1;

                                            return (
                                                <TableCell
                                                    key={day}
                                                    align="center"
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: '#e3f2fd',
                                                        borderRight: isLastColumn ? 'none' : '1px solid #c5bebeff',
                                                        minWidth: 200,
                                                        px: 1,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {day} ({date.format('DD/MM')})
                                                        </Typography>

                                                        {/* Action buttons */}
                                                        {!holiday && isActiveYear && (
                                                            <Box sx={{ display: 'flex', gap: 1, mt: 0 }}>
                                                                {!menuApply && canCreate && (
                                                                    <Tooltip title="Thêm thực đơn">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="success"
                                                                            onClick={() =>
                                                                                handleAddMenuApply(day, index)
                                                                            }
                                                                            sx={{
                                                                                bgcolor: 'rgba(46, 125, 50, 0.08)',
                                                                            }}
                                                                        >
                                                                            <AddCircleOutlineIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {menuApply && canUpdate && (
                                                                    <Tooltip title="Sửa thực đơn">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="primary"
                                                                            onClick={() =>
                                                                                handleAddMenuApply(day, index)
                                                                            }
                                                                            sx={{
                                                                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                                                            }}
                                                                        >
                                                                            <EditOutlinedIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {menuApply && canDelete && (
                                                                    <Tooltip title="Xóa thực đơn">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => handleDelete(day)}
                                                                            sx={{
                                                                                bgcolor: 'rgba(211, 47, 47, 0.08)',
                                                                            }}
                                                                        >
                                                                            <DeleteOutlineOutlinedIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {MEAL_SESSIONS.map((session) => (
                                        <TableRow key={session}>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 600,
                                                    bgcolor: '#f5f5f5',
                                                    borderRight: '2px solid #d1c4e9',
                                                }}
                                            >
                                                {session}
                                            </TableCell>
                                            {WEEKDAYS.map((day, dayIndex) => {
                                                const date = dayjs(currentWeekData.startDate).add(dayIndex, 'day');
                                                const holiday = isHoliday(date);
                                                const meals = getMealData(day, session);
                                                const isLastColumn = dayIndex === WEEKDAYS.length - 1;

                                                return (
                                                    <TableCell
                                                        key={day}
                                                        align="center"
                                                        sx={{
                                                            bgcolor: holiday ? '#ffebee' : '#fafafa',
                                                            borderRight: isLastColumn ? 'none' : '1px solid #c5bebeff',
                                                            minHeight: 80,
                                                            p: 1,
                                                        }}
                                                    >
                                                        {holiday ? (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    height: '100%',
                                                                }}
                                                            >
                                                                <Chip label="Ngày nghỉ" color="error" size="small" />
                                                            </Box>
                                                        ) : meals && meals.length > 0 ? (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 0.5,
                                                                    alignItems: 'flex-start',
                                                                }}
                                                            >
                                                                {meals.map((meal, idx) => (
                                                                    <Typography
                                                                        key={idx}
                                                                        variant="body1"
                                                                        sx={{
                                                                            fontSize: '1rem',
                                                                            textAlign: 'left',
                                                                            width: '100%',
                                                                        }}
                                                                    >
                                                                        {idx + 1}. {meal.name}
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ fontStyle: 'italic' }}
                                                            >
                                                                Chưa có thực đơn
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info">
                            {academicYears.length === 0
                                ? 'Vui lòng tạo năm học trước'
                                : ageGroups.length === 0
                                  ? 'Vui lòng đồng bộ định mức dinh dưỡng trước'
                                  : weeks.length === 0
                                    ? 'Vui lòng tạo thời khóa biểu trước'
                                    : 'Vui lòng chọn năm học, nhóm trẻ và tuần để xem thực đơn áp dụng'}
                        </Alert>
                    )}
                    <Box sx={{ mt: 2 }}>
                        <Alert
                            severity="warning"
                            icon={<WarningAmberOutlinedIcon />}
                            sx={{
                                borderRadius: 1.5,
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="body2">
                                <strong>Lưu ý:</strong> Chỉ được thêm các thực đơn <strong>đạt chuẩn về Lượng</strong>{' '}
                                và <strong>đạt chuẩn về Chất</strong>.
                            </Typography>
                        </Alert>
                    </Box>
                </Paper>
            </PageContainer>

            {/* Dialog */}
            <MenuApplyDialog
                open={openDialog}
                mode={dialogMode}
                data={dialogData}
                onClose={handleDialogClose}
                onSuccess={handleDialogSuccess}
            />

            {/* ✅ NEW: Copy Dialog */}
            <MenuApplyCopyDialog
                open={openCopyDialog}
                copyInfo={copyInfo}
                onClose={() => setOpenCopyDialog(false)}
                onConfirm={handleConfirmCopy}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog {...dialogState} onCancel={handleCancel} />
        </MainLayout>
    );
}

export default MenuApply;
