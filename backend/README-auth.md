This file describes the minimal setup required to enable the auth endpoints added to the backend.

Required environment variables (create a .env in backend/):

- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET (optional, default used if missing)

Database: PostgreSQL

Run the SQL below to create a minimal `users` table expected by the auth controller:

CREATE TABLE users (
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

Notes:
- Passwords are hashed with bcrypt.
- The register endpoint returns a JWT token and user object (without password).
- Endpoints:
  - POST /api/auth/register
  - POST /api/auth/login

Testing:
Use a REST client to POST JSON to the endpoints; include email and password for login.
