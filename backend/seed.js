require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  await User.deleteOne({ phone: '+998901234567' });

  await User.create({
    firstName: 'Admin',
    lastName: 'CRM',
    phone: '+998901234567',
    password: 'admin123',
    role: 'admin',
  });

  console.log('✅ Admin yaratildi!');
  console.log('   Telefon: +998-90-123-45-67');
  console.log('   Parol:   admin123');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
