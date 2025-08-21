import pool from '../db.js';

export const getAllInquiries = async (req, res) => {
  const result = await pool.query('SELECT * FROM inquiries ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
};

export const getInquiryById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM inquiries WHERE id = $1', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Inquiry not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const createInquiry = async (req, res) => {
  const { name, email, subject, message, status } = req.body;
  const result = await pool.query(
    `INSERT INTO inquiries (name, email, subject, message, status, created_at)
     VALUES ($1,$2,$3,$4,$5, NOW()) RETURNING *`,
    [name, email, subject, message, status || 'open']
  );
  res.status(201).json({ success: true, data: result.rows[0] });
};

export const updateInquiry = async (req, res) => {
  const { id } = req.params;
  const { name, email, subject, message, status } = req.body;
  const result = await pool.query(
    `UPDATE inquiries SET name=$1,email=$2,subject=$3,message=$4,status=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,
    [name, email, subject, message, status, id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Inquiry not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const deleteInquiry = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM inquiries WHERE id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Inquiry not found' });
  res.json({ success: true, data: result.rows[0] });
};
