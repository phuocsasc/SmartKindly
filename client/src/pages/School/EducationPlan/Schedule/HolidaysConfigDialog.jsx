/* eslint-disable no-unused-vars */
// client/src/pages/School/EducationPlan/Schedule/HolidaysConfigDialog.jsx

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
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Chip,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { scheduleApi } from '~/apis';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

function HolidaysConfigDialog({ open, scheduleId, weeks, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [selectedHolidays, setSelectedHolidays] = useState({});
    const [existingHolidays, setExistingHolidays] = useState([]);

    useEffect(() => {
        if (open && scheduleId) {
            fetchExistingHolidays();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, scheduleId]);

    const fetchExistingHolidays = async () => {
        try {
            setLoading(true);
            const res = await scheduleApi.getHolidays(scheduleId);
            const holidays = res.data.data.holidays || [];

            console.log('📅 [fetchExistingHolidays] Raw holidays from API:', holidays);

            setExistingHolidays(holidays);

            // ✅ FIX: Convert ISO date strings to YYYY-MM-DD format
            const holidaysMap = {};
            holidays.forEach((dateISO) => {
                const dateKey = dayjs(dateISO).format('YYYY-MM-DD'); // ✅ Convert to YYYY-MM-DD
                holidaysMap[dateKey] = true;
                console.log('✅ [fetchExistingHolidays] Mapped holiday:', { dateISO, dateKey });
            });

            setSelectedHolidays(holidaysMap);

            console.log('📊 [fetchExistingHolidays] Summary:', {
                totalHolidays: holidays.length,
                holidaysMap: Object.keys(holidaysMap),
            });
        } catch (error) {
            console.error('Error fetching holidays:', error);
            toast.error('Lỗi khi tải danh sách ngày nghỉ!');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDay = (date) => {
        setSelectedHolidays((prev) => ({
            ...prev,
            [date]: !prev[date],
        }));
    };

    const handleToggleWeek = (weekDates) => {
        const allSelected = weekDates.every((date) => selectedHolidays[date]);

        setSelectedHolidays((prev) => {
            const newState = { ...prev };
            weekDates.forEach((date) => {
                newState[date] = !allSelected;
            });
            return newState;
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const holidayDates = Object.keys(selectedHolidays).filter((date) => selectedHolidays[date]);

            console.log('🔄 Saving holidays:', {
                scheduleId,
                holidayDates,
            });

            await scheduleApi.updateHolidays(scheduleId, { holidays: holidayDates });

            toast.success('Cấu hình ngày nghỉ thành công!');
            onSuccess?.();
        } catch (error) {
            console.error('Error saving holidays:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi cấu hình ngày nghỉ!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const formatDate = (date) => dayjs(date).format('DD/MM');

    const getWeekDates = (week) => {
        const dates = [];
        for (let i = 0; i < 5; i++) {
            const date = dayjs(week.startDate).add(i, 'day').format('YYYY-MM-DD');
            dates.push(date);
        }
        return dates;
    };

    const isWeekFullySelected = (weekDates) => {
        return weekDates.every((date) => selectedHolidays[date]);
    };

    const totalSelectedDays = Object.values(selectedHolidays).filter(Boolean).length;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #f44336 0%, #ffcdd2 100%)',
                    color: 'white',
                    py: 1.5,
                    position: 'relative',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', width: 32, height: 32 }}>
                        <EventBusyIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                        Cấu hình ngày nghỉ
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    disabled={loading}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                    }}
                >
                    <CloseIcon sx={{ color: 'black' }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 3 }}>
                {loading && !weeks ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Info */}
                        <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                            <Typography variant="body2">
                                Chọn các ngày nghỉ trong năm học. Các ngày nghỉ sẽ không cần điểm danh và kế hoạch giáo
                                dục.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Tổng số ngày nghỉ đã chọn:</strong>{' '}
                                <Chip label={`${totalSelectedDays} ngày`} color="error" size="small" />
                            </Typography>
                        </Alert>

                        {/* Table */}
                        <TableContainer
                            component={Paper}
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 2,
                                maxHeight: 500,
                                overflowY: 'auto',
                            }}
                        >
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#ffebee',
                                                minWidth: 150,
                                            }}
                                        >
                                            Tuần
                                        </TableCell>
                                        {WEEKDAYS.map((day) => (
                                            <TableCell
                                                key={day}
                                                align="center"
                                                sx={{
                                                    fontWeight: 700,
                                                    bgcolor: '#ffebee',
                                                    minWidth: 120,
                                                }}
                                            >
                                                {day}
                                            </TableCell>
                                        ))}
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: '#ffebee',
                                                minWidth: 100,
                                            }}
                                        >
                                            Chọn tuần
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {weeks.map((week) => {
                                        const weekDates = getWeekDates(week);
                                        const isFullySelected = isWeekFullySelected(weekDates);

                                        return (
                                            <TableRow key={week.weekNumber} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>
                                                    Tuần {week.weekNumber}
                                                    <Typography
                                                        variant="caption"
                                                        display="block"
                                                        color="text.secondary"
                                                    >
                                                        {formatDate(week.startDate)} - {formatDate(week.endDate)}
                                                    </Typography>
                                                </TableCell>

                                                {weekDates.map((date, index) => {
                                                    const isSelected = selectedHolidays[date];
                                                    return (
                                                        <TableCell
                                                            key={date}
                                                            align="center"
                                                            sx={{
                                                                bgcolor: isSelected ? '#ffebee' : 'inherit',
                                                                // cursor: 'pointer',
                                                                '&:hover': {
                                                                    bgcolor: isSelected ? '#ffcdd2' : '#fffaf0',
                                                                },
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected || false}
                                                                    onChange={() => handleToggleDay(date)} // ✅ Chỉ checkbox mới toggle
                                                                    size="small"
                                                                    sx={{
                                                                        color: '#f44336',
                                                                        '&.Mui-checked': { color: '#f44336' },
                                                                    }}
                                                                />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {formatDate(date)}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                    );
                                                })}

                                                <TableCell align="center">
                                                    <Checkbox
                                                        checked={isFullySelected}
                                                        indeterminate={
                                                            !isFullySelected &&
                                                            weekDates.some((date) => selectedHolidays[date])
                                                        }
                                                        onChange={(e) => {
                                                            e.stopPropagation(); // ✅ Prevent event bubbling
                                                            handleToggleWeek(weekDates);
                                                        }}
                                                        size="small"
                                                        sx={{
                                                            color: '#f44336',
                                                            '&.Mui-checked': { color: '#f44336' },
                                                            '&.MuiCheckbox-indeterminate': { color: '#ff9800' },
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    size="small"
                    disabled={loading}
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
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    size="small"
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#f44336',
                        '&:hover': { bgcolor: '#d32f2f' },
                    }}
                >
                    {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Lưu cấu hình'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default HolidaysConfigDialog;
