// client/src/pages/School/Dashboard/TotalClasses.jsx

import {
    Paper,
    Typography,
    Box,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

function TotalClasses({ data, classesList }) {
    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#e8f5e9', width: 56, height: 56 }}>
                    <SchoolIcon sx={{ fontSize: 32, color: '#4caf50' }} />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Tổng số lớp
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                        {data}
                    </Typography>
                </Box>
            </Box>

            <TableContainer sx={{ maxHeight: 280, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5' }}>Tên lớp</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5' }}>Nhóm tuổi</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5' }}>GVCN</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classesList.map((cls) => (
                            <TableRow key={cls._id} hover>
                                <TableCell>{cls.name}</TableCell>
                                <TableCell>{cls.ageGroup}</TableCell>
                                <TableCell>{cls.homeRoomTeacher}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

export default TotalClasses;
