// client/src/pages/School/Nutrition/Menu/BalancingMenuAi.jsx

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Avatar,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TextField,
    Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { schoolMenuApi } from '~/apis';
import { toast } from 'react-toastify';

const ENERGY_FACTORS = { PROTEIN: 4, LIPID: 9, GLUCID: 4 };

function BalancingMenuAi({ open, menuData, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);
    const [menuDetails, setMenuDetails] = useState(null);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [editedSuggestions, setEditedSuggestions] = useState(null);

    // ✅ Fetch menu details khi mở dialog
    useEffect(() => {
        if (open && menuData?.id) {
            fetchMenuDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, menuData]);

    // ✅ Fetch chi tiết thực đơn
    const fetchMenuDetails = async () => {
        try {
            setLoading(true);
            const res = await schoolMenuApi.getDetails(menuData.id);
            const details = res.data.data;
            setMenuDetails(details);
            setAiSuggestions(null);
            setEditedSuggestions(null);
        } catch (error) {
            console.error('❌ Error fetching menu details:', error);
            toast.error('Lỗi khi tải chi tiết thực đơn!');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    // ✅ Call OpenAI API để cân đối thực đơn
    const handleAiBalance = async () => {
        if (!menuDetails) return;

        try {
            setLoadingAi(true);

            const payload = {
                aggregatedFoodTable: menuDetails.aggregatedFoodTable,
                nutritionalStandard: menuDetails.nutritionalStandardId,
                numberOfChildren: menuDetails.numberOfChildren,
                menuId: menuDetails._id,
            };

            const res = await schoolMenuApi.balanceWithAi(payload);
            const aiData = res.data.data;

            // 🔥 TÍNH TOÁN LẠI DỮ LIỆU PHÁI SINH (ĐỒNG BỘ VỚI SERVER)
            const recalculatedAiData = aiData.map((item) => {
                const purchaseQty = parseFloat(item.purchaseQuantityByUnit) || 0;
                const unit = (item.unit || '').trim().toLowerCase();
                const gramConversion = Number(item.gramConversion) || 0;
                const wastePercentage = Number(item.wastePercentage) || 0;

                // 1. Tính purchaseKg (KHÔNG làm tròn)
                let purchaseQuantityKg = 0;
                if (unit === 'kg') {
                    purchaseQuantityKg = purchaseQty;
                } else if (unit === 'g' || unit === 'gam') {
                    purchaseQuantityKg = purchaseQty / 1000;
                } else if (gramConversion > 0) {
                    purchaseQuantityKg = (purchaseQty * gramConversion) / 1000;
                } else {
                    purchaseQuantityKg = purchaseQty;
                }

                // 2. Tính totalQuantityKg (KHÔNG làm tròn)
                const totalQuantityKgRaw = purchaseQuantityKg / (1 + wastePercentage / 100);

                // 3. Tính quantityPerChildGram (KHÔNG làm tròn trung gian)
                const quantityPerChildGramRaw = (totalQuantityKgRaw * 1000) / menuDetails.numberOfChildren;

                // 🔥 CHỈ làm tròn 2 số thập phân ở đây
                const quantityPerChildGram = parseFloat(quantityPerChildGramRaw.toFixed(2));

                return {
                    ...item,
                    purchaseQuantityByUnit: parseFloat(purchaseQty.toFixed(1)), // ✅ Làm tròn 1 số
                    purchaseQuantityKg: parseFloat(purchaseQuantityKg.toFixed(3)), // ✅ Làm tròn 3 số cho display
                    totalQuantityKg: parseFloat(totalQuantityKgRaw.toFixed(3)), // ✅ Làm tròn 3 số cho display
                    quantityPerChildGram, // ✅ Đã làm tròn 2 số
                };
            });

            setAiSuggestions(recalculatedAiData);
            setEditedSuggestions(recalculatedAiData);
            toast.success('Đã nhận gợi ý từ A.I!');
        } catch (error) {
            console.error('❌ Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Lỗi khi gọi A.I!');
        } finally {
            setLoadingAi(false);
        }
    };

    // ✅ Handle edit số lượng mua trong bảng gợi ý A.I
    const handleEditAiQuantity = (index, newValue) => {
        if (!editedSuggestions) return;

        const updated = [...editedSuggestions];
        const item = updated[index];
        const purchaseQty = parseFloat(newValue) || 0;
        const unit = (item.unit || '').trim().toLowerCase();
        const gramConversion = Number(item.gramConversion) || 0;
        const wastePercentage = Number(item.wastePercentage) || 0;

        // 1. Tính purchaseKg (KHÔNG làm tròn)
        let purchaseQuantityKg = 0;
        if (unit === 'kg') {
            purchaseQuantityKg = purchaseQty;
        } else if (unit === 'g' || unit === 'gam') {
            purchaseQuantityKg = purchaseQty / 1000;
        } else if (gramConversion > 0) {
            purchaseQuantityKg = (purchaseQty * gramConversion) / 1000;
        } else {
            purchaseQuantityKg = purchaseQty;
        }

        // 2. Tính totalQuantityKg (KHÔNG làm tròn)
        const totalQuantityKgRaw = purchaseQuantityKg / (1 + wastePercentage / 100);

        // 3. Tính quantityPerChildGram (KHÔNG làm tròn trung gian)
        const quantityPerChildGramRaw = (totalQuantityKgRaw * 1000) / menuDetails.numberOfChildren;

        // 🔥 CHỈ làm tròn 2 số thập phân ở đây
        const quantityPerChildGram = parseFloat(quantityPerChildGramRaw.toFixed(2));

        updated[index] = {
            ...item,
            purchaseQuantityByUnit: parseFloat(purchaseQty.toFixed(1)),
            purchaseQuantityKg: parseFloat(purchaseQuantityKg.toFixed(3)),
            totalQuantityKg: parseFloat(totalQuantityKgRaw.toFixed(3)),
            quantityPerChildGram,
        };

        setEditedSuggestions(updated);
    };

    // ✅ Tính toán dinh dưỡng từ bảng (current hoặc AI)
    const calculateNutrition = (foodTable) => {
        if (!foodTable || !menuDetails?.nutritionalStandardId) {
            return null;
        }

        const totals = { protein: 0, lipid: 0, glucid: 0 };
        foodTable.forEach((item) => {
            // 🔥 Tính từ quantityPerChildGram (đã làm tròn 2 số)
            totals.protein += (item.quantityPerChildGram || 0) * (item.protein || 0);
            totals.lipid += (item.quantityPerChildGram || 0) * (item.lipid || 0);
            totals.glucid += (item.quantityPerChildGram || 0) * (item.glucid || 0);
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

        const standard = menuDetails.nutritionalStandardId;

        if (!standard?.plgStructure) {
            return {
                totalProtein,
                totalLipid,
                totalGlucid,
                totalCalories,
                caloriesEvaluation: 'N/A',
                proteinPercentage: 0,
                lipidPercentage: 0,
                glucidPercentage: 0,
                plgEvaluation: { protein: 'N/A', lipid: 'N/A', glucid: 'N/A' },
            };
        }

        const evaluate = (val, min, max) => {
            if (min === undefined || max === undefined) return 'N/A';
            return val < min ? 'Chưa đạt' : val > max ? 'Vượt quá định mức' : 'Đạt';
        };

        const proteinPct = totalCalories > 0 ? ((totalProtein * ENERGY_FACTORS.PROTEIN) / totalCalories) * 100 : 0;
        const lipidPct = totalCalories > 0 ? ((totalLipid * ENERGY_FACTORS.LIPID) / totalCalories) * 100 : 0;
        const glucidPct = totalCalories > 0 ? ((totalGlucid * ENERGY_FACTORS.GLUCID) / totalCalories) * 100 : 0;

        return {
            totalProtein,
            totalLipid,
            totalGlucid,
            totalCalories,
            caloriesEvaluation: evaluate(
                totalCalories,
                standard.recommendedCaloriesMin,
                standard.recommendedCaloriesMax,
            ),
            proteinPercentage: parseFloat(proteinPct.toFixed(2)), // ✅ Làm tròn 2 số
            lipidPercentage: parseFloat(lipidPct.toFixed(2)), // ✅ Làm tròn 2 số
            glucidPercentage: parseFloat(glucidPct.toFixed(2)), // ✅ Làm tròn 2 số
            plgEvaluation: {
                protein: evaluate(proteinPct, standard.plgStructure.proteinMin, standard.plgStructure.proteinMax),
                lipid: evaluate(lipidPct, standard.plgStructure.lipidMin, standard.plgStructure.lipidMax),
                glucid: evaluate(glucidPct, standard.plgStructure.glucidMin, standard.plgStructure.glucidMax),
            },
        };
    };

    // ✅ Tính toán dinh dưỡng cho bảng hiện tại và bảng A.I
    const currentNutrition = useMemo(() => {
        return menuDetails ? calculateNutrition(menuDetails.aggregatedFoodTable) : null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuDetails]);

    const aiNutrition = useMemo(() => {
        return editedSuggestions ? calculateNutrition(editedSuggestions) : null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editedSuggestions]);

    // ✅ Render chip trạng thái
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

    // ✅ Handle apply A.I suggestions
    const handleApply = async () => {
        if (!editedSuggestions) {
            toast.warning('Chưa có dữ liệu từ A.I!');
            return;
        }

        try {
            setLoading(true);

            // ✅ FIX: Extract meal IDs correctly
            const mealsPayload = {};
            Object.keys(menuDetails.meals).forEach((session) => {
                const sessionMeals = menuDetails.meals[session] || [];

                mealsPayload[session] = sessionMeals
                    .map((meal) => {
                        // Trường hợp 1: Meal là string (đã là ID rồi)
                        if (typeof meal === 'string') {
                            return meal;
                        }

                        // Trường hợp 2: Meal là object snapshot
                        if (typeof meal === 'object') {
                            // Ưu tiên lấy 'mealId' vì trong Schema snapshot bạn lưu reference ở field này
                            if (meal.mealId) return meal.mealId;

                            // Fallback: nếu không có mealId thì mới tìm _id
                            if (meal._id) return meal._id;
                        }

                        // Nếu không match case nào (tránh gửi object gây lỗi validation)
                        return null;
                    })
                    .filter((id) => id !== null); // Lọc bỏ các giá trị null để đảm bảo mảng sạch
            });

            console.log('🔍 [handleApply] Meals payload:', mealsPayload);

            const payload = {
                menuName: menuDetails.menuName,
                numberOfChildren: menuDetails.numberOfChildren,
                nutritionalStandardId: menuDetails.nutritionalStandardId._id || menuDetails.nutritionalStandardId,
                meals: mealsPayload, // ✅ Fixed meals structure
                aggregatedFoodTable: editedSuggestions.map((item) => ({
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

            console.log('📤 [handleApply] Full payload:', payload);

            await schoolMenuApi.update(menuDetails._id, payload);
            toast.success('Cập nhật thực đơn thành công!');
            onSuccess();
            onClose(); // ✅ Close dialog after success
        } catch (error) {
            console.error('❌ Error updating menu:', error);
            console.error('❌ Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thực đơn!');
        } finally {
            setLoading(false);
        }
    };

    if (!menuDetails && loading) {
        return (
            <Dialog open={open} maxWidth="xl" fullWidth>
                <DialogContent sx={{ minHeight: 400 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    const formatPercent = (value) => {
        if (value === null || value === undefined) return '0.00';
        return Number(value).toFixed(2);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            {/* Header */}
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
                        <AutoFixHighIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Cân đối thực đơn dự kiến bằng A.I - {menuDetails?.menuName}
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

            {/* Content */}
            <DialogContent sx={{ minHeight: '72vh', bgcolor: '#f5f5f5' }}>
                {/* Bảng 1 & 2 */}
                <Grid container spacing={2} sx={{ mb: 1, mt: 0 }}>
                    {/* Bảng 1: Dữ liệu hiện tại */}
                    <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                            <Box sx={{ px: 2, py: 1.5, bgcolor: '#e3f2fd', borderBottom: '1px solid #ddd' }}>
                                <Typography fontWeight={600} color="primary">
                                    Thông tin thực phẩm hiện tại
                                </Typography>
                            </Box>
                            <TableContainer sx={{ maxHeight: 400 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 40 }}>
                                                STT
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', minWidth: 150 }}>
                                                Tên thực phẩm
                                            </TableCell>
                                            <TableCell
                                                sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 100 }}
                                                align="center"
                                            >
                                                Lượng ăn 1 trẻ (g)
                                            </TableCell>
                                            <TableCell
                                                sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 120 }}
                                                align="center"
                                            >
                                                Lượng mua {menuDetails?.numberOfChildren} trẻ (ĐVT)
                                            </TableCell>
                                            <TableCell
                                                sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 60 }}
                                                align="center"
                                            >
                                                ĐVT
                                            </TableCell>
                                            <TableCell
                                                sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 100 }}
                                                align="center"
                                            >
                                                Quy đổi (g)
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {menuDetails?.aggregatedFoodTable?.map((item, index) => (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    bgcolor: item.isMainFood ? '#fff3e0' : 'inherit',
                                                    height: '43px',
                                                }}
                                            >
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {item.foodName}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">{item.quantityPerChildGram}</TableCell>
                                                <TableCell align="center">{item.purchaseQuantityByUnit}</TableCell>
                                                <TableCell align="center">{item.unit}</TableCell>
                                                <TableCell align="center">{item.gramConversion}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    {/* Bảng 2: Gợi ý từ A.I */}
                    <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                            <Box sx={{ px: 2, py: 1.5, bgcolor: '#f3e5f5', borderBottom: '1px solid #ddd' }}>
                                <Typography fontWeight={600} color="secondary">
                                    Thông tin thực phẩm gợi ý từ A.I
                                </Typography>
                            </Box>

                            {!aiSuggestions ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={
                                            loadingAi ? (
                                                <CircularProgress size={16} color="inherit" />
                                            ) : (
                                                <AutoFixHighIcon />
                                            )
                                        }
                                        onClick={handleAiBalance}
                                        disabled={loadingAi}
                                        sx={{ borderRadius: 1.5 }}
                                    >
                                        {loadingAi ? 'Đang xử lý...' : 'Gợi ý cân đối thực đơn từ A.I'}
                                    </Button>
                                </Box>
                            ) : (
                                <TableContainer sx={{ maxHeight: 400 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 40 }}>
                                                    STT
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', minWidth: 150 }}>
                                                    Tên thực phẩm
                                                </TableCell>
                                                <TableCell
                                                    sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 100 }}
                                                    align="center"
                                                >
                                                    Lượng ăn 1 trẻ (g)
                                                </TableCell>
                                                <TableCell
                                                    sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 120 }}
                                                    align="center"
                                                >
                                                    Lượng mua {menuDetails?.numberOfChildren} trẻ (ĐVT)
                                                </TableCell>
                                                <TableCell
                                                    sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 60 }}
                                                    align="center"
                                                >
                                                    ĐVT
                                                </TableCell>
                                                <TableCell
                                                    sx={{ fontWeight: 600, bgcolor: '#fafafa', width: 100 }}
                                                    align="center"
                                                >
                                                    Quy đổi (g)
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {editedSuggestions?.map((item, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{ bgcolor: item.isMainFood ? '#fff3e0' : 'inherit' }}
                                                >
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {item.foodName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">{item.quantityPerChildGram}</TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            value={item.purchaseQuantityByUnit}
                                                            onChange={(e) =>
                                                                handleEditAiQuantity(index, e.target.value)
                                                            }
                                                            // 1. Chỉnh style trực tiếp vào thẻ input bên trong
                                                            inputProps={{
                                                                min: 0,
                                                                step: 0.1,
                                                                style: {
                                                                    padding: '4px 8px', // Giảm padding trên/dưới
                                                                    textAlign: 'center', // Căn giữa số liệu cho đẹp
                                                                    fontSize: '0.875rem', // Đồng bộ cỡ chữ với bảng bên trái
                                                                },
                                                            }}
                                                            // 2. Chỉnh style cho wrapper bên ngoài
                                                            sx={{
                                                                width: 100,
                                                                '& .MuiOutlinedInput-root': {
                                                                    height: '30px', // Ép chiều cao cố định (thường row small là ~33px)
                                                                    backgroundColor: '#fff', // Thêm nền trắng để dễ nhìn hơn
                                                                    '& fieldset': {
                                                                        borderColor: '#bdbdbd', // Viền mờ nhẹ
                                                                    },
                                                                    '&:hover fieldset': {
                                                                        borderColor: '#1976d2', // Viền xanh khi hover
                                                                    },
                                                                    '&.Mui-focused fieldset': {
                                                                        borderColor: '#1976d2', // Viền xanh khi focus
                                                                        borderWidth: '1px', // Giữ viền mảnh khi focus để không bị nhảy layout
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">{item.unit}</TableCell>
                                                    <TableCell align="center">{item.gramConversion}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Thống kê dinh dưỡng */}
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    Thống kê thành phần dinh dưỡng cho 1 trẻ
                </Typography>

                <Grid container spacing={2}>
                    {/* Đánh giá về Lượng */}
                    <Grid item xs={12} md={7}>
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ px: 2, py: 1, bgcolor: '#e3f2fd', borderBottom: '1px solid #ddd' }}>
                                <Typography fontWeight={600}>Đánh giá về Lượng</Typography>
                            </Box>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f5faff' }}>
                                    <TableRow>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}>
                                            Nội dung
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}
                                        >
                                            Protein (Đạm)
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}
                                        >
                                            Lipid (Béo)
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}
                                        >
                                            Glucid (Đường)
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                                            Tổng Calo
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* Dữ liệu hiện tại */}
                                    <TableRow>
                                        <TableCell sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}>
                                            Tổng lượng (hiện tại)
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            {currentNutrition?.totalProtein || 0} g
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            {currentNutrition?.totalLipid || 0} g
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            {currentNutrition?.totalGlucid || 0} g
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography component="span" fontWeight={700} sx={{ mr: 1 }}>
                                                {currentNutrition?.totalCalories || 0} kcal
                                            </Typography>
                                            {getStatusChip(currentNutrition?.caloriesEvaluation)}
                                        </TableCell>
                                    </TableRow>

                                    {/* Dữ liệu A.I */}
                                    {aiNutrition && (
                                        <TableRow sx={{ bgcolor: '#f3e5f5' }}>
                                            <TableCell sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}>
                                                Tổng lượng (A.I)
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                                {aiNutrition.totalProtein} g
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                                {aiNutrition.totalLipid} g
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                                {aiNutrition.totalGlucid} g
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography component="span" fontWeight={700} sx={{ mr: 1 }}>
                                                    {aiNutrition.totalCalories} kcal
                                                </Typography>
                                                {getStatusChip(aiNutrition.caloriesEvaluation)}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Chuẩn */}
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        <TableCell sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}>
                                            Chuẩn
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            —
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            —
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            —
                                        </TableCell>
                                        <TableCell align="center" fontWeight={600}>
                                            {menuDetails?.nutritionalStandardId?.recommendedCaloriesMin} –{' '}
                                            {menuDetails?.nutritionalStandardId?.recommendedCaloriesMax} kcal
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>

                    {/* Đánh giá về Chất (PLG) */}
                    <Grid item xs={12} md={5}>
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ px: 2, py: 1, bgcolor: '#e3f2fd', borderBottom: '1px solid #ddd' }}>
                                <Typography fontWeight={600}>Đánh giá về Chất (PLG %)</Typography>
                            </Box>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f5faff' }}>
                                    <TableRow>
                                        <TableCell sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}>
                                            Nội dung
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}
                                        >
                                            Protein
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ borderRight: '1px solid #ddd', fontWeight: 600 }}
                                        >
                                            Lipid
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                                            Glucid
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* Dữ liệu hiện tại */}
                                    <TableRow>
                                        <TableCell sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}>
                                            Tỷ lệ (hiện tại)
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            <Typography component="span" sx={{ mr: 1 }}>
                                                {formatPercent(currentNutrition?.proteinPercentage)} %
                                            </Typography>
                                            {getStatusChip(currentNutrition?.plgEvaluation?.protein)}
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            <Typography component="span" sx={{ mr: 1 }}>
                                                {formatPercent(currentNutrition?.lipidPercentage)} %
                                            </Typography>
                                            {getStatusChip(currentNutrition?.plgEvaluation?.lipid)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography component="span" sx={{ mr: 1 }}>
                                                {formatPercent(currentNutrition?.glucidPercentage)} %
                                            </Typography>
                                            {getStatusChip(currentNutrition?.plgEvaluation?.glucid)}
                                        </TableCell>
                                    </TableRow>

                                    {/* Dữ liệu A.I */}
                                    {aiNutrition && (
                                        <TableRow sx={{ bgcolor: '#f3e5f5' }}>
                                            <TableCell sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}>
                                                Tỷ lệ (A.I)
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                                <Typography component="span" sx={{ mr: 1 }}>
                                                    {formatPercent(aiNutrition.proteinPercentage)} %
                                                </Typography>
                                                {getStatusChip(aiNutrition.plgEvaluation.protein)}
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                                <Typography component="span" sx={{ mr: 1 }}>
                                                    {formatPercent(aiNutrition.lipidPercentage)} %
                                                </Typography>
                                                {getStatusChip(aiNutrition.plgEvaluation.lipid)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography component="span" sx={{ mr: 1 }}>
                                                    {formatPercent(aiNutrition.glucidPercentage)} %
                                                </Typography>
                                                {getStatusChip(aiNutrition.plgEvaluation.glucid)}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Chuẩn */}
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        <TableCell sx={{ borderRight: '1px solid #eee', fontWeight: 500 }}>
                                            Chuẩn
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            {menuDetails?.nutritionalStandardId?.plgStructure?.proteinMin} –{' '}
                                            {menuDetails?.nutritionalStandardId?.plgStructure?.proteinMax} %
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderRight: '1px solid #eee' }}>
                                            {menuDetails?.nutritionalStandardId?.plgStructure?.lipidMin} –{' '}
                                            {menuDetails?.nutritionalStandardId?.plgStructure?.lipidMax} %
                                        </TableCell>
                                        <TableCell align="center">
                                            {menuDetails?.nutritionalStandardId?.plgStructure?.glucidMin} –{' '}
                                            {menuDetails?.nutritionalStandardId?.plgStructure?.glucidMax} %
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 1.5 }}>
                    Hủy bỏ
                </Button>
                <Button
                    onClick={handleApply}
                    variant="contained"
                    disabled={!editedSuggestions || loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                        borderRadius: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    {loading ? 'Đang xử lý...' : 'Áp dụng'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default BalancingMenuAi;
