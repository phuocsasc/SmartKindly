// server/src/services/chatbotServices.js

import OpenAI from 'openai';
import { env } from '~/config/environment';
import { ChatbotConversationModel } from '~/models/chatbotModel.js';
import { parentChildrenServices } from '~/services/parentChildrenServices.js';
import ApiError from '~/utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';

// ✅ TIMEZONE CONFIG
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

// ✅ ÉP MẶC ĐỊNH LÀ GIỜ VIỆT NAM
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

/**
 * Helper: Format thực đơn tuần
 */
const formatMenuForAI = (menuSnapshot) => {
    if (!menuSnapshot || !menuSnapshot.meals) return 'Không có dữ liệu';
    const formattedMeals = [];
    Object.entries(menuSnapshot.meals).forEach(([mealTime, dishes]) => {
        if (Array.isArray(dishes) && dishes.length > 0) {
            const dishNames = dishes.map((d) => d.name).join(', ');
            formattedMeals.push(`${mealTime}: ${dishNames}`);
        }
    });
    return formattedMeals.join('; ');
};

/**
 * Helper: Format Hoạt động Cả Tuần (Tóm tắt)
 */
const formatWeeklyPlanSummary = (weeklyPlanObj) => {
    if (!weeklyPlanObj) return 'Chưa có kế hoạch tuần này';
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

    let summary = [];
    if (weeklyPlanObj.topic) summary.push(`Chủ đề tuần: ${weeklyPlanObj.topic}`);

    days.forEach((dayKey, index) => {
        const activities = weeklyPlanObj[dayKey];
        if (activities && activities.length > 0) {
            const mainActs = activities.map((a) => a.description).join(', ');
            summary.push(`${dayNames[index]}: ${mainActs}`);
        }
    });
    return summary.length > 1 ? summary.join('\n') : 'Chưa có chi tiết hoạt động các ngày.';
};

/**
 * ✅ Helper: Format Hoạt động Chi tiết 1 ngày
 */
const formatDailyPlanForAI = (weeklyPlanObj, targetDate) => {
    if (!weeklyPlanObj) return 'Chưa có kế hoạch tuần này';
    const dayIndex = targetDate.day();
    const daysMap = [null, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', null];
    const dayKey = daysMap[dayIndex];

    if (!dayKey) return 'Hôm nay là cuối tuần, bé nghỉ học.';
    const activities = weeklyPlanObj[dayKey];
    if (!activities || activities.length === 0) return 'Chưa có cập nhật hoạt động ngày này.';

    return activities
        .map((act) => {
            let content = ` **${act.startTime} - ${act.endTime}**: ${act.description}`;
            if (act.detailedContent && act.detailedContent.trim() !== '') {
                content += `\n   - *Chi tiết*: ${act.detailedContent}`;
            }
            return content;
        })
        .join('\n');
};

/**
 * ✅ Helper Mới: Format Chi tiết TOÀN BỘ TUẦN (Cho câu hỏi "thời khóa biểu chi tiết tuần này")
 */
const formatFullWeekPlanDetail = (weeklyPlanObj) => {
    if (!weeklyPlanObj) return 'Chưa có kế hoạch tuần này';
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

    let result = [];
    if (weeklyPlanObj.topic) result.push(`**Hoạt động tuần: ${weeklyPlanObj.topic}**`);

    days.forEach((dayKey, index) => {
        const activities = weeklyPlanObj[dayKey];
        if (activities && activities.length > 0) {
            const dayDetail = activities
                .map((act) => {
                    let content = `   - ${act.startTime}-${act.endTime}: ${act.description}`;
                    if (act.detailedContent) content += ` (${act.detailedContent})`;
                    return content;
                })
                .join('\n');
            result.push(`**${dayNames[index]}**:\n${dayDetail}`);
        }
    });
    return result.join('\n\n');
};

/**
 * 🧠 1. AI TIME DETECT (NÂNG CẤP MẠNH MẼ)
 * - Truyền danh sách ngày cụ thể trong tuần để AI chọn, tránh tính toán sai.
 */
const detectTargetDate = async (userMessage, todayDateStr) => {
    try {
        // ✅ FIX: Dùng timezone Việt Nam
        const today = dayjs.tz(todayDateStr, 'Asia/Ho_Chi_Minh');
        const startOfWeek = today.startOf('isoWeek'); // Thứ 2

        // Tạo map ngày trong tuần hiện tại
        const weekDates = {};
        for (let i = 0; i < 7; i++) {
            const d = startOfWeek.add(i, 'day');
            const dayName = i === 6 ? 'Chủ Nhật' : `Thứ ${i + 2}`;
            weekDates[dayName] = d.format('YYYY-MM-DD');
        }

        const prompt = `
            Hôm nay là: ${todayDateStr} (${Object.keys(weekDates).find((k) => weekDates[k] === todayDateStr)}).
            Câu nói: "${userMessage}"
            
            LỊCH TUẦN NÀY (Để tra cứu):
            ${JSON.stringify(weekDates, null, 2)}
            
            NHIỆM VỤ: Trả về NGÀY MỤC TIÊU (YYYY-MM-DD).
            
            QUY TẮC:
            1. "hôm qua" = ${today.subtract(1, 'day').format('YYYY-MM-DD')}.
            2. "ngày mai" = ${today.add(1, 'day').format('YYYY-MM-DD')}.
            3. "Thứ X tuần này" / "Thứ X" (nếu không nói rõ tuần) -> Lấy ngày tương ứng trong LỊCH TUẦN NÀY ở trên.
            4. "Thứ X tuần trước" -> Lấy ngày trong LỊCH trên TRỪ đi 7 ngày.
            5. "Thứ X tuần sau" -> Lấy ngày trong LỊCH trên CỘNG thêm 7 ngày.
            6. "hôm nay", "ngày nay", "bữa nay" -> Trả về ${todayDateStr}.
            7. "ngày X/Y" hoặc "X/Y" -> Parse thành YYYY-MM-DD (năm hiện tại nếu không có).
            
            CHỈ TRẢ VỀ CHUỖI NGÀY (YYYY-MM-DD).
        `;

        const chat = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
        });

        const dateStr = chat.choices[0].message.content.trim();
        console.log('🕰️ [AI Detect Date]:', { userMessage, detected: dateStr, today: todayDateStr });

        // Validate date
        return dayjs(dateStr, 'YYYY-MM-DD', true).isValid() ? dateStr : todayDateStr;
    } catch (error) {
        console.error('❌ [detectTargetDate] Error:', error);
        return todayDateStr;
    }
};

/**
 * 🧠 2. AI ACADEMIC YEAR DETECT
 */
const detectAcademicYear = async (userMessage, academicYears, activeYearId) => {
    const yearKeywords = ['năm ngoái', 'năm trước', '2023', '2024', '2025', '2026'];
    if (!yearKeywords.some((kw) => userMessage.toLowerCase().includes(kw))) return activeYearId;

    try {
        const yearsInfo = academicYears.map((y) => `ID: ${y._id}, Năm: ${y.fromYear}-${y.toYear}`).join('\n');
        const prompt = `
            Danh sách năm: \n${yearsInfo}\n
            Năm active: ${activeYearId}. Câu hỏi: "${userMessage}"
            Tìm ID năm học phù hợp. Nếu không rõ trả về ID active. CHỈ TRẢ VỀ ID.
        `;
        const chat = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
        });
        const selectedId = chat.choices[0].message.content.trim();
        return academicYears.some((y) => y._id.toString() === selectedId) ? selectedId : activeYearId;
    } catch {
        return activeYearId;
    }
};

// ... (createConversation, getAllConversations, getConversationDetails giữ nguyên) ...
const createConversation = async (userId) => {
    try {
        const childrenInfo = await parentChildrenServices.getChildrenInfo(userId);
        const schoolInfo = await parentChildrenServices.getSchoolInfo(userId);
        return await ChatbotConversationModel.create({
            schoolId: schoolInfo.schoolId,
            userId: userId,
            studentId: childrenInfo.student._id,
            conversationName: `Tư vấn cho bé ${childrenInfo.student.fullName}`,
            messages: [],
        });
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Lỗi khi khởi tạo phiên tư vấn');
    }
};

const getAllConversations = async (userId) => {
    return await ChatbotConversationModel.find({ userId, _destroy: false })
        .select('-messages')
        .sort({ lastMessageAt: -1 })
        .lean();
};

const getConversationDetails = async (conversationId, userId) => {
    const conversation = await ChatbotConversationModel.findOne({
        _id: conversationId,
        userId,
        _destroy: false,
    }).lean();
    if (!conversation) throw new ApiError(StatusCodes.NOT_FOUND, 'Phiên trò chuyện không tồn tại');
    return conversation;
};

/**
 * ✅ 4. SEND MESSAGE (FULL UPDATE - FIX TIME & DETAIL)
 */
const sendMessage = async (conversationId, message, userId) => {
    try {
        console.log('----------------------------------------------------------------');
        console.log(`📩 [Chatbot] User: ${userId} | Msg: "${message}"`);

        const conversation = await ChatbotConversationModel.findOne({ _id: conversationId, userId, _destroy: false });
        if (!conversation) throw new ApiError(StatusCodes.NOT_FOUND, 'Phiên trò chuyện không hợp lệ');

        // B1: Dữ liệu cơ bản
        const [school, childrenInfo, academicYearsData] = await Promise.all([
            parentChildrenServices.getSchoolInfo(userId),
            parentChildrenServices.getChildrenInfo(userId),
            parentChildrenServices.getAcademicYears(userId),
        ]);

        const { academicYears, activeYearId } = academicYearsData;
        const student = childrenInfo.student;

        // B2: Detect Năm & Lớp
        const selectedYearId = await detectAcademicYear(message, academicYears, activeYearId);
        const selectedYearInfo = academicYears.find((y) => y._id.toString() === selectedYearId.toString());

        let targetClass = null;
        if (selectedYearId === activeYearId) {
            targetClass = childrenInfo.currentClass;
        } else {
            const classesInYear = await parentChildrenServices.getStudentClassesByYear(selectedYearId, userId);
            targetClass = classesInYear.classes?.[0] || null;
        }

        // B3: Detect Thời gian - ✅ FIX: Dùng timezone VN
        const today = dayjs().tz('Asia/Ho_Chi_Minh');
        const todayDateStr = today.format('YYYY-MM-DD');
        const targetDateStr = await detectTargetDate(message, todayDateStr);
        const targetDate = dayjs.tz(targetDateStr, 'YYYY-MM-DD', 'Asia/Ho_Chi_Minh');
        console.log(
            `🕰️ [Time]: Focus ${targetDateStr} | Year: ${selectedYearInfo.fromYear}-${selectedYearInfo.toYear}`,
        );

        // B4: Tìm tuần & LẤY NGÀY BẮT ĐẦU/KẾT THÚC CỦA TUẦN
        const scheduleData = await parentChildrenServices.getScheduleWeeks(selectedYearId, userId);
        let weeks = scheduleData.weeks || [];
        // Sắp xếp tuần tăng dần để tìm chính xác
        weeks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        let targetWeekObj = weeks.find((w) => {
            const start = dayjs(w.startDate).startOf('day');
            const end = dayjs(w.endDate).endOf('day');
            return targetDate.isBetween(start, end, null, '[]');
        });
        if (!targetWeekObj && weeks.length > 0) targetWeekObj = weeks[weeks.length - 1];

        const targetWeekNumber = targetWeekObj ? targetWeekObj.weekNumber : 1;
        const targetWeekStart = targetWeekObj ? dayjs(targetWeekObj.startDate).format('DD/MM/YYYY') : 'N/A';
        const targetWeekEnd = targetWeekObj ? dayjs(targetWeekObj.endDate).format('DD/MM/YYYY') : 'N/A';

        console.log(`📅 [Context]: Week ${targetWeekNumber} (${targetWeekStart} - ${targetWeekEnd})`);

        // B5: Truy xuất dữ liệu
        const [attendance, dailyAssessment, menu, weeklyCert, weeklyPlan, completionAssessment] = await Promise.all([
            targetClass
                ? parentChildrenServices.getAttendance(selectedYearId, targetClass._id, targetWeekNumber, userId)
                : null,
            targetClass
                ? parentChildrenServices.getDailyAssessment(selectedYearId, targetClass._id, targetWeekNumber, userId)
                : null,
            targetClass
                ? parentChildrenServices.getWeeklyMenu(selectedYearId, targetClass._id, targetWeekNumber, userId)
                : null,
            targetClass
                ? parentChildrenServices.getWeeklyCertificate(selectedYearId, targetClass._id, targetWeekNumber, userId)
                : null,
            targetClass
                ? parentChildrenServices.getWeeklyPlan(selectedYearId, targetClass._id, targetWeekNumber, userId)
                : null,
            targetClass
                ? parentChildrenServices.getCompletionAssessment(selectedYearId, targetClass._id, userId)
                : null,
        ]);

        // B6: Context
        const contextData = {
            meta: {
                focus_date: targetDate.format('DD/MM/YYYY'),
                focus_day: `Thứ ${targetDate.day() + 1}`,
                selected_year: `${selectedYearInfo.fromYear}-${selectedYearInfo.toYear}`,
                focus_week_number: targetWeekNumber,
                focus_week_range: `${targetWeekStart} đến ${targetWeekEnd}`,
            },
            school_info: {
                // ✅ CHỈ 3 FIELD CƠ BẢN
                name: school.name || 'Chưa cập nhật',
                manager: school.manager || 'Chưa cập nhật',
                address: school.address || 'Chưa cập nhật',
                // ✅ REMOVE: phone, email, website, establishmentDate, etc.
            },
            student_info: {
                full_name: student.fullName,
                student_code: student.studentCode,
                gender: student.gender,
                birth_date: dayjs(student.birthDate).format('DD/MM/YYYY'),
                age_group: student.currentAgeGroup,
                ethnicity: student.ethnicity,
            },
            class_info: {
                class_name: targetClass?.name || 'Không tìm thấy dữ liệu lớp',
                homeroom_teacher: targetClass?.homeRoomTeacher?.fullName || 'Chưa cập nhật',
                // ✅ ADD: Thêm thống kê học sinh
                total_students: childrenInfo.currentClass?.totalStudents || 0,
                male_count: childrenInfo.currentClass?.maleCount || 0,
                female_count: childrenInfo.currentClass?.femaleCount || 0,
            },
            schedule: {
                weekly_summary: formatWeeklyPlanSummary(weeklyPlan?.weeklyPlan),
                daily_detail: formatDailyPlanForAI(weeklyPlan?.weeklyPlan, targetDate),
                // ✅ THÊM: Chi tiết toàn bộ tuần cho câu hỏi "Chi tiết hoạt động trong tuần"
                full_week_detail: formatFullWeekPlanDetail(weeklyPlan?.weeklyPlan),
            },
            menu: {
                target_day_menu: menu?.menuApplies?.find((m) => dayjs(m.date).isSame(targetDate, 'day'))?.menuSnapshot
                    ? formatMenuForAI(
                          menu.menuApplies.find((m) => dayjs(m.date).isSame(targetDate, 'day')).menuSnapshot,
                      )
                    : 'Chưa có thực đơn ngày này',
                // ✅ ADD: Full week menu with dates
                full_week_menus:
                    menu?.menuApplies?.map((m) => ({
                        date: dayjs(m.date).format('DD/MM/YYYY'),
                        day_of_week: m.dayOfWeek,
                        meals: formatMenuForAI(m.menuSnapshot),
                    })) || [],
            },
            attendance: {
                // ✅ WEEKLY STATS
                total_days_in_week: attendance?.days?.length || 5,
                present_count_week: attendance?.presentInWeek || 0,
                absent_count_week: attendance?.absentInWeek || 0,
                not_yet_marked_week:
                    (attendance?.days?.length || 5) -
                    (attendance?.presentInWeek || 0) -
                    (attendance?.absentInWeek || 0),

                // ✅ YEARLY STATS (ADD)
                present_count_year: attendance?.totalPresentInYear || 0,
                absent_count_year: attendance?.totalAbsentInYear || 0,
                total_marked_year: attendance?.totalMarkedInYear || 0,

                // ✅ TODAY & DETAILS
                status_today: attendance?.attendanceMap?.[targetDateStr]?.status || 'Chưa có dữ liệu ngày này',
                daily_details: attendance?.attendanceMap
                    ? Object.entries(attendance.attendanceMap)
                          .map(([date, info]) => `${dayjs(date).format('DD/MM')} (${info.status})`)
                          .join(', ')
                    : 'Không có dữ liệu',
            },
            daily_assessment: dailyAssessment?.assessmentMap?.[targetDateStr] || 'Chưa có nhận xét ngày này',
            weekly_certificate: weeklyCert?.certificate
                ? { isGood: weeklyCert.certificate.isGoodChild, note: weeklyCert.certificate.comment }
                : 'Chưa có phiếu bé ngoan',
            // ✅ ADD: COMPLETION ASSESSMENT (Đánh giá hoàn thành chương trình)
            completion_assessment: (() => {
                if (!completionAssessment?.evaluation) {
                    return 'Chưa có đánh giá hoàn thành chương trình cho năm học này';
                }

                const evaluation = completionAssessment.evaluation;
                const targetDetails = completionAssessment.targetDetails || {};

                // Calculate statistics
                const totalTargets = evaluation.assessmentDetails.length;
                const passedTargets = evaluation.assessmentDetails.filter((d) => d.score >= 5).length;
                const failedTargets = totalTargets - passedTargets;
                const averageScore =
                    totalTargets > 0
                        ? (evaluation.assessmentDetails.reduce((sum, d) => sum + d.score, 0) / totalTargets).toFixed(1)
                        : 0;

                // Format target details
                const targetsList = evaluation.assessmentDetails.map((detail) => {
                    const target = targetDetails[String(detail.targetId)];
                    const isPassed = detail.score >= 5;
                    return {
                        code: target?.code || 'N/A',
                        content: target?.content || 'N/A',
                        score: detail.score,
                        status: isPassed ? 'Đạt' : 'Chưa đạt',
                    };
                });

                return {
                    has_evaluation: true,
                    academic_year: `${selectedYearInfo.fromYear}-${selectedYearInfo.toYear}`,
                    class_name: completionAssessment.classData?.name || 'N/A',
                    student_name: completionAssessment.student?.fullName || student.fullName,
                    statistics: {
                        total_targets: totalTargets,
                        passed: passedTargets,
                        failed: failedTargets,
                        average_score: parseFloat(averageScore),
                    },
                    targets: targetsList,
                    teacher_note: evaluation.note || 'Không có nhận xét',
                    created_by: evaluation.createdBy?.fullName || 'N/A',
                    created_at: evaluation.createdAt ? dayjs(evaluation.createdAt).format('DD/MM/YYYY') : 'N/A',
                    updated_at: evaluation.updatedAt ? dayjs(evaluation.updatedAt).format('DD/MM/YYYY') : 'N/A',
                };
            })(),
        };

        // B7: SYSTEM PROMPT
        const systemPrompt = `
            Bạn là SmartKindly AI - Trợ lý thông minh cho phụ huynh trường mầm non:
            
            1. DỮ LIỆU ĐANG XÉT:
            - **Ngày trọng tâm**: ${contextData.meta.focus_date} (${contextData.meta.focus_day})
            - **Tuần trọng tâm**: Tuần ${contextData.meta.focus_week_number} (${contextData.meta.focus_week_range})
            - **Năm học**: ${contextData.meta.selected_year}
            
            **Dữ liệu chi tiết:**
            ${JSON.stringify(contextData, null, 2)}

            2. QUY TẮC TRẢ LỜI:
            **Nguyên tắc chung:**
            - Trả lời bằng **Markdown**.
            - Luôn ghi rõ **ngày/tháng/năm** và **tuần** khi đề cập đến thời gian.
            - Nếu dữ liệu = \`null\`, \`"Chưa có..."\`, hoặc \`[]\` → Trả lời: **"Chưa có dữ liệu cho [ngày/tuần] này."**
            
            **Xử lý câu hỏi tiếp nối (Context-Aware)**
            **QUAN TRỌNG:** Dựa vào **6 tin nhắn cuối** trong lịch sử để hiểu ngữ cảnh.

            **Ví dụ:**
            - **User (câu 1):** "tuần nay bé có phiếu bé ngoan không"
            → **AI:** "Tuần 23, bé đạt Bé Ngoan. Nhận xét: ..."
            - **User (câu 2):** "còn tuần trước thì sao"
            → **AI PHẢI HIỂU:** "còn **phiếu bé ngoan** tuần trước thì sao"
            → **AI TRA CỨU:** Dữ liệu \`weekly_certificate\` của tuần ${contextData.meta.focus_week_number} (đã được backend fetch)
            → **AI TRẢ LỜI:** "Tuần ${contextData.meta.focus_week_number}, bé ${contextData.weekly_certificate?.isGood ? 'đạt Bé Ngoan' : 'chưa đạt Bé Ngoan'}. Nhận xét: ${contextData.weekly_certificate?.note || 'Không có'}."

            **Rule:**
            - Nếu câu hỏi **không có từ khóa rõ ràng** (ví dụ: "còn tuần trước thì sao", "vậy thứ 3 thì sao") → Dùng **chủ đề của câu hỏi trước** (điểm danh / phiếu bé ngoan / thực đơn / đánh giá hằng ngày/ các hoạt động ...).
            - Backend ĐÃ TỰ ĐỘNG FETCH dữ liệu đúng tuần/ngày → AI CHỈ CẦN ĐỌC VÀ TRẢ LỜI.

            ---

            ### 3. **Xử lý từng loại thông tin**
            **Xử lý câu hỏi theo thời gian:**
            - **"hôm nay"** → Dùng dữ liệu của \`meta.focus_date\` (${contextData.meta.focus_date})
            - **"tuần này"** → Dùng dữ liệu của \`meta.focus_week_number\` (Tuần ${contextData.meta.focus_week_number})
            - **"tuần trước"** / **"tuần sau"** → Backend đã tự động detect đúng tuần, dùng dữ liệu trong \`contextData\`
            - **"năm nay"** → Dùng dữ liệu yearly từ \`attendance.present_count_year\`, \`attendance.absent_count_year\`
            - **"ngày X/Y"** / **"Thứ X tuần Y"** → Backend đã detect, dùng dữ liệu tương ứng
            
            - **Xử lý Thông tin Trường học:**
              + CHỈ cung cấp 3 thông tin: **Tên trường** ('school_info.name'), **Hiệu trưởng** ('school_info.manager'), **Địa chỉ** ('school_info.address').
              + KHÔNG cung cấp số điện thoại, email, website, ngày thành lập.
              + **Ví dụ trả lời:** "Trường của bé là **${contextData.school_info.name}**, do Hiệu trưởng **${contextData.school_info.manager}** quản lý, địa chỉ tại **${contextData.school_info.address}**."

            - **Xử lý Thông tin Lớp học:**
              + Dùng 'class_info.class_name' để biết **tên lớp**.
              + Dùng 'class_info.homeroom_teacher' để biết **GVCN**.
              + Dùng 'class_info.total_students' để biết **tổng số học sinh**.
              + Dùng 'class_info.male_count' và 'class_info.female_count' để biết **số học sinh nam/nữ**.
              + **Ví dụ trả lời:** "Bé đang học lớp **${contextData.class_info.class_name}** với GVCN là **${contextData.class_info.homeroom_teacher}**. Lớp có **${contextData.class_info.total_students}** học sinh (${contextData.class_info.male_count} bé trai, ${contextData.class_info.female_count} bé gái)."

            - **Xử lý Điểm danh:**
              + **A. TRONG TUẦN:**
                * Dùng 'attendance.present_count_week' → Số buổi đã đi học trong tuần.
                * Dùng 'attendance.absent_count_week' → Số buổi vắng trong tuần.
                * Dùng 'attendance.not_yet_marked_week' → Số ngày chưa điểm danh trong tuần.

              + **B. TRONG NĂM:**
                * Dùng 'attendance.present_count_year' → Tổng số buổi đã đi học trong năm ${contextData.meta.selected_year}.
                * Dùng 'attendance.absent_count_year' → Tổng số buổi vắng trong năm ${contextData.meta.selected_year}.
                * Dùng 'attendance.total_marked_year' → Tổng số buổi đã điểm danh trong năm.
              
              + **C. HÔM NAY:**
                * Dùng 'attendance.status_today' → Trạng thái điểm danh ngày ${contextData.meta.focus_date}.
              
              + **CHI TIẾT TUẦN:**
                * Dùng 'attendance.daily_details' → Liệt kê từng ngày trong tuần.
              
              + **Ví dụ trả lời:**
                - "Trong tuần ${targetWeekNumber}, bé đã đi học 4/5 buổi. Thứ 6 chưa điểm danh."
                - "Trong năm học ${contextData.meta.selected_year}, bé đã đi học **100 buổi** và vắng **5 buổi** (3 có phép, 2 không phép)."
                - "Hôm nay (${contextData.meta.focus_date}), bé có mặt."

            - **Xử lý Thời khóa biểu/Hoạt động:**
              + Nếu hỏi "chi tiết hôm nay": Dùng 'schedule.daily_detail'.
              + Nếu hỏi "chi tiết cả tuần/trong tuần": Dùng 'schedule.full_week_detail'.
              + Nếu hỏi "tóm tắt tuần": Dùng 'schedule.weekly_summary'.

            - **Xử lý Thực đơn:**
              + **HÔM NAY:** Dùng 'menu.target_day_menu' → Thực đơn ngày ${contextData.meta.focus_date}.
              + **CẢ TUẦN:** Dùng 'menu.full_week_menus' → Liệt kê thực đơn từng ngày trong tuần ${targetWeekNumber}.
              + **Ví dụ trả lời:**
                - "Hôm nay (${contextData.meta.focus_date}), bé ăn: Bữa sáng: Cháo tôm, Bữa trưa: Cơm gà..."
                - "Thực đơn tuần ${targetWeekNumber}: Thứ 2 (02/02): Cháo tôm..., Thứ 3 (03/02): Cơm sườn..."

            - **Đánh giá hằng ngày:**
              + Dùng \`daily_assessment\` (chứa thông tin sức khỏe, cảm xúc, kỹ năng của ngày \`meta.focus_date\`)
              + **Ví dụ:** "Đánh giá ngày ${contextData.meta.focus_date}: ${contextData.daily_assessment || 'Giáo viên chưa đánh giá'}."

            - **. Phiếu bé ngoan:**
              + Dùng \`weekly_certificate\` (có \`isGood\`, \`note\`)
              + **Ví dụ:**
              + "Tuần ${contextData.meta.focus_week_number}, bé ${contextData.weekly_certificate?.isGood ? 'đạt Bé Ngoan' : 'chưa đạt Bé Ngoan'}. Nhận xét: ${contextData.weekly_certificate?.note || 'Không có'}."
              + Nếu \`weekly_certificate === "Chưa có phiếu bé ngoan"\` → "Giáo viên chưa tạo phiếu bé ngoan cho tuần ${contextData.meta.focus_week_number}."

            - **. Xử lý Đánh giá hoàn thành chương trình:**
              + **NẾU CHƯA CÓ ĐÁNH GIÁ:** ('completion_assessment' là string)
                * Trả lời: "Giáo viên chưa đánh giá hoàn thành chương trình cho năm học ${contextData.meta.selected_year}."
              
              + **NẾU ĐÃ CÓ ĐÁNH GIÁ:** ('completion_assessment.has_evaluation' = true)
                * Dùng 'completion_assessment.statistics' để biết **tổng số mục tiêu**, **số đạt**, **số chưa đạt**, **điểm trung bình**.
                * Dùng 'completion_assessment.targets' để liệt kê **chi tiết từng mục tiêu** (code, content, score, status).
                * Dùng 'completion_assessment.teacher_note' để hiển thị **nhận xét của giáo viên**.
                * Dùng 'completion_assessment.created_by', 'completion_assessment.created_at', 'completion_assessment.updated_at' để biết **ai đánh giá, khi nào**.
              
              + **Ví dụ trả lời:**
                - "Trong năm học ${contextData.meta.selected_year}, bé đã được đánh giá **${contextData.completion_assessment.statistics?.total_targets || 0}** mục tiêu:
                  + ✅ Đạt: **${contextData.completion_assessment.statistics?.passed || 0}** mục tiêu
                  + ❌ Chưa đạt: **${contextData.completion_assessment.statistics?.failed || 0}** mục tiêu
                  + Điểm trung bình: **${contextData.completion_assessment.statistics?.average_score || 0}**/10
                  
                  **Nhận xét của giáo viên:** ${contextData.completion_assessment.teacher_note || 'Không có'}
                  
                  **Chi tiết các mục tiêu:**
                  ${contextData.completion_assessment.targets?.map((t, i) => `${i + 1}. **${t.code}** - ${t.content}: ${t.score}/10 (${t.status})`).join('\\n') || 'Không có dữ liệu'}"

            **Xử lý câu hỏi tiếp nối (Context-aware):**
                - Dựa vào lịch sử chat gần nhất (6 tin nhắn cuối) để hiểu ngữ cảnh.
                - Ví dụ: Nếu trước đó hỏi về tuần 22, câu "còn điểm danh thì sao" → Trả lời về điểm danh tuần 22.
            
            3. MẪU TRẢ LỜI NGOÀI PHẠM VI:
            "Xin lỗi, nhưng mình chỉ có thể cung cấp thông tin liên quan đến 9 mục sau:
            1. **Thông tin trường**
            2. **Thông tin lớp**
            3. **Thông tin học sinh**
            4. **Thời khóa biểu/ Các hoạt động**
            5. **Thực đơn**
            6. **Điểm danh**
            7. **Nhận xét giáo viên**
            8. **Phiếu bé ngoan**
            9. **Đánh giá hoàn thành chương trình**
            Bạn muốn biết thêm thông tin về mục nào không ạ?"
        `;

        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversation.messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
                { role: 'user', content: message },
            ],
            temperature: 0.3,
        });

        const aiResponse = chatCompletion.choices[0].message.content;
        console.log(`🤖 [AI Answer]: ${aiResponse.substring(0, 100)}...`);

        conversation.messages.push({ role: 'user', content: message });
        conversation.messages.push({ role: 'assistant', content: aiResponse });
        conversation.lastMessageAt = Date.now();
        await conversation.save();

        return { answer: aiResponse, timestamp: new Date() };
    } catch (error) {
        console.error('❌ [Chatbot Error]:', error);
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Hệ thống AI đang bận, vui lòng thử lại sau.');
    }
};

const deleteConversation = async (conversationId, userId) => {
    const result = await ChatbotConversationModel.findOneAndDelete({ _id: conversationId, userId });
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy cuộc trò chuyện');
    return { message: 'Đã xóa hội thoại vĩnh viễn', id: conversationId };
};

export const chatbotServices = {
    createConversation,
    getAllConversations,
    getConversationDetails,
    sendMessage,
    deleteConversation,
};
