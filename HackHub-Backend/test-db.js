const pool = require('./db');

async function test() {
    try {
        const res = await pool.query('SELECT count(*) FROM users');
        console.log('Database connection successful!');
        console.log('User count:', res.rows[0].count);
        process.exit(0);
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

test();
