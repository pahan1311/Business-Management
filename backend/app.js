import express from "express";
import cors from "cors";
import helmet from "helmet";
import 'express-async-errors';
import authRoutes from './routes/auth.js';
import customersRoutes from './routes/customers.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import deliveriesRoutes from './routes/deliveries.js';
import staffRoutes from './routes/staff.js';
import inquiriesRoutes from './routes/inquiries.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
	console.log(`${req.method} ${req.originalUrl}`);
	next();
});

// Test API
app.get('/', (req, res) => {
	res.send('Express app configured');
});

// Mount auth routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Mount CRUD routes
app.use('/api/v1/customers', customersRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/deliveries', deliveriesRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/inquiries', inquiriesRoutes);

// Basic error handler
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;
