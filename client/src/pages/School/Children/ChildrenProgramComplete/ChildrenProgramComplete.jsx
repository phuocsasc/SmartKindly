/* eslint-disable react-hooks/exhaustive-deps */
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
    Chip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MainLayout from '~/layouts/SchoolLayout';
import PageContainer from '~/components/common/PageContainer';
import PageBreadcrumb from '~/components/common/PageBreadcrumb';
import { useUser } from '~/contexts/UserContext';
import { usePermission } from '~/hooks/usePermission';
import {
    childrenProgramCompleteApi,
    academicYearApi,
    childrenProfileApi,
    childrenDailyAssessmentApi,
    schoolYearTargetApi,
} from '~/apis';
import { PERMISSIONS } from '~/config/rbacConfig';
import { toast } from 'react-toastify';
import ChildrenProgramCompleteDialog from './ChildrenProgramCompleteDialog';
import TargetConfigurationDialog from './TargetConfigurationDialog';

function ChildrenProgramComplete() {
    const { user } = useUser();
    const { hasPermission } = usePermission(user?.role);

    // ✅ State
    const [loading, setLoading] = useState(false);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [activeYearId, setActiveYearId] = useState('');
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [searchText, setSearchText] = useState('');
    const [students, setStudents] = useState([]);
    const [evaluations, setEvaluations] = useState({});
    const [configuredTargets, setConfiguredTargets] = useState({});
    const [targetDetails, setTargetDetails] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfigDialog, setOpenConfigDialog] = useState(false);
    const [dialogData, setDialogData] = useState(null);

    // ✅ Permissions
    const isActiveYear = selectedYear === activeYearId;
    const canCreate = hasPermission(PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE);
    const canUpdate = hasPermission(PERMISSIONS.UPDATE_CHILDREN_PROGRAM_COMPLETE);
    const canConfigure = hasPermission(PERMISSIONS.CREATE_CHILDREN_PROGRAM_COMPLETE) && user?.role === 'ban_giam_hieu';

    // ✅ Get class details for current selection - TRƯỚC KHI SỬ DỤNG
    const currentClass = classes.find((c) => c._id === selectedClass);
    const currentAgeGroup = currentClass?.ageGroup;

    // ✅ Map ageGroup từ class sang configured targets
    const ageGroupMapping = {
        '3-12 tháng': 'Nhà trẻ 3-12 tháng',
        '12-24 tháng': 'Nhà trẻ 12-24 tháng',
        '24-36 tháng': 'Nhà trẻ 24-36 tháng',
        '3-4 tuổi': 'Khối mầm 3-4 tuổi',
        '4-5 tuổi': 'Khối chồi 4-5 tuổi',
        '5-6 tuổi': 'Khối lá 5-6 tuổi',
    };

    const mappedAgeGroup = ageGroupMapping[currentAgeGroup];
    const currentTargetIds = mappedAgeGroup ? configuredTargets[mappedAgeGroup] || [] : [];

    // ✅ Fetch Academic Years
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

    // ✅ Fetch Classes based on role
    const fetchClasses = async (yearId) => {
        if (!yearId) {
            setClasses([]);
            setSelectedClass('');
            return;
        }

        try {
            const res = await childrenDailyAssessmentApi.getAccessibleClasses(yearId);
            setClasses(res.data.data.classes || []);

            // ✅ FIX: Reset selectedClass khi đổi năm học
            if (res.data.data.classes?.length > 0) {
                setSelectedClass(res.data.data.classes[0]._id);
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

    // ✅ Fetch Configured Targets
    const fetchConfiguredTargets = async (yearId) => {
        if (!yearId) return;

        try {
            const res = await childrenProgramCompleteApi.getConfigByYear(yearId);
            const targetMap = {};
            res.data.data.configs.forEach((config) => {
                targetMap[config.ageGroup] = config.selectedTargetIds || [];
            });
            setConfiguredTargets(targetMap);
        } catch (error) {
            console.error('Error fetching configured targets:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải cấu hình!');
        }
    };

    // ✅ Fetch Target Details
    const fetchTargetDetails = async (targetIds) => {
        if (!targetIds || targetIds.length === 0 || !mappedAgeGroup) return;

        try {
            const res = await schoolYearTargetApi.getAll({
                page: 1,
                limit: 100,
                academicYearId: selectedYear,
                ageGroup: mappedAgeGroup,
            });

            const targets = res.data.data.targets[0];
            if (!targets) return;

            const details = {};
            let mtNumber = 1;

            const processTargets = (mainFields) => {
                mainFields.forEach((mainField) => {
                    if (mainField.subFields && mainField.subFields.length > 0) {
                        mainField.subFields.forEach((subField) => {
                            subField.expectedResults?.forEach((expectedResult) => {
                                expectedResult.targets?.forEach((target) => {
                                    details[String(target._id)] = {
                                        code: `MT${mtNumber}`,
                                        content: target.content,
                                    };
                                    mtNumber++;
                                });
                            });
                        });
                    } else {
                        mainField.expectedResults?.forEach((expectedResult) => {
                            expectedResult.targets?.forEach((target) => {
                                details[String(target._id)] = {
                                    code: `MT${mtNumber}`,
                                    content: target.content,
                                };
                                mtNumber++;
                            });
                        });
                    }
                });
            };

            if (targets.mainFields) {
                processTargets(targets.mainFields);
            }

            setTargetDetails(details);
        } catch (error) {
            console.error('Error fetching target details:', error);
        }
    };

    // ✅ Fetch Students & Evaluations
    const fetchStudentsAndEvaluations = async () => {
        if (!selectedYear || !selectedClass) {
            setStudents([]);
            setEvaluations({});
            return;
        }

        try {
            setLoading(true);

            const studentsRes = await childrenProfileApi.getAll({
                page: 1,
                limit: 1000,
                academicYearId: selectedYear,
                classId: selectedClass,
                status: 'Đang học',
                search: searchText,
            });

            const studentList = studentsRes.data.data.profiles || [];
            setStudents(studentList);

            if (!selectedClass) return;

            const evalsRes = await childrenProgramCompleteApi.getAll({
                page: 1,
                limit: 1000,
                academicYearId: selectedYear,
                classId: selectedClass,
            });

            const evaluationList = evalsRes.data.data.items || [];
            const evalMap = {};
            evaluationList.forEach((evaluationItem) => {
                evalMap[evaluationItem.studentId._id] = evaluationItem;
            });

            setEvaluations(evalMap);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Get target counts
    const getTargetCounts = (evaluation) => {
        if (!evaluation) return { achieved: 0, notAchieved: 0, total: currentTargetIds.length };

        const achieved = evaluation.assessmentDetails.filter(
            (d) => d.status === 'Đạt' && currentTargetIds.includes(String(d.targetId)),
        ).length;

        const notAchieved = evaluation.assessmentDetails.filter(
            (d) => d.status === 'Chưa đạt' && currentTargetIds.includes(String(d.targetId)),
        ).length;

        return { achieved, notAchieved, total: currentTargetIds.length };
    };

    // ✅ Handle Open Dialog
    const handleOpenDialog = (student, evaluation = null) => {
        if (!isActiveYear && !evaluation) {
            toast.warning('Chỉ có thể đánh giá trong năm học đang hoạt động!');
            return;
        }

        setDialogData({
            student,
            evaluation,
            classId: selectedClass,
            academicYearId: selectedYear,
        });
        setOpenDialog(true);
    };

    // ✅ Handle Config Dialog
    const handleOpenConfigDialog = () => {
        if (!isActiveYear) {
            toast.warning('Chỉ có thể cấu hình trong năm học đang hoạt động!');
            return;
        }
        setOpenConfigDialog(true);
    };

    // ✅ UseEffects
    useEffect(() => {
        setSelectedClass('');
        fetchAcademicYears();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            setSelectedClass(''); // ✅ Reset selectedClass trước
            fetchClasses(selectedYear);
            fetchConfiguredTargets(selectedYear);
        }
    }, [selectedYear]);

    useEffect(() => {
        if (selectedYear && selectedClass && searchText !== undefined) {
            fetchStudentsAndEvaluations();
        }
    }, [selectedYear, selectedClass, searchText]);

    useEffect(() => {
        if (currentTargetIds.length > 0 && selectedYear && mappedAgeGroup) {
            fetchTargetDetails(currentTargetIds);
        }
    }, [currentTargetIds, selectedYear, mappedAgeGroup]);
    // ✅ Render
    return (
        <MainLayout user={user}>
            <PageContainer>
                <PageBreadcrumb
                    items={[
                        { text: 'Quản lý trẻ em', icon: PeopleIcon, href: '#' },
                        { text: 'Đánh giá trẻ hoàn thành chương trình' },
                    ]}
                />

                <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Đánh giá trẻ hoàn thành chương trình
                        </Typography>

                        {canConfigure && (
                            <Tooltip title="Cấu hình mục tiêu">
                                <IconButton
                                    color="primary"
                                    onClick={handleOpenConfigDialog}
                                    sx={{
                                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' },
                                    }}
                                >
                                    <SettingsOutlinedIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="Tìm theo tên, mã HS..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{ minWidth: 200 }}
                        />

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Năm học</InputLabel>
                            <Select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                label="Năm học"
                            >
                                {academicYears.map((year) => (
                                    <MenuItem key={year._id} value={year._id}>
                                        {year.fromYear} - {year.toYear}{' '}
                                        {year.status === 'active' ? '(Đang hoạt động)' : '(Đã kết thúc)'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Lớp học</InputLabel>
                            <Select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                label="Lớp học"
                            >
                                {classes.map((cls) => (
                                    <MenuItem key={cls._id} value={cls._id}>
                                        {cls.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Status Alert */}
                    {selectedYear && (
                        <Alert severity={isActiveYear ? 'success' : 'warning'} sx={{ mb: 2 }}>
                            {isActiveYear
                                ? 'Năm học đang hoạt động - Có thể đánh giá'
                                : 'Năm học đã kết thúc - Chỉ xem dữ liệu'}
                        </Alert>
                    )}

                    {/* No targets warning */}
                    {currentTargetIds.length === 0 && selectedClass && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Chưa cấu hình mục tiêu đánh giá cho nhóm tuổi "{currentAgeGroup}"
                        </Alert>
                    )}

                    {/* No classes warning */}
                    {classes.length === 0 && selectedYear && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {user?.role === 'to_truong'
                                ? 'Bạn chưa được phân công quản lý khối nào'
                                : 'Chưa có lớp học nào'}
                        </Alert>
                    )}

                    {/* Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : students.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                {selectedClass ? 'Không có học sinh nào' : 'Vui lòng chọn lớp học'}
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                                        <TableCell sx={{ fontWeight: 700, minwidth: 50 }}>STT</TableCell>
                                        <TableCell sx={{ fontWeight: 700, minwidth: 100 }}>Họ tên học sinh</TableCell>
                                        <TableCell sx={{ fontWeight: 700, minwidth: 120 }}>Mã học sinh</TableCell>

                                        <TableCell align="center" sx={{ fontWeight: 700, minwidth: 70 }}>
                                            Đạt
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, minwidth: 70 }}>
                                            Chưa đạt
                                        </TableCell>

                                        {currentTargetIds.length > 0 &&
                                            currentTargetIds.map((targetId, idx) => {
                                                const targetInfo = targetDetails[String(targetId)];
                                                const mtCode = targetInfo?.code || `MT${idx + 1}`;

                                                return (
                                                    <TableCell
                                                        key={targetId}
                                                        align="center"
                                                        sx={{ fontWeight: 700, minwidth: 60 }}
                                                    >
                                                        <Tooltip title={targetInfo?.content || `Mục tiêu ${mtCode}`}>
                                                            <span>{mtCode}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                );
                                            })}

                                        {isActiveYear && (canCreate || canUpdate) && (
                                            <TableCell align="center" sx={{ fontWeight: 700, minwidth: 100 }}>
                                                Thao tác
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {students.map((student, idx) => {
                                        const evaluation = evaluations[student._id];
                                        const counts = getTargetCounts(evaluation);

                                        return (
                                            <TableRow key={student._id} hover>
                                                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>{student.fullName}</TableCell>
                                                <TableCell>{student.studentCode}</TableCell>

                                                <TableCell align="center">
                                                    <Chip
                                                        label={counts.achieved}
                                                        size="small"
                                                        color="success"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={counts.notAchieved}
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                    />
                                                </TableCell>

                                                {currentTargetIds.length > 0 &&
                                                    currentTargetIds.map((targetId) => {
                                                        const assessment = evaluation?.assessmentDetails?.find(
                                                            (a) => String(a.targetId) === String(targetId),
                                                        );
                                                        const status = assessment?.status || 'Chưa đánh giá';

                                                        const colorMap = {
                                                            'Chưa đánh giá': '#9e9e9e',
                                                            Đạt: '#ffc107',
                                                            'Chưa đạt': '#4caf50',
                                                        };

                                                        return (
                                                            <TableCell
                                                                key={`${student._id}-${targetId}`}
                                                                align="center"
                                                            >
                                                                <Tooltip title={status}>
                                                                    <EmojiEventsOutlinedIcon
                                                                        sx={{
                                                                            fontSize: 24,
                                                                            color: colorMap[status],
                                                                            cursor:
                                                                                isActiveYear && (canCreate || canUpdate)
                                                                                    ? 'pointer'
                                                                                    : 'default',
                                                                        }}
                                                                        onClick={() => {
                                                                            if (
                                                                                isActiveYear &&
                                                                                (canCreate || canUpdate)
                                                                            ) {
                                                                                handleOpenDialog(student, evaluation);
                                                                            }
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            </TableCell>
                                                        );
                                                    })}

                                                {isActiveYear && (canCreate || canUpdate) && (
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            color={evaluation ? 'primary' : 'default'}
                                                            onClick={() => handleOpenDialog(student, evaluation)}
                                                        >
                                                            <EditOutlinedIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </PageContainer>

            {/* Dialog */}
            {dialogData && (
                <ChildrenProgramCompleteDialog
                    open={openDialog}
                    data={dialogData}
                    targets={currentTargetIds}
                    ageGroup={mappedAgeGroup} // ⭐ GỬI NHÓM TUỔI CHUẨN
                    onClose={() => {
                        setOpenDialog(false);
                        setDialogData(null);
                    }}
                    onSuccess={() => {
                        setOpenDialog(false);
                        setDialogData(null);
                        fetchStudentsAndEvaluations();
                    }}
                />
            )}

            {/* Config Dialog */}
            <TargetConfigurationDialog
                open={openConfigDialog}
                academicYearId={selectedYear}
                onClose={() => setOpenConfigDialog(false)}
                onSuccess={() => {
                    setOpenConfigDialog(false);
                    fetchConfiguredTargets(selectedYear);
                }}
            />
        </MainLayout>
    );
}

export default ChildrenProgramComplete;
