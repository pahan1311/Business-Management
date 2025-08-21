import pool from '../db.js';

export const getAllProducts = async (req, res) => {
  const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
  res.json({ success: true, data: result.rows });
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const createProduct = async (req, res) => {
  const { name, sku, description, price, quantity } = req.body;
  const result = await pool.query(
    `INSERT INTO products (name, sku, description, price, quantity, created_at)
     VALUES ($1,$2,$3,$4,$5, NOW()) RETURNING *`,
    [name, sku, description, price, quantity]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, sku, description, price, quantity } = req.body;
  const result = await pool.query(
    `UPDATE products SET name=$1,sku=$2,description=$3,price=$4,quantity=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,
    [name, sku, description, price, quantity, id]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: result.rows[0] });
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING *', [id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: result.rows[0] });
};
