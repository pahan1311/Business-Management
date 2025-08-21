import pool from '../db.js';

export const getAllOrders = async (req, res) => {
  const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const createOrder = async (req, res) => {
  const { customer_id, items, total, status } = req.body;
  const result = await pool.query(
    `INSERT INTO orders (customer_id, items, total, status, created_at)
     VALUES ($1,$2,$3,$4, NOW()) RETURNING *`,
    [customer_id, items ? JSON.stringify(items) : null, total, status]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
};

export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { customer_id, items, total, status } = req.body;
  const result = await pool.query(
    `UPDATE orders SET customer_id=$1,items=$2,total=$3,status=$4,updated_at=NOW() WHERE id=$5 RETURNING *`,
    [customer_id, items ? JSON.stringify(items) : null, total, status, id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM orders WHERE id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: result.rows[0] });
};
