// client/src/pages/School/Children/ChildrenCertificate/ChildrenCertificate.jsx

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    TextField,
    IconButton,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import { childrenCertificateApi, academicYearApi, childrenProfileApi } from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import dayjs from '~/config/dayjsConfig';
import ChildrenCertificateDialog from './ChildrenCertificateDialog';

function ChildrenCertificate() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    // State
    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('');
    const [searchText, setSearchText] = useState('');

    // Certificate data
    const [students, setStudents] = useState([]);
    const [certificates, setCertificates] = useState({});

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);

    const isActiveYear = selectedYear === activeYearId;
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_CERTIFICATE);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_CERTIFICATE);

    // ✅ Fetch academic years
    const fetchAcademicYears = async () => {
        try {
            const res = await academicYearApi.getAll({ page: 1, limit: 100, status: '' });
            const years = res.data.data.academicYears;
            setAcademicYears(years);

            const activeYear = years.find((year) => year.status === 'active');
            if (activeYear) {
                setActiveYearId(activeYear._id);
                setSelectedYear(activeYear._id);
            }
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Lỗi khi tải danh sách năm học!');
        }
    };

    // ✅ Fetch classes
    const fetchClasses = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenCertificateApi.getAccessibleClasses(selectedYear);
            const classList = res.data.data.classes;
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClass(classList[0]._id);
            } else {
                setSelectedClass('');
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Lỗi khi tải danh sách lớp học!');
            setClasses([]);
            setSelectedClass('');
        }
    };

    // ✅ Fetch valid weeks (exclude fully holiday weeks Mon-Fri)
    const fetchValidWeeks = async () => {
        if (!selectedYear) return;

        try {
            const res = await childrenCertificateApi.getValidWeeks(selectedYear);
            const weeksData = res.data.data.weeks;
            setWeeks(weeksData);

            if (weeksData.length > 0) {
                setSelectedWeek(weeksData[0].weekNumber.toString());
            } else {
                setSelectedWeek('');
            }
        } catch (error) {
            console.error('Error fetching weeks:', error);
            if (error?.response?.status !== 404 && error?.response?.status !== 500) {
                toast.error('Lỗi khi tải danh sách tuần!');
            }
            setWeeks([]);
            setSelectedWeek('');
        }
    };

    // ✅ Fetch certificate data
    const fetchCertificateData = async () => {
        if (!selectedYear || !selectedClass || !selectedWeek) return;

        try {
            setLoading(true);

            // 1. Get students from class
            const studentsRes = await childrenProfileApi.getAll({
                academicYearId: selectedYear,
                classId: selectedClass,
                status: 'Đang học',
                page: 1,
                limit: 1000,
            });

            const studentsData = studentsRes.data.data.profiles;

            // 2. Get certificates
            const certificatesRes = await childrenCertificateApi.getAll({
                academicYearId: selectedYear,
                classId: selectedClass,
                weekNumber: selectedWeek,
                search: searchText,
            });

            const { certificates: certificatesList } = certificatesRes.data.data;

            // 3. Map certificates by studentId
            const certificateMap = {};
            certificatesList.forEach((cert) => {
                certificateMap[cert.studentId._id] = cert;
            });

            setStudents(studentsData);
            setCertificates(certificateMap);

            console.log('✅ Certificate data loaded:', {
                studentsCount: studentsData.length,
                certificatesCount: certificatesList.length,
            });
        } catch (error) {
            console.error('Error fetching certificate data:', error);

            if (error?.response?.status === 404) {
                console.log('⚠️  Class not found - may be switching years');
            } else {
                toast.error('Lỗi khi tải dữ liệu phiếu bé ngoan!');
            }

            setStudents([]);
            setCertificates({});
        } finally {
            setLoading(false);
        }
    };

    // ✅ Load initial data
    useEffect(() => {
        fetchAcademicYears();
    }, []);

    // ✅ When year changes: reload classes and weeks
    useEffect(() => {
        if (selectedYear) {
            setSelectedClass('');
            setSelectedWeek('');
            setStudents([]);
            setCertificates({});

            fetchClasses();
            fetchValidWeeks();
        } else {
            setClasses([]);
            setWeeks([]);
            setSelectedClass('');
            setSelectedWeek('');
            setStudents([]);
            setCertificates({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // ✅ When class/week/search changes: reload certificate data
    useEffect(() => {
        if (selectedYear && selectedClass && selectedWeek && classes.length > 0) {
            const classExists = classes.some((cls) => cls._id === selectedClass);
            if (!classExists) {
                console.log('⚠️  Selected class not in loaded classes');
                return;
            }

            fetchCertificateData();
        } else {
            setStudents([]);
            setCertificates({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedClass, selectedWeek, searchText, classes]);

    // ✅ Format week label
    const formatWeekLabel = (week) => {
        const start = dayjs(week.startDate).format('DD/MM');
        const end = dayjs(week.endDate).format('DD/MM');
        return `Tuần ${week.weekNumber} (${start} - ${end})`;
    };

    // ✅ Handle edit certificate
    const handleEdit = (student) => {
        if (!isActiveYear && !canUpdate) return;

        const certificate = certificates[student._id] || null;

        setDialogData({
            studentInfo: student,
            classId: selectedClass,
            academicYearId: selectedYear,
            weekNumber: parseInt(selectedWeek),
            existingCertificate: certificate,
        });
        setOpenDialog(true);
    };

    // ✅ Filter students by search
    const filteredStudents = students.filter(
        (student) =>
            student.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
            student.studentCode.toLowerCase().includes(searchText.toLowerCase()),
    );

    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[{ text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' }, { text: 'Phiếu bé ngoan' }]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Toolbar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Phiếu bé ngoan
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Search */}
                            <TextField
                                size="small"
                                placeholder="Tìm theo tên, mã HS..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                sx={{ minWidth: 200 }}
                            />

                            {/* Academic Year */}
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                <InputLabel>Năm học</InputLabel>
                                <Select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    label="Năm học"
                                >
                                    {academicYears.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2">
                                                    {year.fromYear}-{year.toYear}
                                                </Typography>
                                                {year.status === 'active' && (
                                                    <DoneOutlinedIcon color="success" fontSize="small" />
                                                )}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Class */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Lớp học</InputLabel>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    label="Lớp học"
                                    disabled={classes.length === 0}
                                >
                                    {classes.map((cls) => (
                                        <MenuItem key={cls._id} value={cls._id}>
                                            {cls.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Week */}
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Tuần</InputLabel>
                                <Select
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    label="Tuần"
                                    disabled={weeks.length === 0}
                                >
                                    {weeks.map((week) => (
                                        <MenuItem key={week.weekNumber} value={week.weekNumber.toString()}>
                                            {formatWeekLabel(week)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Active year indicator */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2 }}>
                            {isActiveYear ? (
                                <strong>Năm học đang hoạt động - Có thể đánh giá</strong>
                            ) : (
                                <strong>Năm học đã kết thúc - Chỉ xem dữ liệu</strong>
                            )}
                        </Alert>
                    )}

                    {/* No classes warning */}
                    {classes.length === 0 && selectedYear && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                            {user?.role === 'to_truong'
                                ? 'Bạn chưa được phân công quản lý khối nào trong năm học này.'
                                : user?.role === 'giao_vien'
                                  ? 'Bạn chưa được phân công làm giáo viên chủ nhiệm lớp nào.'
                                  : 'Chưa có lớp học nào.'}
                        </Alert>
                    )}

                    {/* No valid weeks warning */}
                    {weeks.length === 0 && selectedYear && selectedClass && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
                            Năm học này chưa có tuần hợp lệ (tất cả các tuần đều nghỉ thứ 2-6).
                        </Alert>
                    )}

                    {/* Certificate Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : !selectedYear || !selectedClass || !selectedWeek ? (
                        <Alert severity="info">Vui lòng chọn năm học, lớp học và tuần để xem phiếu bé ngoan.</Alert>
                    ) : (
                        <TableContainer
                            sx={{
                                maxHeight: 450,
                                overflowY: 'auto',
                                overflowX: 'auto',
                                position: 'relative',
                                '&::-webkit-scrollbar': { width: '6px', height: '8px' },
                                '&::-webkit-scrollbar-track': { backgroundColor: '#e3f2fd' },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: '#0964a1a4',
                                    borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#0071BC' },
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            <Table
                                stickyHeader
                                size="small"
                                sx={{
                                    // 💠 HEADER STYLE – giống bảng Đánh giá
                                    '& .MuiTableHead-root .MuiTableCell-head': {
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        fontWeight: 600,
                                        borderBottom: '2px solid #bbdefb',
                                        borderRight: '1px solid #bbdefb',
                                        fontSize: '0.95rem',
                                        textAlign: 'center',
                                        zIndex: 2,
                                    },

                                    // 💠 BODY STYLE
                                    '& .MuiTableBody-root .MuiTableCell-body': {
                                        borderRight: '1px solid #e0e0e0',
                                        borderBottom: '1px solid #f0f0f0',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                        color: '#000',
                                        padding: '6px 8px',
                                        fontSize: '0.9rem',
                                    },

                                    // 💠 ROW HOVER
                                    '& .MuiTableRow-root:hover': {
                                        backgroundColor: '#f5faff',
                                    },

                                    // 💠 FIXED COLUMNS (STT, Họ tên, Mã HS)
                                    '& .MuiTableCell-root': {
                                        '&.sticky-col-stt': {
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 50,
                                            maxWidth: 50,
                                            width: 50,
                                            textAlign: 'center',
                                        },
                                        '&.sticky-col-stt.body-cell': {
                                            backgroundColor: '#fff',
                                            zIndex: 2,
                                        },
                                        '&.sticky-col-name': {
                                            position: 'sticky',
                                            left: 50,
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 160,
                                            maxWidth: 180,
                                            width: 180,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                        '&.sticky-col-name.body-cell': {
                                            backgroundColor: '#fff',
                                            zIndex: 2,
                                            fontWeight: 600,
                                        },
                                        '&.sticky-col-code': {
                                            position: 'sticky',
                                            left: 230, // 50 (STT) + 180 (Name)
                                            zIndex: 3,
                                            backgroundColor: '#e3f2fd',
                                            minWidth: 120,
                                        },
                                        '&.sticky-col-code.body-cell': {
                                            backgroundColor: '#fff',
                                            zIndex: 2,
                                        },
                                    },

                                    borderRadius: 2,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    overflow: 'hidden',
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell className="sticky-col-stt">STT</TableCell>
                                        <TableCell className="sticky-col-name">Họ tên học sinh</TableCell>
                                        <TableCell className="sticky-col-code">Mã học sinh</TableCell>
                                        <TableCell align="center" sx={{ minWidth: 150 }}>
                                            Hoa bé ngoan
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 300 }}>Nhận xét</TableCell>
                                        {isActiveYear && (canCreate || canUpdate) && (
                                            <TableCell align="center" sx={{ width: 100 }}>
                                                Thao tác
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Không có học sinh nào
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStudents.map((student, index) => {
                                            const certificate = certificates[student._id];
                                            const isGoodChild = certificate?.isGoodChild || false;

                                            return (
                                                <TableRow key={student._id} hover>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {student.fullName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {student.studentCode}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Hoa bé ngoan */}
                                                    <TableCell align="center">
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <LocalFloristRoundedIcon
                                                                sx={{
                                                                    fontSize: 28,
                                                                    color: isGoodChild ? '#ff4081' : '#bdbdbd',
                                                                    transition: 'color 0.3s',
                                                                }}
                                                            />
                                                            {/* {isGoodChild && (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: '#ff4081',
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    Bé ngoan
                                                                </Typography>
                                                            )} */}
                                                        </Box>
                                                    </TableCell>

                                                    {/* Nhận xét */}
                                                    <TableCell>
                                                        {certificate?.comment ? (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    whiteSpace: 'pre-line',
                                                                    wordBreak: 'break-word',
                                                                }}
                                                            >
                                                                {certificate.comment}
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                Chưa có nhận xét
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Thao tác */}
                                                    {isActiveYear && (canCreate || canUpdate) && (
                                                        <TableCell align="center">
                                                            <Tooltip
                                                                title={
                                                                    certificate ? 'Chỉnh sửa phiếu' : 'Thêm phiếu mới'
                                                                }
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    color={certificate ? 'primary' : 'default'}
                                                                    onClick={() => handleEdit(student)}
                                                                >
                                                                    <EditOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Legend */}
                    {filteredStudents.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocalFloristRoundedIcon sx={{ fontSize: 20, color: '#ff4081' }} />
                                <Typography variant="caption">Bé ngoan</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocalFloristRoundedIcon sx={{ fontSize: 20, color: '#bdbdbd' }} />
                                <Typography variant="caption">Chưa chọn</Typography>
                            </Box>
                        </Box>
                    )}
                </Paper>
            </PageContainer>

            {/* Dialog đánh giá */}
            {dialogData && (
                <ChildrenCertificateDialog
                    open={openDialog}
                    studentInfo={dialogData.studentInfo}
                    classId={dialogData.classId}
                    academicYearId={dialogData.academicYearId}
                    weekNumber={dialogData.weekNumber}
                    existingCertificate={dialogData.existingCertificate}
                    onClose={() => setOpenDialog(false)}
                    onSuccess={fetchCertificateData}
                />
            )}
        </MainLayout>
    );
}

export default ChildrenCertificate;
