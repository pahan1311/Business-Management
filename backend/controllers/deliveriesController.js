import pool from '../db.js';

export const getAllDeliveries = async (req, res) => {
  const result = await pool.query('SELECT * FROM deliveries ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
};

export const getDeliveryById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Delivery not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const createDelivery = async (req, res) => {
  const { order_id, driver_id, status, eta } = req.body;
  const result = await pool.query(
    `INSERT INTO deliveries (order_id, driver_id, status, eta, created_at)
     VALUES ($1,$2,$3,$4, NOW()) RETURNING *`,
    [order_id, driver_id, status, eta]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
};

export const updateDelivery = async (req, res) => {
  const { id } = req.params;
  const { order_id, driver_id, status, eta } = req.body;
  const result = await pool.query(
    `UPDATE deliveries SET order_id=$1,driver_id=$2,status=$3,eta=$4,updated_at=NOW() WHERE id=$5 RETURNING *`,
    [order_id, driver_id, status, eta, id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Delivery not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const deleteDelivery = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM deliveries WHERE id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Delivery not found' });
  res.json({ success: true, data: result.rows[0] });
};
