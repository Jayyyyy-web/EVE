// One-time script: promotes an existing user to the 'admin' role.
// Run this ONCE, after pulling the role-based auth changes, to grandfather
// in your existing account as the single admin. Run it again on a different
// username and it will simply do nothing if an admin already exists —
// the single-admin rule is enforced here too, not just at registration.
//
// Usage:
//   node scripts/setAdmin.js <username>
//
// Example:
//   node scripts/setAdmin.js admin

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const username = process.argv[2];

if (!username) {
  console.error('Usage: node scripts/setAdmin.js <username>');
  process.exit(1);
}

const run = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eve';
  await mongoose.connect(uri);

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log(`An admin already exists: "${existingAdmin.username}". No changes made.`);
    await mongoose.disconnect();
    return;
  }

  const user = await User.findOne({ username });
  if (!user) {
    console.error(`No user found with username "${username}".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  await user.save();

  console.log(`Success: "${user.username}" is now the admin.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
