// client/src/pages/School/Nutrition/Meal/MealDialog.jsx

import { useState, useEffect, useMemo } from 'react';
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
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssistantOutlinedIcon from '@mui/icons-material/AssistantOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { schoolMealApi } from '~/apis';
import { toast } from 'react-toastify';

const MEAL_TYPES = [
    'Món kho',
    'Món luộc',
    'Món canh',
    'Món mặn',
    'Món xào',
    'Món xế',
    'Soup',
    'Lẩu',
    'Món bánh',
    'Tráng miệng',
];

function MealDialog({ open, mode, meal, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchFoodText, setSearchFoodText] = useState('');
    const [foodOptions, setFoodOptions] = useState([]);
    const [loadingFoods, setLoadingFoods] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mealType: '',
        ingredients: [],
    });

    const isCreateMode = mode === 'create';

    // Load meal data for edit mode
    useEffect(() => {
        if (open && mode === 'edit' && meal) {
            setFormData({
                name: meal.name || '',
                mealType: meal.mealType || '',
                ingredients: meal.ingredients
                    ? meal.ingredients.map((ing) => ({
                          ...ing, // ✅ clone từng ingredient
                      }))
                    : [],
            });
        }

        if (open && mode === 'create') {
            setFormData({
                name: '',
                mealType: '',
                ingredients: [],
            });
        }

        if (open) {
            setActiveTab(0);
            setSearchFoodText('');
        }
    }, [open, mode, meal]);

    // Search foods
    const searchFoods = async (search) => {
        try {
            setLoadingFoods(true);
            const res = await schoolMealApi.searchFoods(search, 20);
            setFoodOptions(res.data.data.foods);
        } catch (error) {
            console.error('Error searching foods:', error);
        } finally {
            setLoadingFoods(false);
        }
    };

    useEffect(() => {
        const keyword = searchFoodText.trim();

        if (keyword.length >= 1) {
            const timer = setTimeout(() => {
                searchFoods(keyword); // ✅ GỬI ĐÃ TRIM
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setFoodOptions([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchFoodText]);

    // Add ingredient
    const handleAddIngredient = (food) => {
        if (!food) return;

        // Check duplicate
        const exists = formData.ingredients.find((ing) => ing.foodId === food._id);
        if (exists) {
            toast.warning('Thực phẩm này đã có trong danh sách!');
            return;
        }

        const newIngredient = {
            foodId: food._id,
            foodName: food.name,
            quantityPerChildGram: 0,
            isMainFood: false,
            // Copy thông tin từ SchoolFood
            unit: food.unit,
            gramConversion: food.gramConversion,
            wastePercentage: food.wastePercentage,
            protein: food.protein,
            lipid: food.lipid,
            glucid: food.glucid,
        };

        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, newIngredient],
        });

        setSearchFoodText('');
        toast.success(`Đã thêm ${food.name}`);
    };

    // Remove ingredient
    const handleRemoveIngredient = (index) => {
        const updated = [...formData.ingredients];
        updated.splice(index, 1);
        setFormData({ ...formData, ingredients: updated });
    };

    // Update quantity
    const handleQuantityChange = (index, value) => {
        const updated = [...formData.ingredients];
        updated[index].quantityPerChildGram = parseFloat(value) || 0;
        setFormData({ ...formData, ingredients: updated });
    };

    // ✅ Toggle main food (Checkbox - có thể nhiều thực phẩm chính)
    const handleToggleMainFood = (index) => {
        const updated = [...formData.ingredients];
        updated[index].isMainFood = !updated[index].isMainFood;
        setFormData({ ...formData, ingredients: updated });
    };

    // Calculate calories
    const calculateCalories = (ingredient) => {
        const { protein = 0, lipid = 0, glucid = 0, quantityPerChildGram = 0 } = ingredient;

        return (protein * 4 + lipid * 9 + glucid * 4) * quantityPerChildGram;
        // ✅ TRẢ VỀ NUMBER
    };

    // ✅ Tính tổng calo của món ăn bằng useMemo
    const totalMealCalories = useMemo(() => {
        return formData.ingredients.reduce((total, ing) => total + calculateCalories(ing), 0);
    }, [formData.ingredients]);

    // Calculate kg from gram
    const gramToKg = (gram) => {
        return (gram / 1000).toFixed(3);
    };

    // Submit
    const handleSubmit = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên món ăn!');
            setActiveTab(0);
            return;
        }
        if (!formData.mealType) {
            toast.error('Vui lòng chọn loại món ăn!');
            setActiveTab(0);
            return;
        }
        if (formData.ingredients.length === 0) {
            toast.error('Vui lòng thêm ít nhất 1 nguyên liệu!');
            setActiveTab(1);
            return;
        }

        // Validate ingredients
        const invalidIngredient = formData.ingredients.find((ing) => ing.quantityPerChildGram <= 0);
        if (invalidIngredient) {
            toast.error(`Lượng ăn của "${invalidIngredient.foodName}" phải lớn hơn 0!`);
            setActiveTab(1);
            return;
        }

        try {
            setLoading(true);

            // Prepare data
            const dataToSubmit = {
                name: formData.name,
                mealType: formData.mealType,
                ingredients: formData.ingredients.map((ing) => ({
                    foodId: ing.foodId,
                    quantityPerChildGram: ing.quantityPerChildGram,
                    isMainFood: ing.isMainFood,
                })),
            };

            if (isCreateMode) {
                await schoolMealApi.create(dataToSubmit);
                toast.success('Tạo món ăn thành công!');
            } else {
                await schoolMealApi.update(meal.id, dataToSubmit);
                toast.success('Cập nhật món ăn thành công!');
            }

            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' },
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #0071bc 0%, #aee2ff 100%)',
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
                        {isCreateMode ? 'Thêm món ăn mới' : `Chỉnh sửa món ăn - ${meal?.name}`}
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
                    <CloseIcon sx={{ color: 'red' }} />
                </IconButton>
            </DialogTitle>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant="fullWidth">
                    <Tab label="Thông tin cơ bản" />
                    <Tab label="Nguyên liệu của món ăn" />
                </Tabs>
            </Box>

            {/* Content */}
            <DialogContent sx={{ px: 3, py: 2.5, minHeight: 400 }}>
                {/* Tab 0: Thông tin cơ bản */}
                {activeTab === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Tên món ăn"
                            placeholder="VD: Canh chua cá, Thịt kho tàu..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            fullWidth
                            size="small"
                        />

                        <FormControl required fullWidth size="small">
                            <InputLabel>Loại món ăn</InputLabel>
                            <Select
                                value={formData.mealType}
                                onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                                label="Loại món ăn"
                            >
                                <MenuItem value="">-- Chọn loại món ăn --</MenuItem>
                                {MEAL_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box
                            sx={{
                                p: 2,
                                bgcolor: '#e3f2fd',
                                borderRadius: 2,
                                border: '1px solid #bbdefb',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                💡 <strong>Hướng dẫn tạo món ăn:</strong>
                                <br />
                                – Nhập "Tên món ăn" và chọn "Loại món ăn".
                                <br />
                                – Chuyển sang tab "Nguyên liệu của món ăn" để thêm các thực phẩm cần thiết.
                                <br />– Nhập "Lượng ăn của 1 trẻ (g)" cho mỗi nguyên liệu.
                                <br />– Chọn thực phẩm chính (có thể chọn nhiều).
                                <br />– Công thức tính Calo = Đạm (Protein) * 4 + Béo (Lipid) * 9 + Đường (Glucid) * 4.
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: '#fff8e1',
                                borderRadius: 2,
                                border: '1px dashed #ffcc80',
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#ef6c00' }}>
                                <AssistantOutlinedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                Gợi ý bảng định lượng cho 1 trẻ (tham khảo)
                            </Typography>

                            {/* Món mặn */}
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#1565c0' }}>
                                – Các món mặn
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 1 }}>
                                • Đạm: <strong>25 – 35g / trẻ</strong>
                                <br />• Rau củ: <strong>15 – 25g / trẻ</strong>
                                <br />• Gia vị: <strong>~1g</strong>
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            {/* Món canh */}
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#d32f2f' }}>
                                – Các món nước
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 1 }}>
                                • Rau củ: <strong>25 – 40g / trẻ</strong>
                                <br />• Đạm: <strong>10 – 20g / trẻ</strong>
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            {/* Món xế */}
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#2f490cff' }}>
                                – Các món xế
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 1 }}>
                                • Thực phẩm khô (Nui, Hủ tiếu…): <strong>25 – 35g</strong>
                                <br />• Thực phẩm tươi (Bún, Bánh phở…): <strong>40 – 60g</strong>
                                <br />• Cháo (gạo): <strong>15 – 25g</strong>
                                <br />• Soup (bột năng, bột bắp): <strong>5 – 10g</strong>
                                <br />• Đạm: <strong>15 – 25g</strong>
                                <br />• Rau củ: <strong>10 – 20g</strong>
                            </Typography>

                            {/* <Divider sx={{ my: 1 }} /> */}

                            {/* <Typography variant="caption" color="text.secondary">
                                ⚠️ Lưu ý: Món xế dạng thực phẩm tươi hoặc soup nên phối hợp thêm nước trái cây (chanh,
                                tắc, cam…) để bổ sung đường tự nhiên.
                            </Typography> */}
                        </Box>
                    </Box>
                )}

                {/* Tab 1: Nguyên liệu */}
                {activeTab === 1 && (
                    <Box>
                        {/* Search food */}
                        <Box sx={{ mb: 2 }}>
                            <Autocomplete
                                freeSolo
                                filterOptions={(x) => x} // ✅ TẮT FILTER MUI
                                options={foodOptions}
                                getOptionLabel={(option) => option.name || ''}
                                inputValue={searchFoodText}
                                onInputChange={(e, value) => setSearchFoodText(value.replace(/\s+/g, ' '))}
                                onChange={(e, value) => handleAddIngredient(value)}
                                loading={loadingFoods}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Tìm kiếm thực phẩm"
                                        placeholder="Nhập tên thực phẩm..."
                                        size="small"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {option.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.unit} | {option.categories.join(', ')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                                noOptionsText="Không tìm thấy thực phẩm"
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Ingredients table */}
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Nguyên liệu món ăn "{formData.name || '...'}"
                        </Typography>

                        {formData.ingredients.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                <Typography>Chưa có nguyên liệu nào. Vui lòng tìm kiếm và thêm thực phẩm.</Typography>
                            </Box>
                        ) : (
                            <>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                                            <TableRow>
                                                <TableCell align="center" width={50}>
                                                    STT
                                                </TableCell>
                                                <TableCell>Tên thực phẩm</TableCell>
                                                <TableCell align="center" width={140}>
                                                    Lượng ăn của 1 trẻ (g)
                                                </TableCell>
                                                <TableCell align="center" width={120}>
                                                    Lượng ăn của 1 trẻ (kg)
                                                </TableCell>
                                                <TableCell align="center" width={130}>
                                                    Calo / 1 trẻ
                                                </TableCell>
                                                <TableCell align="center" width={100}>
                                                    Đơn vị tính
                                                </TableCell>
                                                <TableCell align="center" width={130}>
                                                    Quy đổi sang (g)
                                                </TableCell>
                                                <TableCell align="center" width={120}>
                                                    Hệ số thái bỏ (%)
                                                </TableCell>
                                                <TableCell align="center" width={110}>
                                                    Thực phẩm chính
                                                </TableCell>
                                                <TableCell align="center" width={80}>
                                                    Thao tác
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {formData.ingredients.map((ing, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        bgcolor: ing.isMainFood ? '#fff3e0' : 'inherit',
                                                        '&:hover': { bgcolor: ing.isMainFood ? '#ffe0b2' : '#f5f5f5' },
                                                    }}
                                                >
                                                    <TableCell align="center">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {ing.foodName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            type="number"
                                                            value={ing.quantityPerChildGram}
                                                            onChange={(e) =>
                                                                handleQuantityChange(index, e.target.value)
                                                            }
                                                            size="small"
                                                            inputProps={{ min: 0, step: 0.1 }}
                                                            sx={{ width: 100 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {gramToKg(ing.quantityPerChildGram)}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ color: '#d32f2f', fontWeight: 600 }}
                                                        >
                                                            {calculateCalories(ing).toFixed(2)} kcal
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">{ing.unit}</TableCell>
                                                    <TableCell align="center">{ing.gramConversion}g</TableCell>
                                                    <TableCell align="center">{ing.wastePercentage}%</TableCell>
                                                    <TableCell align="center">
                                                        {/* ✅ Checkbox thay vì Radio */}
                                                        <Checkbox
                                                            checked={ing.isMainFood}
                                                            onChange={() => handleToggleMainFood(index)}
                                                            size="small"
                                                            sx={{
                                                                color: '#ff9800',
                                                                '&.Mui-checked': {
                                                                    color: '#ff9800',
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveIngredient(index)}
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        mt: 2,
                                        p: 1.5,
                                        bgcolor: '#e3f2fd',
                                        display: 'flex',
                                        // justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        gap: 2,
                                        border: '1px solid #ffe0b2',
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={600}>
                                        Tổng Calo của món ăn / 1 trẻ:
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} color="error.main">
                                        {totalMealCalories.toFixed(2)} kcal
                                    </Typography>
                                </Paper>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>

            <Divider />

            {/* Actions */}
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
                    {loading ? 'Đang xử lý...' : isCreateMode ? 'Tạo món ăn' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default MealDialog;
