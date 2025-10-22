import { UserModel } from './src/models/userModel.js';
import { CONNECT_DB, CLOSE_DB } from './src/config/mongodb.js';

const seedUsers = async () => {
    try {
        await CONNECT_DB();

        // ✅ Tạo admin hệ thống
        await UserModel.deleteOne({ username: 'admin' });
        const admin = new UserModel({
            userId: 10000001,
            username: 'admin',
            password: 'admin123',
            fullName: 'Admin SmartKindly',
            gender: 'Nam',
            email: 'admin@smartkindly.vn',
            phone: '0900000000',
            role: 'admin',
            status: true,
        });
        await admin.save();
        console.log('✅ Created admin user');

        // Tạo ban giám hiệu
        await UserModel.deleteOne({ username: 'bgh01' });
        const bgh = new UserModel({
            userId: 22102001,
            username: 'bgh01',
            password: '123456',
            fullName: 'Trần Thị Lan',
            gender: 'Nữ',
            email: 'lan.tran@gmail.com',
            phone: '0905123456',
            role: 'ban_giam_hieu',
            status: true,
        });
        await bgh.save();
        console.log('✅ Created ban_giam_hieu user');

        console.log('✅ Seed users thành công!');
        await CLOSE_DB();
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed data:', error);
        await CLOSE_DB();
        process.exit(1);
    }
};

seedUsers();
