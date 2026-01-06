import { useState, useEffect } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { schoolMenuApplyApi, schoolMenuApi } from '~/apis';
import { toast } from 'react-toastify';

const MEAL_SESSIONS = ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa phụ'];

function MenuApplyDialog({ open, mode, data, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [loadingMenus, setLoadingMenus] = useState(false);
    const [loadingMenuDetails, setLoadingMenuDetails] = useState(false);
    const [availableMenus, setAvailableMenus] = useState([]);
    const [selectedMenuId, setSelectedMenuId] = useState('');
    const [selectedMenuDetails, setSelectedMenuDetails] = useState(null);
    const [existingMenuApplyData, setExistingMenuApplyData] = useState(null); // ✅ Lưu dữ liệu menu apply hiện tại

    const isEditMode = mode === 'edit';

    useEffect(() => {
        if (open && data) {
            fetchAvailableMenus();

            if (isEditMode && data.existingMenuId) {
                // setSelectedMenuId(data.existingMenuId);
                // ✅ Nếu là edit mode, fetch dữ liệu menu apply hiện tại
                fetchExistingMenuApply(data.menuApplyId);
            } else {
                setSelectedMenuId('');
                setSelectedMenuDetails(null);
                setExistingMenuApplyData(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, data]);

    // ✅ Fetch existing menu apply để lấy menuSnapshot
    const fetchExistingMenuApply = async (menuApplyId) => {
        try {
            setLoadingMenuDetails(true);
            const res = await schoolMenuApplyApi.getDetails(menuApplyId);
            const menuApply = res.data.data;

            console.log('✅ Existing menu apply:', menuApply);

            setExistingMenuApplyData(menuApply);
            setSelectedMenuId(menuApply.menuId?._id || '');

            // ✅ Sử dụng menuSnapshot thay vì fetch lại từ schoolMenu
            if (menuApply.menuSnapshot) {
                setSelectedMenuDetails({
                    menuName: menuApply.menuSnapshot.menuName,
                    numberOfChildren: menuApply.menuSnapshot.numberOfChildren,
                    meals: menuApply.menuSnapshot.meals,
                });
            }
        } catch (error) {
            console.error('❌ Error fetching existing menu apply:', error);
            toast.error('Lỗi khi tải thông tin thực đơn áp dụng!');
        } finally {
            setLoadingMenuDetails(false);
        }
    };

    /// Fetch menu details khi chọn menu MỚI (chỉ khi thay đổi selection)
    useEffect(() => {
        // ✅ Chỉ fetch khi:
        // 1. Có selectedMenuId
        // 2. KHÔNG phải đang load existing menu apply (để tránh ghi đè menuSnapshot)
        // 3. selectedMenuId khác với existingMenuApplyData?.menuId (người dùng chọn menu khác)
        if (selectedMenuId && !loadingMenuDetails && selectedMenuId !== existingMenuApplyData?.menuId?._id) {
            fetchMenuDetails(selectedMenuId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMenuId]);

    // Fetch available menus
    const fetchAvailableMenus = async () => {
        if (!data?.ageGroup) return;

        try {
            setLoadingMenus(true);
            const res = await schoolMenuApplyApi.getAvailableMenus(data.ageGroup);
            setAvailableMenus(res.data.data.menus || []);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách thực đơn!');
        } finally {
            setLoadingMenus(false);
        }
    };

    // Fetch menu details
    const fetchMenuDetails = async (menuId) => {
        try {
            setLoadingMenuDetails(true);
            const res = await schoolMenuApi.getDetails(menuId);
            setSelectedMenuDetails(res.data.data);
            console.log('✅ Menu details:', res.data.data);
        } catch (error) {
            console.error('❌ Error fetching menu details:', error);
            toast.error('Lỗi khi tải chi tiết thực đơn!');
        } finally {
            setLoadingMenuDetails(false);
        }
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!selectedMenuId) {
            toast.warning('Vui lòng chọn thực đơn!');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ageGroup: data.ageGroup,
                weekNumber: data.weekNumber,
                dayOfWeek: data.dayOfWeek,
                menuId: selectedMenuId,
            };

            if (isEditMode) {
                await schoolMenuApplyApi.update(data.menuApplyId, { menuId: selectedMenuId });
                toast.success('Cập nhật thực đơn áp dụng thành công!');
            } else {
                await schoolMenuApplyApi.create(payload);
                toast.success('Thêm thực đơn áp dụng thành công!');
            }

            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setLoading(false);
        }
    };

    return (
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
                        <RestaurantMenuIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        {isEditMode ? 'Cập nhật thực đơn áp dụng' : 'Thêm thực đơn áp dụng'}
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

            <DialogContent sx={{ pt: 3 }}>
                {/* Context Info */}
                <Box
                    sx={{
                        p: 2,
                        bgcolor: '#e3f2fd',
                        borderRadius: 1.5,
                        border: '1px solid #90caf9',
                        mb: 2.5,
                        mt: 2,
                    }}
                >
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        <strong>Nhóm trẻ:</strong> {data?.ageGroup}
                    </Typography>

                    <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                        <strong>Ngày áp dụng:</strong> {data?.dayOfWeek} ({data?.date})
                    </Typography>

                    <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                        <strong>Tuần:</strong> Tuần {data?.weekNumber}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Menu Selection */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            mb: 1.5,
                            color: '#667eea',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ width: 3, height: 14, bgcolor: '#667eea', borderRadius: 1 }} />
                        Chọn thực đơn áp dụng
                    </Typography>

                    {loadingMenus ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : availableMenus.length === 0 ? (
                        <Alert severity="warning">
                            Không có thực đơn nào phù hợp với nhóm trẻ <strong>{data?.ageGroup}</strong>. Vui lòng tạo
                            thực đơn trước!
                        </Alert>
                    ) : (
                        <>
                            <FormControl fullWidth size="small">
                                <InputLabel>Chọn thực đơn</InputLabel>
                                <Select
                                    value={selectedMenuId}
                                    onChange={(e) => setSelectedMenuId(e.target.value)}
                                    label="Chọn thực đơn"
                                >
                                    <MenuItem value="">-- Chọn thực đơn --</MenuItem>
                                    {availableMenus.map((menu) => (
                                        <MenuItem key={menu._id} value={menu._id}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    width: '100%',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Typography variant="body2">{menu.menuName}</Typography>
                                                <Chip
                                                    label={`${menu.numberOfChildren} trẻ`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Preview selected menu */}
                            {selectedMenuId && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 2,
                                        bgcolor: '#f5f5f5',
                                        borderRadius: 1.5,
                                        border: '1px solid #e0e0e0',
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                                        Thông tin thực đơn đã chọn
                                    </Typography>

                                    {loadingMenuDetails ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    ) : selectedMenuDetails ? (
                                        <>
                                            {/* Tên thực đơn & Số trẻ */}
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                    <strong>Tên thực đơn:</strong> {selectedMenuDetails.menuName}
                                                </Typography>
                                                {/* <Typography variant="body2" color="text.secondary">
                                                    <strong>Số lượng trẻ:</strong>{' '}
                                                    {selectedMenuDetails.numberOfChildren} trẻ
                                                </Typography> */}
                                            </Box>

                                            <Divider sx={{ my: 1.5 }} />

                                            {/* Danh sách món ăn theo bữa */}
                                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                Danh sách món ăn:
                                            </Typography>

                                            <TableContainer
                                                component={Paper}
                                                variant="outlined"
                                                sx={{
                                                    mt: 1,
                                                    maxHeight: 300,
                                                    overflow: 'auto',
                                                    borderRadius: 1,
                                                }}
                                            >
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell
                                                                sx={{
                                                                    bgcolor: '#e3f2fd',
                                                                    fontWeight: 600,
                                                                    width: '30%',
                                                                }}
                                                            >
                                                                Bữa ăn
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    bgcolor: '#e3f2fd',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Món ăn
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {MEAL_SESSIONS.map((session) => {
                                                            const meals = selectedMenuDetails.meals?.[session] || [];
                                                            return (
                                                                <TableRow
                                                                    key={session}
                                                                    sx={{
                                                                        '&:hover': { bgcolor: '#f5f5f5' },
                                                                    }}
                                                                >
                                                                    <TableCell
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            color: 'primary.main',
                                                                            verticalAlign: 'top',
                                                                            borderRight: '1px solid #e0e0e0',
                                                                        }}
                                                                    >
                                                                        {session}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {meals.length > 0 ? (
                                                                            <Box
                                                                                sx={{
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: 0.5,
                                                                                }}
                                                                            >
                                                                                {meals.map((meal, idx) => (
                                                                                    <Typography
                                                                                        key={idx}
                                                                                        variant="body2"
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
                                                                                Chưa có món ăn
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </>
                                    ) : (
                                        <Alert severity="info" sx={{ mt: 1 }}>
                                            Không thể tải chi tiết thực đơn
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    sx={{ borderRadius: 1.5, px: 2.5, textTransform: 'none', fontWeight: 600 }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    size="small"
                    disabled={loading || !selectedMenuId}
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
                    {loading ? <CircularProgress size={20} color="inherit" /> : isEditMode ? 'Cập nhật' : 'Áp dụng'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default MenuApplyDialog;
