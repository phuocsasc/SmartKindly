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
import isoWeek from 'dayjs/plugin/isoWeek.js'; // ✅ Thêm plugin isoWeek để tính tuần chuẩn

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
 * Helper: Format Hoạt động Chi tiết 1 ngày (Lấy full nội dung)
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
            let content = `⏰ **${act.startTime} - ${act.endTime}**: ${act.description}`;
            if (act.detailedContent && act.detailedContent.trim() !== '') {
                content += `\n   - *Chi tiết*: ${act.detailedContent}`;
            }
            return content;
        })
        .join('\n');
};

/**
 * 🧠 1. AI TIME DETECT (NÂNG CẤP)
 * - Thêm logic tính thứ trong tuần rõ ràng
 */
const detectTargetDate = async (userMessage, todayDateStr) => {
    try {
        const today = dayjs(todayDateStr);
        // Cung cấp thông tin thứ của ngày hiện tại để AI dễ tính toán
        const currentDayOfWeek = today.day() === 0 ? 'Chủ Nhật' : `Thứ ${today.day() + 1}`;

        const prompt = `
            Hôm nay là: ${todayDateStr} (${currentDayOfWeek}).
            Câu nói của người dùng: "${userMessage}"
            
            NHIỆM VỤ: Trả về NGÀY MỤC TIÊU (YYYY-MM-DD).
            
            QUY TẮC TÍNH TOÁN:
            1. "hôm qua" = ${today.subtract(1, 'day').format('YYYY-MM-DD')}.
            2. "hôm nay", "tuần này" = ${todayDateStr}.
            3. "ngày mai" = ${today.add(1, 'day').format('YYYY-MM-DD')}.
            4. "Thứ X tuần này" = Ngày thứ X của tuần hiện tại (Tuần tính từ Thứ 2 đến Chủ Nhật).
               Ví dụ: Nếu hôm nay là Thứ 4 (${todayDateStr}), thì:
               - "Thứ 2 tuần này" là ${today.day(1).format('YYYY-MM-DD')}.
               - "Thứ 6 tuần này" là ${today.day(5).format('YYYY-MM-DD')}.
            5. "Thứ X tuần trước" = Ngày thứ X của tuần trước.
            6. "Thứ X tuần sau" = Ngày thứ X của tuần sau.
            
            CHỈ TRẢ VỀ CHUỖI NGÀY DẠNG YYYY-MM-DD. KHÔNG GIẢI THÍCH GÌ THÊM.
        `;

        const chat = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0, // Nhiệt độ 0 để tính toán chính xác nhất
        });

        const dateStr = chat.choices[0].message.content.trim();
        // Validate date
        return dayjs(dateStr, 'YYYY-MM-DD', true).isValid() ? dateStr : todayDateStr;
    } catch {
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
 * ✅ 4. SEND MESSAGE (FULL UPDATE FIX)
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

        // B3: Detect Thời gian
        const today = dayjs().tz('Asia/Ho_Chi_Minh');
        const targetDateStr = await detectTargetDate(message, today.format('YYYY-MM-DD'));
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
                name: school.name,
                address: school.address,
                phone: school.phone,
                email: school.email,
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
            },
            schedule: {
                weekly_summary: formatWeeklyPlanSummary(weeklyPlan?.weeklyPlan),
                daily_detail: formatDailyPlanForAI(weeklyPlan?.weeklyPlan, targetDate),
            },
            menu: {
                target_day_menu: menu?.menuApplies?.find((m) => dayjs(m.date).isSame(targetDate, 'day'))?.menuSnapshot
                    ? formatMenuForAI(
                          menu.menuApplies.find((m) => dayjs(m.date).isSame(targetDate, 'day')).menuSnapshot,
                      )
                    : 'Chưa có thực đơn ngày này',
                full_week: menu?.menuApplies
                    ?.map(
                        (m) =>
                            `- **${m.dayOfWeek} (${dayjs(m.date).format('DD/MM')})**: ${formatMenuForAI(m.menuSnapshot)}`,
                    )
                    .join('\n'),
            },
            attendance: {
                weekly_summary: `Trong tuần ${targetWeekNumber}: Đi học ${attendance?.daysCount || 0} buổi, Vắng ${attendance?.absentInWeek || 0} buổi`,
                status_today: attendance?.attendanceMap?.[targetDateStr]?.status || 'Chưa có dữ liệu ngày này',
                total_absent_year: attendance?.totalAbsentInYear || 0,
            },
            daily_assessment: dailyAssessment?.assessmentMap?.[targetDateStr] || 'Chưa có nhận xét ngày này',
            weekly_certificate: weeklyCert?.certificate
                ? { isGood: weeklyCert.certificate.isGoodChild, note: weeklyCert.certificate.comment }
                : 'Chưa có phiếu bé ngoan',
            program_complete: completionAssessment?.evaluation ? 'Đã hoàn thành' : 'Chưa đánh giá',
        };

        // B7: SYSTEM PROMPT
        const systemPrompt = `
            Bạn là SmartKindly AI.
            
            1. DỮ LIỆU ĐANG XÉT (Ngày trọng tâm: ${contextData.meta.focus_date}):
            ${JSON.stringify(contextData)}

            2. YÊU CẦU:
            - **Định dạng**: Trả lời bằng **Markdown**.
            - **Ngày tháng**: Luôn ghi rõ ngày/tháng/năm (VD: ${contextData.meta.focus_date}) khi nhắc đến thời gian.
            - **Tuần học**: Khi nhắc đến tuần, hãy nói rõ: "Tuần ${contextData.meta.focus_week_number} (từ ${contextData.meta.focus_week_range})".
            
            - **Xử lý câu hỏi tiếp nối**:
              + Nếu hỏi "vậy còn thứ 6 tuần này", "vậy tuần trước thì sao", hãy dùng dữ liệu trong 'meta.focus_date' và 'schedule/menu/attendance' để trả lời.
              + Dữ liệu đã được tính toán chính xác cho ngày trọng tâm, KHÔNG tự suy luận ngày khác.
            
            - **Cụ thể**:
              + Hỏi "đi học mấy bữa": Dùng 'attendance.weekly_summary'.
              + Hỏi "thực đơn": Dùng 'menu.target_day_menu' (hoặc full_week nếu hỏi cả tuần).
              + Hỏi "thời khóa biểu chi tiết": Dùng 'schedule.daily_detail'.

            3. MẪU TRẢ LỜI NGOÀI PHẠM VI:
            "Xin lỗi, nhưng mình chỉ có thể cung cấp thông tin liên quan đến 9 mục sau:
            1. 🏫 **Thông tin trường**
            2. 🎓 **Thông tin lớp**
            3. 👶 **Thông tin học sinh**
            4. 📅 **Thời khóa biểu**
            5. 🍽️ **Thực đơn**
            6. 📝 **Điểm danh**
            7. 🗣️ **Nhận xét giáo viên**
            8. 🏆 **Phiếu bé ngoan**
            9. 📜 **Đánh giá hoàn thành chương trình**
            
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
