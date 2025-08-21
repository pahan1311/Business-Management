// server.js
import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.send("Express + PostgreSQL backend running 🚀");
});

// Get all customers


// Add a new customer


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
