import { UserModel } from './src/models/userModel.js';
import { CONNECT_DB, CLOSE_DB } from './src/config/mongodb.js';

const seedUsers = async () => {
    try {
        await CONNECT_DB();

        // Xóa user cũ nếu có
        await UserModel.deleteOne({ username: 'admin' });

        // Tạo user mới (password sẽ tự động hash)
        const admin = new UserModel({
            userId: 22102001,
            username: 'admin',
            password: '123456',
            fullName: 'Trần Thị Lan',
            gender: 'Nữ',
            email: 'lan.tran@gmail.com',
            phone: '0905123456',
            role: 'ban_giam_hieu',
            status: true,
        });

        await admin.save();
        console.log('✅ Seed user admin thành công!');

        await CLOSE_DB();
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed data:', error);
        process.exit(1);
    }
};

seedUsers();
