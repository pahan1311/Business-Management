This file describes the CRUD endpoints added for Customers, Orders, Products, Deliveries, Staff and Inquiries.

Endpoints (all prefixed with /api/v1):

Customers
- GET /api/v1/customers
- GET /api/v1/customers/:id
- POST /api/v1/customers
- PUT /api/v1/customers/:id
- DELETE /api/v1/customers/:id

Products
- GET /api/v1/products
- GET /api/v1/products/:id
- POST /api/v1/products
- PUT /api/v1/products/:id
- DELETE /api/v1/products/:id

Orders
- GET /api/v1/orders
- GET /api/v1/orders/:id
- POST /api/v1/orders
- PUT /api/v1/orders/:id
- DELETE /api/v1/orders/:id

Deliveries
- GET /api/v1/deliveries
- GET /api/v1/deliveries/:id
- POST /api/v1/deliveries
- PUT /api/v1/deliveries/:id
- DELETE /api/v1/deliveries/:id

Staff
- GET /api/v1/staff
- GET /api/v1/staff/:id
- POST /api/v1/staff
- PUT /api/v1/staff/:id
- DELETE /api/v1/staff/:id

Inquiries
- GET /api/v1/inquiries
- GET /api/v1/inquiries/:id
- POST /api/v1/inquiries
- PUT /api/v1/inquiries/:id
- DELETE /api/v1/inquiries/:id

DB initialization:
- Run: node scripts/init-tables.js (from backend folder) to create all tables if missing.

Notes:
- These controllers are intentionally conservative and use simple SQL. Adjust schemas and validations as needed for production.
- Consider adding authentication/authorization checks (middleware) on protected routes.
