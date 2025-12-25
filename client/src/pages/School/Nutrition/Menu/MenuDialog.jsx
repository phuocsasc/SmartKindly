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
            const res = await schoolMealApi.getAll({ search, limit: 20 });
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
            if (searchMealText.trim().length >= 1) {
                searchMeals(searchMealText.trim());
            } else {
                setMealOptions([]);
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
                const quantityPerChildGram = parseFloat(item.quantityPerChildGram.toFixed(2));
                const totalQuantityKg = parseFloat(
                    ((quantityPerChildGram * currentNumberOfChildren) / 1000).toFixed(1),
                );
                const purchaseQuantityKg = parseFloat((totalQuantityKg * (1 + item.wastePercentage / 100)).toFixed(1));
                const purchaseQuantityByUnit =
                    item.unit.toLowerCase() === 'kg'
                        ? purchaseQuantityKg
                        : parseFloat(((purchaseQuantityKg / item.gramConversion) * 1000).toFixed(1));
                return { ...item, quantityPerChildGram, totalQuantityKg, purchaseQuantityKg, purchaseQuantityByUnit };
            });
        }

        // Perform nutritional analysis
        const totals = { protein: 0, lipid: 0, glucid: 0 };
        finalAggregatedTable.forEach((item) => {
            totals.protein += item.quantityPerChildGram * (item.protein || 0);
            totals.lipid += item.quantityPerChildGram * (item.lipid || 0);
            totals.glucid += item.quantityPerChildGram * (item.glucid || 0);
        });

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
                    ? parseFloat((((totalProtein * ENERGY_FACTORS.PROTEIN) / totalCalories) * 100).toFixed(1))
                    : 0,
            lipidPercentage:
                totalCalories > 0
                    ? parseFloat((((totalLipid * ENERGY_FACTORS.LIPID) / totalCalories) * 100).toFixed(1))
                    : 0,
            glucidPercentage:
                totalCalories > 0
                    ? parseFloat((((totalGlucid * ENERGY_FACTORS.GLUCID) / totalCalories) * 100).toFixed(1))
                    : 0,
            plgEvaluation: {
                protein: evaluate(
                    totalCalories > 0 ? ((totalProtein * ENERGY_FACTORS.PROTEIN) / totalCalories) * 100 : 0,
                    currentStandard.plgStructure.proteinMin,
                    currentStandard.plgStructure.proteinMax,
                ),
                lipid: evaluate(
                    totalCalories > 0 ? ((totalLipid * ENERGY_FACTORS.LIPID) / totalCalories) * 100 : 0,
                    currentStandard.plgStructure.lipidMin,
                    currentStandard.plgStructure.lipidMax,
                ),
                glucid: evaluate(
                    totalCalories > 0 ? ((totalGlucid * ENERGY_FACTORS.GLUCID) / totalCalories) * 100 : 0,
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
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant="fullWidth">
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ mt: -2 }}>
                                    Thông tin chung
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl required fullWidth size="medium">
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
                                            size="medium"
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
                                            size="medium"
                                            value={formData.menuName}
                                            onChange={(e) => handleFormChange('menuName', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>

                                <Typography variant="h6" fontWeight={600} sx={{ mt: 1 }}>
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
                                                        fontSize: '1.2rem',
                                                    }}
                                                >
                                                    <strong>Tên bữa ăn</strong>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '1.2rem' }}>
                                                    {' '}
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
                                                                        sx={{ fontSize: '1.2rem' }}
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
                            <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    Bảng thông tin các thực phẩm
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                                            <TableRow>
                                                <TableCell>STT</TableCell>
                                                <TableCell>Tên thực phẩm</TableCell>
                                                <TableCell align="right">Lượng ăn 1 trẻ (g)</TableCell>
                                                <TableCell align="right">
                                                    Lượng ăn {formData.numberOfChildren} trẻ (kg)
                                                </TableCell>
                                                <TableCell align="right">Hệ số thái bỏ</TableCell>
                                                <TableCell align="right">
                                                    Lượng mua {formData.numberOfChildren} trẻ (kg)
                                                </TableCell>
                                                <TableCell>
                                                    Lượng mua {formData.numberOfChildren} trẻ theo ĐVT
                                                </TableCell>
                                                <TableCell>ĐVT</TableCell>
                                                <TableCell>Quy đổi (g)</TableCell>
                                                <TableCell>TP Chính</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {nutritionData.aggregatedFoodTable.map((item, index) => (
                                                <TableRow key={item.foodId}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>{item.foodName}</TableCell>
                                                    <TableCell align="right">
                                                        {item.quantityPerChildGram.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {item.totalQuantityKg.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell align="right">{item.wastePercentage}%</TableCell>
                                                    <TableCell align="right">
                                                        {item.purchaseQuantityKg.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            sx={{ width: 100 }}
                                                            value={item.purchaseQuantityByUnit}
                                                            onChange={(e) =>
                                                                handleChangePurchaseByUnit(index, e.target.value)
                                                            }
                                                            inputProps={{ min: 0, step: 0.1 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{item.unit}</TableCell>
                                                    <TableCell>{item.gramConversion}</TableCell>
                                                    <TableCell>
                                                        {item.isMainFood && (
                                                            <Chip label="Chính" size="small" color="warning" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12} md={6}>
                                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                                                Đánh giá về Lượng
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography>Protein (Đạm):</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography align="right">
                                                        <strong>{nutritionData.analysis.totalProtein || 0}g</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>Lipid (Béo):</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography align="right">
                                                        <strong>{nutritionData.analysis.totalLipid || 0}g</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>Glucid (Đường):</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography align="right">
                                                        <strong>{nutritionData.analysis.totalGlucid || 0}g</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Divider sx={{ my: 1 }} />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography fontWeight="bold">Tổng Calo (thực tế):</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography align="right" fontWeight="bold" color="error.main">
                                                        {nutritionData.analysis.totalCalories || 0} kcal
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>Năng lượng khuyến nghị:</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography align="right">
                                                        {nutritionData.standard?.recommendedCaloriesMin} -{' '}
                                                        {nutritionData.standard?.recommendedCaloriesMax} kcal
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>Trạng thái:</Typography>
                                                </Grid>
                                                <Grid item xs={6} align="right">
                                                    {getStatusChip(nutritionData.analysis.caloriesEvaluation)}
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                                                Đánh giá về Chất (PLG %)
                                            </Typography>
                                            <Grid container spacing={1}>
                                                <Grid item xs={4}>
                                                    <Typography align="center" fontWeight="bold">
                                                        Chất
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography align="center" fontWeight="bold">
                                                        Thực tế
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography align="center" fontWeight="bold">
                                                        Chuẩn
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography>Protein (Đạm) (%):</Typography>
                                                </Grid>
                                                <Grid item xs={4} align="center">
                                                    {nutritionData.analysis.proteinPercentage || 0}%{' '}
                                                    {getStatusChip(nutritionData.analysis.plgEvaluation?.protein)}
                                                </Grid>
                                                <Grid item xs={4} align="center">
                                                    {nutritionData.standard?.plgStructure.proteinMin}-
                                                    {nutritionData.standard?.plgStructure.proteinMax}%
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography>Lipid (Béo) (%):</Typography>
                                                </Grid>
                                                <Grid item xs={4} align="center">
                                                    {nutritionData.analysis.lipidPercentage || 0}%{' '}
                                                    {getStatusChip(nutritionData.analysis.plgEvaluation?.lipid)}
                                                </Grid>
                                                <Grid item xs={4} align="center">
                                                    {nutritionData.standard?.plgStructure.lipidMin}-
                                                    {nutritionData.standard?.plgStructure.lipidMax}%
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography>Glucid (Đường) (%):</Typography>
                                                </Grid>
                                                <Grid item xs={4} align="center">
                                                    {nutritionData.analysis.glucidPercentage || 0}%{' '}
                                                    {getStatusChip(nutritionData.analysis.plgEvaluation?.glucid)}
                                                </Grid>
                                                <Grid item xs={4} align="center">
                                                    {nutritionData.standard?.plgStructure.glucidMin}-
                                                    {nutritionData.standard?.plgStructure.glucidMax}%
                                                </Grid>
                                            </Grid>
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
                    sx: { width: 350, mt: 1 },
                }}
            >
                <Box sx={{ p: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="Tìm món ăn..."
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
