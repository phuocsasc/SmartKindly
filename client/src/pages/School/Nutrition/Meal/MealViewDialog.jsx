import { useEffect, useState } from 'react';
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
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Grid,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { schoolMealApi } from '~/apis';
import { toast } from 'react-toastify';

const ENERGY_FACTORS = { PROTEIN: 4, LIPID: 9, GLUCID: 4 };

function MealViewDialog({ open, mealId, onClose }) {
    const [loading, setLoading] = useState(false);
    const [mealData, setMealData] = useState(null);

    useEffect(() => {
        if (open && mealId) {
            fetchMealDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mealId]);

    const fetchMealDetails = async () => {
        try {
            setLoading(true);
            const res = await schoolMealApi.getDetails(mealId);
            setMealData(res.data.data);
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết món ăn!');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const calculateCalories = (ingredient) => {
        const { protein, lipid, glucid, quantityPerChildGram } = ingredient;
        return (
            (protein * ENERGY_FACTORS.PROTEIN + lipid * ENERGY_FACTORS.LIPID + glucid * ENERGY_FACTORS.GLUCID) *
            quantityPerChildGram
        );
    };

    const totalMealCalories = mealData
        ? mealData.ingredients.reduce((total, ing) => total + calculateCalories(ing), 0)
        : 0;

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
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
                        <VisibilityIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Chi tiết món ăn
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

            <DialogContent sx={{ px: 3, py: 2.5, minHeight: 400, bgcolor: '#f9f9f9' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : mealData ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Thông tin món ăn */}
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                backgroundColor: '#fff',
                                mt: 2,
                            }}
                        >
                            {/* Header */}
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    background: 'linear-gradient(135deg, #e3f2fd, #ffffff)',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <InfoOutlinedIcon color="primary" />
                                <Typography variant="h6" fontWeight={600}>
                                    Thông tin món ăn
                                </Typography>
                            </Box>

                            {/* Content */}
                            <Box sx={{ p: 2.5 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Tên món ăn
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {mealData.name}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Loại món ăn
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {mealData.mealType}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>

                        {/* Nguyên liệu */}
                        <Box>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                                Nguyên liệu của món ăn ({mealData.ingredients.length} thực phẩm)
                            </Typography>
                            <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}
                            >
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
                                        <TableRow
                                            sx={{
                                                bgcolor: '#e3f2fd',
                                                '& th': {
                                                    fontWeight: 600,
                                                    textAlign: 'center',
                                                    whiteSpace: 'nowrap',
                                                },
                                            }}
                                        >
                                            <TableCell>
                                                <Typography fontWeight={600}>STT</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={600}>Tên thực phẩm</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography fontWeight={600}>Lượng ăn 1 trẻ (g)</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <HeaderWithTooltip
                                                    label="Protein"
                                                    tooltip="Thông tin dinh dưỡng (trên 1 gam thực phẩm)"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <HeaderWithTooltip
                                                    label="Lipid"
                                                    tooltip="Thông tin dinh dưỡng (trên 1 gam thực phẩm)"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <HeaderWithTooltip
                                                    label="Glucid"
                                                    tooltip="Thông tin dinh dưỡng (trên 1 gam thực phẩm)"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <HeaderWithTooltip
                                                    label="Calo"
                                                    tooltip="Công thức tính Calo: Protein × 4 + Lipid × 9 + Glucid × 4"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mealData.ingredients.map((ing, index) => (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    bgcolor: ing.isMainFood ? '#fff3e0' : 'inherit',
                                                }}
                                            >
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {ing.foodName}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">{ing.quantityPerChildGram}</TableCell>
                                                <TableCell align="center">{ing.protein}</TableCell>
                                                <TableCell align="center">{ing.lipid}</TableCell>
                                                <TableCell align="center">{ing.glucid}</TableCell>
                                                <TableCell align="center">
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        {calculateCalories(ing).toFixed(2)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Tổng Calo */}
                            <Paper
                                elevation={0}
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #e3f2fd, #ffffff)',
                                    border: '1px solid #e0e0e0',
                                }}
                            >
                                <Typography fontWeight={600}>Tổng Calo của món ăn / 1 trẻ</Typography>
                                <Typography variant="h6" fontWeight={700} color="error.main">
                                    {totalMealCalories.toFixed(2)} kcal
                                </Typography>
                            </Paper>
                        </Box>
                    </Box>
                ) : (
                    <Typography>Không có dữ liệu</Typography>
                )}
            </DialogContent>

            <Divider />
            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default MealViewDialog;
