const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dnio-release-tracker';
async function createAdminUser(username, password) {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log('An admin user already exists.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ username, passwordHash, role: 'admin' });
  await user.save();
  console.log('Admin user created successfully!');
  mongoose.disconnect();
}

const [,, username, password] = process.argv;
if (!username || !password) {
  console.log('Usage: node createAdminUser.js <username> <password>');
  process.exit(1);
}

createAdminUser(username, password).catch(err => {
  console.error('Error creating admin user:', err);
  process.exit(1);
}); 