import pool from '../db.js';

export const getAllStaff = async (req, res) => {
  const result = await pool.query('SELECT * FROM staff ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
};

export const getStaffById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM staff WHERE id = $1', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Staff not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const createStaff = async (req, res) => {
  const { first_name, last_name, email, role, phone } = req.body;
  const result = await pool.query(
    `INSERT INTO staff (first_name, last_name, email, role, phone, created_at)
     VALUES ($1,$2,$3,$4,$5, NOW()) RETURNING *`,
    [first_name, last_name, email, role, phone]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role, phone } = req.body;
  const result = await pool.query(
    `UPDATE staff SET first_name=$1,last_name=$2,email=$3,role=$4,phone=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,
    [first_name, last_name, email, role, phone, id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Staff not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM staff WHERE id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Staff not found' });
  res.json({ success: true, data: result.rows[0] });
};
