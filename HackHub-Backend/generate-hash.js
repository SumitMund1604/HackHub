// Run this once to generate a proper bcrypt hash: node generate-hash.js
const bcrypt = require('bcryptjs');
bcrypt.hash('password123', 10).then(function(hash) {
    console.log('Bcrypt hash for "password123":');
    console.log(hash);
    console.log('\nUse this hash in seed.sql');
    console.log('\nSQL to update all existing users:');
    console.log("UPDATE users SET password_hash = '" + hash + "';");
});
