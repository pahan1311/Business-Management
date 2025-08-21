import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'customer',
      phone = null,
      address = null,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', error: 'Email and password are required' });
    }

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use', error: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, role, phone, address, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, NOW()) RETURNING id, first_name, last_name, email, role`,
      [firstName, lastName, email, hashed, role, phone, address ? JSON.stringify(address) : null]
    );

    const user = result.rows[0];

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({ success: true, message: 'Registered successfully', user, token });
  } catch (err) {
    console.error(err);
  return res.status(500).json({ success: false, message: 'Server error', error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required', error: 'Email and password are required' });

    const result = await pool.query('SELECT id, first_name, last_name, email, password, role FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
  if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials', error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ success: false, message: 'Invalid credentials', error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Don't send password back
    delete user.password;

  return res.json({ success: true, message: 'Login successful', user, token });
  } catch (err) {
    console.error(err);
  return res.status(500).json({ success: false, message: 'Server error', error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(400).json({ success: false, message: 'No token provided' });

    await pool.query('INSERT INTO revoked_tokens (token, revoked_at) VALUES ($1, NOW())', [token]);
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
