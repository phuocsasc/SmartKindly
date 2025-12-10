// server/src/utils/schoolYearTargetDefaultData.js

/**
 * ✅ Dữ liệu mặc định cho Nhà trẻ 12-24, 24-36 tháng
 */
export const getNurseryDefaultData = () => {
    return [
        {
            code: 'I',
            name: 'Giáo dục phát triển thể chất',
            subFields: [
                {
                    code: 'a)',
                    name: 'Phát triển vận động',
                    expectedResults: [
                        {
                            code: '1',
                            description: 'Thực hiện động tác phát triển các nhóm cơ và hô hấp',
                            targets: [],
                        },
                        {
                            code: '2',
                            description: 'Thực hiện vận động cơ bản và phát triển tố chất vận động ban đầu',
                            targets: [],
                        },
                        {
                            code: '3',
                            description: 'Thực hiện vận động cử động của bàn tay, ngón tay',
                            targets: [],
                        },
                    ],
                },
                {
                    code: 'b)',
                    name: 'Giáo dục dinh dưỡng và sức khỏe',
                    expectedResults: [
                        {
                            code: '1',
                            description: 'Có một số nền nếp, thói quen tốt trong sinh hoạt',
                            targets: [],
                        },
                        {
                            code: '2',
                            description: 'Thực hiện một số việc tự phục vụ, giữ gìn sức khỏe',
                            targets: [],
                        },
                        {
                            code: '3',
                            description: 'Nhận biết và tránh một số nguy cơ không an toàn',
                            targets: [],
                        },
                    ],
                },
            ],
            expectedResults: [],
        },
        {
            code: 'II',
            name: 'Giáo dục phát triển nhận thức',
            subFields: [],
            expectedResults: [
                {
                    code: '1',
                    description: 'Khám phá thế giới xung quanh bằng các giác quan',
                    targets: [],
                },
                {
                    code: '2',
                    description: 'Thể hiện sự hiểu biết về các sự vật, hiện tượng gần gũi',
                    targets: [],
                },
            ],
        },
        {
            code: 'III',
            name: 'Giáo dục phát triển ngôn ngữ',
            subFields: [],
            expectedResults: [
                {
                    code: '1',
                    description: 'Nghe hiểu lời nói',
                    targets: [],
                },
                {
                    code: '2',
                    description: 'Nghe, nhắc lại các âm, các tiếng và các câu',
                    targets: [],
                },
                {
                    code: '3',
                    description: 'Sử dụng ngôn ngữ để giao tiếp',
                    targets: [],
                },
            ],
        },
        {
            code: 'IV',
            name: 'Giáo dục phát triển tình cảm, kỹ năng xã hội và thẩm mỹ',
            subFields: [],
            expectedResults: [
                {
                    code: '1',
                    description: 'Biểu lộ sự nhận thức về bản thân',
                    targets: [],
                },
                {
                    code: '2',
                    description: 'Nhận biết và biểu lộ cảm xúc với con người và sự vật gần gũi',
                    targets: [],
                },
                {
                    code: '3',
                    description: 'Thực hiện hành vi xã hội đơn giản',
                    targets: [],
                },
                {
                    code: '4',
                    description: 'Thể hiện cảm xúc qua hát, vận động theo nhạc/ tô màu, vẽ, nặn, xếp hình, xem tranh',
                    targets: [],
                },
            ],
        },
    ];
};

/**
 * ✅ Dữ liệu mặc định cho Khối mầm 3-4, Chồi 4-5, Lá 5-6 tuổi
 */
export const getKindergartenDefaultData = () => {
    return [
        {
            code: 'I',
            name: 'Giáo dục phát triển thể chất',
            subFields: [
                {
                    code: 'a)',
                    name: 'Phát triển vận động',
                    expectedResults: [
                        {
                            code: '1',
                            description: 'Thực hiện động tác phát triển các nhóm cơ và hô hấp',
                            targets: [],
                        },
                        {
                            code: '2',
                            description: 'Thể hiện kỹ năng vận động cơ bản và các tố chất trong vận động',
                            targets: [],
                        },
                        {
                            code: '3',
                            description:
                                'Thực hiện và phối hợp được các cử động của bàn tay ngón tay, phối hợp tay - mắt',
                            targets: [],
                        },
                    ],
                },
                {
                    code: 'b)',
                    name: 'Giáo dục dinh dưỡng và sức khỏe',
                    expectedResults: [
                        {
                            code: '1',
                            description:
                                'Biết một số món ăn, thực phẩm thông thường và ích lợi của chúng đối với sức khỏe',
                            targets: [],
                        },
                        {
                            code: '2',
                            description: 'Thực hiện được một số việc tự phục vụ trong sinh hoạt',
                            targets: [],
                        },
                        {
                            code: '3',
                            description: 'Có một số hành vi và thói quen tốt trong sinh hoạt và giữ gìn sức khoẻ',
                            targets: [],
                        },
                        {
                            code: '4',
                            description: 'Biết một số nguy cơ không an toàn và phòng tránh',
                            targets: [],
                        },
                        {
                            code: '5',
                            description: 'Cân nặng và chiều cao phát triển bình thường theo lứa tuổi',
                            targets: [],
                        },
                    ],
                },
            ],
            expectedResults: [],
        },
        {
            code: 'II',
            name: 'Giáo dục phát triển nhận thức',
            subFields: [
                {
                    code: 'a)',
                    name: 'Khám phá khoa học',
                    expectedResults: [
                        {
                            code: '1',
                            description: 'Xem xét và tìm hiểu đặc điểm của các sự vật, hiện tượng',
                            targets: [],
                        },
                        {
                            code: '2',
                            description:
                                'Nhận biết mối quan hệ đơn giản của sự vật, hiện tượng và giải quyết vấn đề đơn giản',
                            targets: [],
                        },
                        {
                            code: '3',
                            description: 'Thể hiện hiểu biết về đối tượng bằng các cách khác nhau',
                            targets: [],
                        },
                    ],
                },
                {
                    code: 'b)',
                    name: 'Làm quen với một số khái niệm sơ đẳng về toán',
                    expectedResults: [
                        {
                            code: '1',
                            description: 'Nhận biết số đếm, số lượng',
                            targets: [],
                        },
                        {
                            code: '2',
                            description: 'Sắp xếp theo qui tắc',
                            targets: [],
                        },
                        {
                            code: '3',
                            description: 'So sánh hai đối tượng',
                            targets: [],
                        },
                        {
                            code: '4',
                            description: 'Nhận biết hình dạng',
                            targets: [],
                        },
                        {
                            code: '5',
                            description: 'Nhận biết vị trí trong không gian và định hướng thời gian',
                            targets: [],
                        },
                    ],
                },
                {
                    code: 'c)',
                    name: 'Khám phá xã hội',
                    expectedResults: [
                        {
                            code: '1',
                            description: 'Nhận biết bản thân, gia đình, trường lớp mầm non và cộng đồng',
                            targets: [],
                        },
                        {
                            code: '2',
                            description: 'Nhận biết một số nghề phổ biến và nghề truyền thống ở địa phương',
                            targets: [],
                        },
                        {
                            code: '3',
                            description: 'Nhận biết một số lễ hội và danh lam, thắng cảnh',
                            targets: [],
                        },
                    ],
                },
            ],
            expectedResults: [],
        },
        {
            code: 'III',
            name: 'Giáo dục phát triển ngôn ngữ',
            subFields: [],
            expectedResults: [
                {
                    code: '1',
                    description: 'Nghe hiểu lời nói',
                    targets: [],
                },
                {
                    code: '2',
                    description: 'Sử dụng lời nói trong cuộc sống hàng ngày',
                    targets: [],
                },
                {
                    code: '3',
                    description: 'Làm quen với đọc, viết',
                    targets: [],
                },
            ],
        },
        {
            code: 'IV',
            name: 'Giáo dục phát triển tình cảm, kỹ năng xã hội',
            subFields: [],
            expectedResults: [
                {
                    code: '1',
                    description: 'Thể hiện ý thức về bản thân',
                    targets: [],
                },
                {
                    code: '2',
                    description: 'Thể hiện sự tự tin, tự lực',
                    targets: [],
                },
                {
                    code: '3',
                    description: 'Nhận biết và thể hiện cảm xúc, tình cảm với con người, sự vật, hiện tượng xung quanh',
                    targets: [],
                },
                {
                    code: '4',
                    description: 'Hành vi và quy tắc ứng xử xã hội',
                    targets: [],
                },
                {
                    code: '5',
                    description: 'Quan tâm đến môi trường',
                    targets: [],
                },
            ],
        },
        {
            code: 'V',
            name: 'Giáo dục phát triển thẩm mỹ',
            subFields: [],
            expectedResults: [
                {
                    code: '1',
                    description:
                        'Cảm nhận và thể hiện cảm xúc trước vẻ đẹp của thiên nhiên, cuộc sống và các tác phẩm nghệ thuật',
                    targets: [],
                },
                {
                    code: '2',
                    description: 'Một số kĩ năng trong hoạt động âm nhạc và hoạt động tạo hình',
                    targets: [],
                },
                {
                    code: '3',
                    description: 'Thể hiện sự sáng tạo khi tham gia các hoạt động nghệ thuật (âm nhạc, tạo hình)',
                    targets: [],
                },
            ],
        },
    ];
};
