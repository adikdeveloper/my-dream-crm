require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB ulandi.');

        const adminPhone = '+998907068866';
        const adminExists = await User.findOne({ phone: adminPhone });

        if (adminExists) {
            console.log('Admin allaqachon mavjud.');
        } else {
            const admin = new User({
                firstName: 'Muzaffar',
                lastName: 'Admin',
                phone: adminPhone,
                password: 'mydream',
                role: 'admin',
                isActive: true
            });
            await admin.save();
            console.log('Admin foydalanuvchisi (parol bilan) muvaffaqiyatli yaratildi!');
        }
    } catch (err) {
        console.error('Xatolik:', err);
    } finally {
        mongoose.connection.close();
    }
};

seedAdmin();
