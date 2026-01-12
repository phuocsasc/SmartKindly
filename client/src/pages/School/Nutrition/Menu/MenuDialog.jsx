import { useState, useEffect, useMemo, useRef } from 'react';
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
    Avatar,
    Tabs,
    Tab,
    Divider,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Grid,
    Popover, // Thêm Popover
    List, // Thêm List
    ListItem, // Thêm ListItem
    ListItemText, // Thêm ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add'; // Thêm icon Add
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Alert, AlertTitle } from '@mui/material';
import { schoolMenuApi, schoolNutritionalStandardApi, schoolMealApi } from '~/apis';
import { toast } from 'react-toastify';

const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];
const ENERGY_FACTORS = { PROTEIN: 4, LIPID: 9, GLUCID: 4 };

function MenuDialog({ open, mode, menuId, onClose, onSuccess }) {
    // State điều khiển UI & loading
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form state – dữ liệu người dùng nhập
    const [formData, setFormData] = useState({
        menuName: '',
        numberOfChildren: 1,
        nutritionalStandardId: '',
        meals: MEAL_SESSIONS.reduce((acc, session) => ({ ...acc, [session]: [] }), {}),
    });

    // Reference data - Dữ liệu tham chiếu
    const [standardOptions, setStandardOptions] = useState([]);
    const [mealOptions, setMealOptions] = useState([]);
    const [loadingMeals, setLoadingMeals] = useState(false);
    const [searchMealText, setSearchMealText] = useState('');

    // ✅ State cho Popover thêm món ăn
    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
    const [currentSession, setCurrentSession] = useState(null);

    // Calculated nutrition data State kết quả tính toán dinh dưỡng
    const [nutritionData, setNutritionData] = useState({
        aggregatedFoodTable: [],
        analysis: {},
        standard: null,
    });

    // ✅ Thêm các ref để kiểm soát việc tính toán lại
    const isInitialLoadRef = useRef(false);
    const shouldRecomputeRef = useRef(false);

    const isCreateMode = mode === 'create';

    // --- Lấy danh sách chuẩn dinh dưỡng
    const fetchDependencies = async () => {
        try {
            const standardsRes = await schoolNutritionalStandardApi.getAll({ limit: 100 });
            setStandardOptions(standardsRes.data.data.standards || []);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách định mức dinh dưỡng!');
        }
    };

    const searchMeals = async (search) => {
        try {
            setLoadingMeals(true);
            const res = await schoolMealApi.getAll({ search, limit: 10 });
            setMealOptions(res.data.data.meals || []);
        } catch (error) {
            console.error('Error searching meals:', error);
        } finally {
            setLoadingMeals(false);
        }
    };

    // Load dữ liệu khi mở Dialog
    useEffect(() => {
        if (open) {
            fetchDependencies();
            setFormData({
                menuName: '',
                numberOfChildren: 1,
                nutritionalStandardId: '',
                meals: MEAL_SESSIONS.reduce((acc, session) => ({ ...acc, [session]: [] }), {}),
            });
            setActiveTab(0);
            isInitialLoadRef.current = false;
            shouldRecomputeRef.current = false;
        }
    }, [open]);

    // Lấy chi tiết thực đơn khi ở chế độ chỉnh sửa
    useEffect(() => {
        if (open && mode === 'edit' && menuId) {
            const fetchDetails = async () => {
                try {
                    setLoadingDetails(true);
                    const res = await schoolMenuApi.getDetails(menuId);
                    const menu = res.data.data;
                    setFormData({
                        menuName: menu.menuName,
                        numberOfChildren: menu.numberOfChildren,
                        nutritionalStandardId: menu.nutritionalStandardId._id,
                        meals: menu.meals,
                    });
                    setNutritionData({
                        aggregatedFoodTable: menu.aggregatedFoodTable,
                        analysis: menu.analysis,
                        standard: menu.nutritionalStandardId,
                    });

                    // ✅ Đánh dấu đã load xong dữ liệu ban đầu
                    isInitialLoadRef.current = true;
                } catch (error) {
                    toast.error('Lỗi khi tải chi tiết thực đơn!');
                    onClose();
                } finally {
                    setLoadingDetails(false);
                }
            };
            fetchDetails();
        }
    }, [open, mode, menuId, onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const keyword = searchMealText.trim();

            if (keyword.length >= 1) {
                // 🔍 Có keyword → search
                searchMeals(keyword);
            } else {
                // ✅ Không keyword → load danh sách mặc định
                searchMeals('');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchMealText]);

    // --- Real-time Nutrition Calculation ---
    const selectedStandard = useMemo(() => {
        return standardOptions.find((s) => s._id === formData.nutritionalStandardId);
    }, [formData.nutritionalStandardId, standardOptions]);

    const recomputeNutrition = (currentMeals, currentNumberOfChildren, currentStandard, editedFoodTable = null) => {
        if (!currentStandard || currentNumberOfChildren <= 0) {
            setNutritionData({ aggregatedFoodTable: [], analysis: {}, standard: null });
            return;
        }

        let finalAggregatedTable;

        if (editedFoodTable) {
            // Nếu một mục thực phẩm được chỉnh sửa, sử dụng nó làm nguồn dữ liệu chính
            finalAggregatedTable = editedFoodTable;
        } else {
            // Ngược lại, tính toán từ đầu dựa trên các món ăn đã chọn
            const foodMap = new Map();
            Object.values(currentMeals)
                .flat()
                .forEach((meal) => {
                    meal.ingredients.forEach((ing) => {
                        const key = ing.foodId.toString();
                        if (foodMap.has(key)) {
                            foodMap.get(key).quantityPerChildGram += ing.quantityPerChildGram;
                        } else {
                            foodMap.set(key, { ...ing, quantityPerChildGram: ing.quantityPerChildGram });
                        }
                    });
                });

            finalAggregatedTable = Array.from(foodMap.values()).map((item) => {
                // 🔥 Làm tròn quantityPerChildGram về 2 số thập phân TRƯỚC
                const quantityPerChildGram = parseFloat(item.quantityPerChildGram.toFixed(2));

                // Tính các giá trị phái sinh (KHÔNG làm tròn trung gian)
                const totalQuantityKgRaw = (quantityPerChildGram * currentNumberOfChildren) / 1000;
                const purchaseQuantityKgRaw = totalQuantityKgRaw * (1 + item.wastePercentage / 100);

                const unit = (item.unit || '').trim().toLowerCase();
                let purchaseQuantityByUnit;
                if (unit === 'kg') {
                    purchaseQuantityByUnit = purchaseQuantityKgRaw;
                } else if (item.gramConversion > 0) {
                    purchaseQuantityByUnit = (purchaseQuantityKgRaw / item.gramConversion) * 1000;
                } else {
                    purchaseQuantityByUnit = purchaseQuantityKgRaw;
                }

                return {
                    ...item,
                    quantityPerChildGram, // ✅ Đã làm tròn 2 số
                    totalQuantityKg: parseFloat(totalQuantityKgRaw.toFixed(3)), // ✅ Làm tròn 3 số cho display
                    purchaseQuantityKg: parseFloat(purchaseQuantityKgRaw.toFixed(3)), // ✅ Làm tròn 3 số cho display
                    purchaseQuantityByUnit: parseFloat(purchaseQuantityByUnit.toFixed(1)), // ✅ Làm tròn 1 số thập phân
                };
            });
        }

        // Perform nutritional analysis
        const totals = { protein: 0, lipid: 0, glucid: 0 };
        finalAggregatedTable.forEach((item) => {
            // 🔥 Tính từ quantityPerChildGram (đã làm tròn 2 số)
            totals.protein += item.quantityPerChildGram * (item.protein || 0);
            totals.lipid += item.quantityPerChildGram * (item.lipid || 0);
            totals.glucid += item.quantityPerChildGram * (item.glucid || 0);
        });

        // 🔥 Làm tròn 2 số thập phân SAU KHI TỔNG HỢP
        const totalProtein = parseFloat(totals.protein.toFixed(2));
        const totalLipid = parseFloat(totals.lipid.toFixed(2));
        const totalGlucid = parseFloat(totals.glucid.toFixed(2));
        const totalCalories = parseFloat(
            (
                totalProtein * ENERGY_FACTORS.PROTEIN +
                totalLipid * ENERGY_FACTORS.LIPID +
                totalGlucid * ENERGY_FACTORS.GLUCID
            ).toFixed(2),
        );

        const evaluate = (val, min, max) => (val < min ? 'Chưa đạt' : val > max ? 'Vượt quá định mức' : 'Đạt');

        const analysisResult = {
            totalProtein,
            totalLipid,
            totalGlucid,
            totalCalories,
            caloriesEvaluation: evaluate(
                totalCalories,
                currentStandard.recommendedCaloriesMin,
                currentStandard.recommendedCaloriesMax,
            ),
            proteinPercentage:
                totalCalories > 0
                    ? parseFloat((((totalProtein * ENERGY_FACTORS.PROTEIN) / totalCalories) * 100).toFixed(2))
                    : 0,
            lipidPercentage:
                totalCalories > 0
                    ? parseFloat((((totalLipid * ENERGY_FACTORS.LIPID) / totalCalories) * 100).toFixed(2))
                    : 0,
            glucidPercentage:
                totalCalories > 0
                    ? parseFloat((((totalGlucid * ENERGY_FACTORS.GLUCID) / totalCalories) * 100).toFixed(2))
                    : 0,
            plgEvaluation: {
                protein: evaluate(
                    ((totalProtein * ENERGY_FACTORS.PROTEIN) / totalCalories) * 100,
                    currentStandard.plgStructure.proteinMin,
                    currentStandard.plgStructure.proteinMax,
                ),
                lipid: evaluate(
                    ((totalLipid * ENERGY_FACTORS.LIPID) / totalCalories) * 100,
                    currentStandard.plgStructure.lipidMin,
                    currentStandard.plgStructure.lipidMax,
                ),
                glucid: evaluate(
                    ((totalGlucid * ENERGY_FACTORS.GLUCID) / totalCalories) * 100,
                    currentStandard.plgStructure.glucidMin,
                    currentStandard.plgStructure.glucidMax,
                ),
            },
        };

        setNutritionData({
            aggregatedFoodTable: finalAggregatedTable,
            analysis: analysisResult,
            standard: currentStandard,
        });
    };

    // ✅ Effect này chỉ chạy khi CẦN THIẾT - tính toán có kiểm soát
    useEffect(() => {
        // Không chạy khi đang load dữ liệu ban đầu trong edit mode
        if (mode === 'edit' && !isInitialLoadRef.current) {
            return;
        }

        // Chỉ chạy khi được đánh dấu cần tính toán lại
        if (mode === 'edit' && !shouldRecomputeRef.current) {
            return;
        }

        const standardForCalc = selectedStandard || nutritionData.standard;

        if (!standardForCalc) return;

        // Trong create mode, luôn tính toán lại
        if (mode === 'create' || shouldRecomputeRef.current) {
            recomputeNutrition(formData.meals, formData.numberOfChildren, standardForCalc);
            shouldRecomputeRef.current = false; // Reset flag
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.meals, formData.numberOfChildren, selectedStandard, mode, nutritionData.standard]);

    // --- Handlers ---
    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // ✅ Chỉ đánh dấu cần tính toán lại khi thay đổi các trường ảnh hưởng
        if (field === 'numberOfChildren' || field === 'nutritionalStandardId') {
            shouldRecomputeRef.current = true;
        }
        // menuName không trigger tính toán lại
    };

    const handleAddMealItem = (session, meal) => {
        if (formData.meals[session].some((m) => m.mealId === meal._id)) {
            toast.warning(`Món "${meal.name}" đã có trong ${session}.`);
            return;
        }
        const newMealItem = { mealId: meal._id, name: meal.name, ingredients: meal.ingredients };
        const updatedMeals = { ...formData.meals, [session]: [...formData.meals[session], newMealItem] };
        setFormData((prev) => ({ ...prev, meals: updatedMeals }));
        shouldRecomputeRef.current = true; // ✅ Đánh dấu cần tính toán lại
        handleClosePopover();
    };

    const handleRemoveMealItem = (session, index) => {
        const updatedSessionMeals = [...formData.meals[session]];
        updatedSessionMeals.splice(index, 1);
        const updatedMeals = { ...formData.meals, [session]: updatedSessionMeals };
        setFormData((prev) => ({ ...prev, meals: updatedMeals }));
        shouldRecomputeRef.current = true; // ✅ Đánh dấu cần tính toán lại
    };

    // ✅ Handlers cho Popover
    const handleOpenPopover = (event, session) => {
        setPopoverAnchorEl(event.currentTarget);
        setCurrentSession(session);
        // Reset search khi mở popover
        setSearchMealText('');
        // Tải danh sách món ăn ban đầu
        searchMeals('');
    };

    const handleClosePopover = () => {
        setPopoverAnchorEl(null);
        setCurrentSession(null);
    };

    const isPopoverOpen = Boolean(popoverAnchorEl);
    const popoverId = isPopoverOpen ? 'add-meal-popover' : undefined;

    const handleChangePurchaseByUnit = (index, newValue) => {
        const updatedTable = [...nutritionData.aggregatedFoodTable];
        const item = updatedTable[index];
        const newPurchaseQuantityByUnit = parseFloat(newValue) || 0;

        // Recalculate other fields based on the user's edit
        let purchaseQuantityKg;
        if (item.unit.toLowerCase() === 'kg') {
            purchaseQuantityKg = newPurchaseQuantityByUnit;
        } else {
            purchaseQuantityKg = (newPurchaseQuantityByUnit * item.gramConversion) / 1000;
        }
        const totalQuantityKg = purchaseQuantityKg / (1 + item.wastePercentage / 100);
        const quantityPerChildGram = (totalQuantityKg * 1000) / formData.numberOfChildren;

        updatedTable[index] = {
            ...item,
            purchaseQuantityByUnit: newPurchaseQuantityByUnit,
            purchaseQuantityKg: parseFloat(purchaseQuantityKg.toFixed(1)),
            totalQuantityKg: parseFloat(totalQuantityKg.toFixed(1)),
            quantityPerChildGram: parseFloat(quantityPerChildGram.toFixed(2)),
        };

        // ✅ Lấy chuẩn dinh dưỡng: ưu tiên selectedStandard, nếu chưa có thì dùng chuẩn đang lưu trong nutritionData.standard
        const standardForCalc = selectedStandard || nutritionData.standard;

        // ✅ Tính toán lại với bảng đã chỉnh sửa, KHÔNG trigger useEffect
        recomputeNutrition(formData.meals, formData.numberOfChildren, standardForCalc, updatedTable);
    };

    const handleSubmit = async () => {
        if (!formData.menuName.trim()) return toast.error('Vui lòng nhập tên thực đơn!');
        if (!formData.nutritionalStandardId) return toast.error('Vui lòng chọn nhóm trẻ!');
        if (formData.numberOfChildren <= 0) return toast.error('Số lượng trẻ phải lớn hơn 0!');

        // ✅ Kiểm tra phải có ít nhất 1 món ăn
        const totalMeals = Object.values(formData.meals).reduce((sum, meals) => sum + meals.length, 0);
        if (totalMeals === 0) {
            return toast.error('Phải có ít nhất 1 món ăn trong thực đơn!');
        }

        // ✅ Kiểm tra Lượng mua theo ĐVT phải > 0
        const invalidFoodItem = nutritionData.aggregatedFoodTable.find(
            (item) => !item.purchaseQuantityByUnit || item.purchaseQuantityByUnit <= 0,
        );
        if (invalidFoodItem) {
            toast.error(`Lượng mua theo ĐVT của "${invalidFoodItem.foodName}" phải lớn hơn 0!`);
            setActiveTab(1); // Chuyển sang tab 2 để người dùng sửa
            return;
        }

        try {
            setLoading(true);
            const payload = {
                menuName: formData.menuName.trim(),
                numberOfChildren: formData.numberOfChildren,
                nutritionalStandardId: formData.nutritionalStandardId,
                meals: Object.keys(formData.meals).reduce((acc, session) => {
                    acc[session] = formData.meals[session].map((m) => m.mealId);
                    return acc;
                }, {}),
                // Send the final calculated table to backend
                aggregatedFoodTable: nutritionData.aggregatedFoodTable.map((item) => ({
                    foodId: item.foodId,
                    foodName: item.foodName,
                    unit: item.unit,
                    gramConversion: item.gramConversion,
                    wastePercentage: item.wastePercentage,
                    isMainFood: item.isMainFood,
                    protein: item.protein,
                    lipid: item.lipid,
                    glucid: item.glucid,
                    purchaseQuantityByUnit: item.purchaseQuantityByUnit,
                })),
            };

            if (isCreateMode) {
                await schoolMenuApi.create(payload);
                toast.success('Tạo thực đơn thành công!');
            } else {
                await schoolMenuApi.update(menuId, payload);
                toast.success('Cập nhật thực đơn thành công!');
            }
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'Đạt':
                return <Chip label="Đạt" color="success" size="small" variant="outlined" />;
            case 'Chưa đạt':
                return <Chip label="Chưa đạt" color="warning" size="small" variant="outlined" />;
            case 'Vượt quá định mức':
                return <Chip label="Vượt quá" color="error" size="small" variant="outlined" />;
            default:
                return <Chip label="N/A" size="small" />;
        }
    };

    const HeaderWithTooltip = ({ label, tooltip }) => (
        <Tooltip title={tooltip} arrow placement="top">
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'help',
                }}
            >
                <Typography fontWeight={600}>{label}</Typography>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Box>
        </Tooltip>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
                    color: '#fff',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                        {isCreateMode ? <AddCircleOutlineIcon /> : <EditIcon />}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {isCreateMode ? 'Thêm thực đơn mới' : 'Chỉnh sửa thực đơn'}
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                >
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            fontWeight: 500,
                            color: 'text.secondary',
                        },
                        '& .Mui-selected': {
                            fontWeight: 700,
                            color: 'primary.main',
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                            borderRadius: 1,
                        },
                    }}
                >
                    <Tab label="THÔNG TIN THỰC ĐƠN" />
                    <Tab label="CÂN ĐỐI DINH DƯỠNG" />
                </Tabs>
            </Box>

            <DialogContent sx={{ minHeight: '70vh', bgcolor: '#f5f5f5' }}>
                {loadingDetails ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* TAB 1 */}
                        {activeTab === 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
                                {/* <Typography variant="h6" fontWeight={600} sx={{ mt: -2 }}>
                                    Thông tin thực đơn
                                </Typography> */}
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl required fullWidth size="small">
                                            <InputLabel>Nhóm trẻ</InputLabel>
                                            <Select
                                                value={formData.nutritionalStandardId}
                                                onChange={(e) =>
                                                    handleFormChange('nutritionalStandardId', e.target.value)
                                                }
                                                label="Nhóm trẻ"
                                            >
                                                {standardOptions.map((opt) => (
                                                    <MenuItem key={opt._id} value={opt._id}>
                                                        {opt.ageGroup}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            type="number"
                                            label="Số lượng trẻ"
                                            required
                                            fullWidth
                                            size="small"
                                            value={formData.numberOfChildren}
                                            onChange={(e) =>
                                                handleFormChange('numberOfChildren', parseInt(e.target.value, 10) || 0)
                                            }
                                            inputProps={{ min: 1 }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Tên thực đơn"
                                            required
                                            fullWidth
                                            size="small"
                                            value={formData.menuName}
                                            onChange={(e) => handleFormChange('menuName', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                                <Alert
                                    severity="info"
                                    icon={<InfoOutlinedIcon />}
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: '#e3f2fd',
                                        border: '1px solid #bbdefb',
                                        mb: 1,
                                    }}
                                >
                                    <AlertTitle sx={{ fontWeight: 600 }}>Hướng dẫn tạo thực đơn</AlertTitle>

                                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                                        <li>
                                            Chọn <strong>Nhóm trẻ</strong>, Nhập <strong>Số lượng trẻ</strong> sử dụng
                                            thực đơn, và Nhập <strong>Tên thực đơn</strong>.
                                        </li>
                                        <li>
                                            Thêm các <strong>Món ăn</strong> cho từng bữa (Sáng / Trưa / Xế / Phụ).
                                        </li>
                                        <li>
                                            Chuyển sang tab <strong>“Cân đối dinh dưỡng”</strong> điều chỉnh Lượng mua
                                            trẻ theo ĐVT để cân bằng Lượng &amp; Chất.
                                        </li>
                                    </Box>
                                </Alert>

                                <Typography variant="h6" fontWeight={600} sx={{ mt: -2 }}>
                                    Các bữa ăn trong ngày
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                                            <TableRow>
                                                <TableCell
                                                    sx={{
                                                        width: '20%',
                                                        borderRight: '1px solid #ddd',
                                                        fontSize: '1rem',
                                                    }}
                                                >
                                                    <strong>Tên bữa ăn</strong>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '1rem' }}>
                                                    <strong>Tên món ăn đã chọn</strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {MEAL_SESSIONS.map((session) => (
                                                <TableRow key={session}>
                                                    <TableCell sx={{ borderRight: '1px solid #ddd' }}>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                {session}
                                                            </Typography>
                                                            <Tooltip title={`Thêm món cho ${session}`}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleOpenPopover(e, session)}
                                                                    sx={{
                                                                        bgcolor: 'primary.lighter',
                                                                        color: 'primary.main',
                                                                    }}
                                                                >
                                                                    <AddIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap', // Cho phép các chip xuống dòng
                                                                gap: 1,
                                                            }}
                                                        >
                                                            {formData.meals[session].length > 0 ? (
                                                                formData.meals[session].map((item, index) => (
                                                                    <Chip
                                                                        key={item.mealId}
                                                                        label={item.name}
                                                                        onDelete={() =>
                                                                            handleRemoveMealItem(session, index)
                                                                        }
                                                                        color="success"
                                                                        variant="outlined"
                                                                        sx={{ fontSize: '1rem' }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{ fontStyle: 'italic' }}
                                                                >
                                                                    Chưa có món ăn
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* TAB 2 */}
                        {activeTab === 1 && (
                            <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TableContainer
                                    component={Paper}
                                    variant="outlined"
                                    sx={{
                                        maxHeight: 400, // ✅ chiều cao cố định
                                        overflowY: 'auto',
                                        borderRadius: 2,
                                        // ===== Custom Scrollbar =====
                                        '&::-webkit-scrollbar': {
                                            width: '6px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            backgroundColor: '#e3f2fd',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#0964a1a4',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                            backgroundColor: '#0071BC',
                                        },

                                        // ===== Style input trong bảng =====
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
                                    <Table
                                        size="small"
                                        stickyHeader
                                        sx={{
                                            '& th, & td': {
                                                borderRight: '1px solid #c5bebeff',
                                            },
                                            '& th:last-child, & td:last-child': {
                                                borderRight: 'none',
                                            },
                                        }}
                                    >
                                        <TableHead
                                            sx={{
                                                bgcolor: '#e3f2fd',
                                                '& th': {
                                                    fontWeight: 600,
                                                    textAlign: 'center',
                                                    whiteSpace: 'nowrap',
                                                },
                                            }}
                                        >
                                            <TableRow>
                                                {[
                                                    'STT',
                                                    'Tên thực phẩm',
                                                    'Lượng ăn 1 trẻ (g)',
                                                    `Lượng ăn ${formData.numberOfChildren} trẻ (kg)`,
                                                    'Hệ số thái bỏ',
                                                    `Lượng mua ${formData.numberOfChildren} trẻ (kg)`,
                                                    `Lượng mua ${formData.numberOfChildren} trẻ theo ĐVT`,
                                                    'ĐVT',
                                                    'Quy đổi (g)',
                                                ].map((label) => (
                                                    <TableCell
                                                        key={label}
                                                        sx={{
                                                            fontWeight: 600,
                                                            bgcolor: '#e3f2fd',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {label}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {nutritionData.aggregatedFoodTable.map((item, index) => (
                                                <TableRow
                                                    key={item.foodId}
                                                    sx={{
                                                        bgcolor: item.isMainFood ? '#fff3e0' : 'inherit', // ✅ highlight
                                                        '&:hover': {
                                                            bgcolor: item.isMainFood ? '#ffe0b2' : '#f5f5f5',
                                                        },
                                                    }}
                                                >
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell
                                                        sx={{
                                                            borderRight: '1px solid #361818ff',
                                                            fontWeight: item.isMainFood ? 600 : 400,
                                                        }}
                                                    >
                                                        {item.foodName}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {item.quantityPerChildGram.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {item.totalQuantityKg.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell align="center">{item.wastePercentage}%</TableCell>
                                                    <TableCell align="center">
                                                        {item.purchaseQuantityKg.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            sx={{ width: 200 }}
                                                            value={item.purchaseQuantityByUnit}
                                                            onChange={(e) =>
                                                                handleChangePurchaseByUnit(index, e.target.value)
                                                            }
                                                            inputProps={{ min: 0, step: 0.1 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">{item.unit}</TableCell>
                                                    <TableCell align="center">{item.gramConversion}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Typography variant="h6" fontWeight={600}>
                                    Thống kê thành phần dinh dưỡng cho 1 trẻ
                                </Typography>
                                <Grid container spacing={1} sx={{ mt: 0 }}>
                                    <Grid item xs={12} md={7}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                height: '100%',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Header */}
                                            <Box
                                                sx={{
                                                    px: 2,
                                                    py: 1,
                                                    bgcolor: '#e3f2fd',
                                                    borderBottom: '1px solid #ddd',
                                                }}
                                            >
                                                <Typography fontWeight={600}>Đánh giá về Lượng</Typography>
                                            </Box>

                                            <Table
                                                size="small"
                                                sx={{
                                                    '& th, & td': {
                                                        borderRight: '1px solid #e0e0e0',
                                                    },
                                                    '& th:last-child, & td:last-child': {
                                                        borderRight: 'none',
                                                    },
                                                }}
                                            >
                                                {/* ===== TABLE HEAD ===== */}
                                                <TableHead
                                                    sx={{
                                                        bgcolor: '#e3f2fd',
                                                        '& th': {
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                        },
                                                    }}
                                                >
                                                    <TableRow sx={{ bgcolor: '#f5faff' }}>
                                                        <TableCell sx={{ borderRight: '1px solid #ddd' }}>
                                                            <Typography fontWeight={600}>Nội dung</Typography>
                                                        </TableCell>
                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #ddd' }}
                                                        >
                                                            <HeaderWithTooltip
                                                                label="Protein (Đạm)"
                                                                tooltip="Tổng lượng Protein (Đạm) của tất cả thực phẩm trong thực đơn này"
                                                            />
                                                        </TableCell>
                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #ddd' }}
                                                        >
                                                            <HeaderWithTooltip
                                                                label="Lipid (Béo)"
                                                                tooltip="Tổng lượng Lipid (Béo) của tất cả thực phẩm trong thực đơn này"
                                                            />
                                                        </TableCell>
                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #ddd' }}
                                                        >
                                                            <HeaderWithTooltip
                                                                label="Glucid (Đường)"
                                                                tooltip="Tổng lượng Glucid (Đường) của tất cả thực phẩm trong thực đơn này"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <HeaderWithTooltip
                                                                label="Tổng Calo"
                                                                tooltip="Công thức tính Calo: Protein × 4 + Lipid × 9 + Glucid × 4"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>

                                                {/* ===== TABLE BODY ===== */}
                                                <TableBody>
                                                    {/* ===== Tổng Calo (thực tế) ===== */}
                                                    <TableRow>
                                                        <TableCell
                                                            sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}
                                                        >
                                                            Tổng lượng (thực tế)
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            {nutritionData.analysis.totalProtein || 0} g
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            {nutritionData.analysis.totalLipid || 0} g
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            {nutritionData.analysis.totalGlucid || 0} g
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{
                                                                bgcolor:
                                                                    nutritionData.analysis.caloriesEvaluation ===
                                                                    'Vượt quá định mức'
                                                                        ? '#ffebee'
                                                                        : nutritionData.analysis.caloriesEvaluation ===
                                                                            'Chưa đạt'
                                                                          ? '#fff0e1ff'
                                                                          : '#c5f0d5ff',
                                                            }}
                                                        >
                                                            <Typography
                                                                component="span"
                                                                fontWeight={700}
                                                                // color="error.main"
                                                                sx={{ mr: 1 }}
                                                            >
                                                                {nutritionData.analysis.totalCalories || 0} kcal
                                                            </Typography>
                                                            {getStatusChip(nutritionData.analysis.caloriesEvaluation)}
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* ===== Năng lượng khuyến nghị ===== */}
                                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                        <TableCell
                                                            sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}
                                                        >
                                                            Năng lượng khuyến nghị
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            —
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            —
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            —
                                                        </TableCell>

                                                        <TableCell align="center" fontWeight={600}>
                                                            {nutritionData.standard?.recommendedCaloriesMin} –{' '}
                                                            {nutritionData.standard?.recommendedCaloriesMax} kcal
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={5}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                height: '100%',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Header */}
                                            <Box
                                                sx={{
                                                    px: 2,
                                                    py: 1,
                                                    bgcolor: '#e3f2fd',
                                                    borderBottom: '1px solid #ddd',
                                                }}
                                            >
                                                <Typography fontWeight={600}>Đánh giá về Chất (PLG %)</Typography>
                                            </Box>

                                            <Table
                                                size="small"
                                                sx={{
                                                    '& th, & td': {
                                                        borderRight: '1px solid #e0e0e0',
                                                    },
                                                    '& th:last-child, & td:last-child': {
                                                        borderRight: 'none',
                                                    },
                                                }}
                                            >
                                                {/* ===== TABLE HEAD ===== */}
                                                <TableHead
                                                    sx={{
                                                        bgcolor: '#e3f2fd',
                                                        '& th': {
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                        },
                                                    }}
                                                >
                                                    <TableRow sx={{ bgcolor: '#f5faff' }}>
                                                        <TableCell
                                                            sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}
                                                        >
                                                            <Typography fontWeight={600}>Nội dung</Typography>
                                                        </TableCell>
                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #ddd' }}
                                                        >
                                                            <HeaderWithTooltip
                                                                label="Protein (Đạm)"
                                                                tooltip="Công thức tính tỷ lệ P %: (Tổng lượng Protein (Đạm) × 4) / Tổng Calo"
                                                            />
                                                        </TableCell>
                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #ddd' }}
                                                        >
                                                            <HeaderWithTooltip
                                                                label="Lipid (Béo)"
                                                                tooltip="Công thức tính tỷ lệ L %: (Tổng lượng Lipid (Béo) × 9) / Tổng Calo"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <HeaderWithTooltip
                                                                label="Glucid (Đường)"
                                                                tooltip="Công thức tính tỷ lệ G %: (Tổng lượng Glucid (Đường) × 4) / Tổng Calo"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>

                                                {/* ===== TABLE BODY ===== */}
                                                <TableBody>
                                                    {/* ===== Thực tế ===== */}
                                                    <TableRow>
                                                        <TableCell
                                                            sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}
                                                        >
                                                            Thực tế
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            <Typography component="span" fontWeight={600}>
                                                                {nutritionData.analysis.proteinPercentage || 0}%
                                                            </Typography>{' '}
                                                            {getStatusChip(
                                                                nutritionData.analysis.plgEvaluation?.protein,
                                                            )}
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            <Typography component="span" fontWeight={600}>
                                                                {nutritionData.analysis.lipidPercentage || 0}%
                                                            </Typography>{' '}
                                                            {getStatusChip(nutritionData.analysis.plgEvaluation?.lipid)}
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            <Typography component="span" fontWeight={600}>
                                                                {nutritionData.analysis.glucidPercentage || 0}%
                                                            </Typography>{' '}
                                                            {getStatusChip(
                                                                nutritionData.analysis.plgEvaluation?.glucid,
                                                            )}
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* ===== Chuẩn ===== */}
                                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                        <TableCell
                                                            sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}
                                                        >
                                                            Chuẩn
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            {nutritionData.standard?.plgStructure.proteinMin} –{' '}
                                                            {nutritionData.standard?.plgStructure.proteinMax} %
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{ borderRight: '1px solid #eee' }}
                                                        >
                                                            {nutritionData.standard?.plgStructure.lipidMin} –{' '}
                                                            {nutritionData.standard?.plgStructure.lipidMax} %
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            {nutritionData.standard?.plgStructure.glucidMin} –{' '}
                                                            {nutritionData.standard?.plgStructure.glucidMax} %
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            {/* ✅ Popover để thêm món ăn */}
            <Popover
                id={popoverId}
                open={isPopoverOpen}
                anchorEl={popoverAnchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        width: 360,
                        mt: 1,
                        borderRadius: 2,
                        overflow: 'hidden', // QUAN TRỌNG để header bo góc đẹp
                    },
                }}
            >
                {/* ===== HEADER ===== */}
                <Box
                    sx={{
                        px: 2,
                        py: 1.2,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography fontWeight={600} fontSize="0.95rem">
                        Thêm món ăn cho: {currentSession}
                    </Typography>

                    <IconButton
                        size="small"
                        onClick={handleClosePopover}
                        sx={{
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* ===== SEARCH ===== */}
                <Box sx={{ p: 1.2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="🔍 Tìm món ăn..."
                        value={searchMealText}
                        onChange={(e) => setSearchMealText(e.target.value)}
                        autoFocus
                    />
                </Box>
                <Divider />
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {loadingMeals ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : mealOptions.length > 0 ? (
                        mealOptions.map((meal) => (
                            <ListItem
                                button
                                key={meal._id}
                                onClick={() => handleAddMealItem(currentSession, meal)}
                                disabled={formData.meals[currentSession]?.some((m) => m.mealId === meal._id)}
                            >
                                <ListItemText primary={meal.name} secondary={meal.mealType} />
                            </ListItem>
                        ))
                    ) : (
                        <ListItem>
                            <ListItemText primary="Không tìm thấy món ăn" />
                        </ListItem>
                    )}
                </List>
            </Popover>

            <Divider />
            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{ borderRadius: 1.5, px: 2.5, textTransform: 'none', fontWeight: 600 }}
                >
                    Hủy bỏ
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || loadingDetails}
                    size="small"
                    startIcon={loading && <CircularProgress size={20} />}
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
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo thực đơn' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default MenuDialog;
