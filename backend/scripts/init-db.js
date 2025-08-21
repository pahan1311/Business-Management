import pool from '../db.js';

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  phone VARCHAR(50),
  address JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

async function run() {
  try {
    console.log('Connecting to DB and creating users table if not exists...');
    await pool.query(createUsersTable);
    console.log('users table is ready');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create users table', err);
    process.exit(1);
  }
}

run();
