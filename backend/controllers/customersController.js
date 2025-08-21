import pool from '../db.js';

export const getAllCustomers = async (req, res) => {
  const result = await pool.query('SELECT * FROM customers ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
};

export const getCustomerById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const createCustomer = async (req, res) => {
  const { first_name, last_name, email, phone, address } = req.body;
  const result = await pool.query(
    `INSERT INTO customers (first_name, last_name, email, phone, address, created_at)
     VALUES ($1,$2,$3,$4,$5, NOW()) RETURNING *`,
    [first_name, last_name, email, phone, address ? JSON.stringify(address) : null]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
};

export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, address } = req.body;
  const result = await pool.query(
    `UPDATE customers SET first_name=$1,last_name=$2,email=$3,phone=$4,address=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,
    [first_name, last_name, email, phone, address ? JSON.stringify(address) : null, id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM customers WHERE id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: result.rows[0] });
};
