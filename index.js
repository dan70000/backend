const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use an environment variable for security
  ssl: { rejectUnauthorized: true }, // Required for production
});

// Multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Routes

// Welcome Route
app.get("/", (req, res) => {
  res.send("Welcome to the Lawyer Case Management API!");
});

// Register a New Case
app.post("/cases", async (req, res) => {
  const { case_number, parties, registration_date, status } = req.body;
  try {
    await pool.query(
      "INSERT INTO cases (case_number, parties, registration_date, status) VALUES ($1, $2, $3, $4)",
      [case_number, parties, registration_date, status]
    );
    res.status(201).json({ message: "Case registered successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Cases
app.get("/cases", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cases");
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a Document
app.post("/documents/upload", upload.single("document"), async (req, res) => {
  const { case_id } = req.body;
  const file_path = req.file.path;

  try {
    await pool.query(
      "INSERT INTO documents (case_id, file_path) VALUES ($1, $2)",
      [case_id, file_path]
    );
    res.status(201).json({ message: "Document uploaded successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a Case
app.delete("/cases/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM cases WHERE id = $1", [id]);
    res.status(200).json({ message: "Case deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a Case
app.put("/cases/:id", async (req, res) => {
  const { id } = req.params;
  const { case_number, parties, registration_date, status } = req.body;
  try {
    await pool.query(
      "UPDATE cases SET case_number = $1, parties = $2, registration_date = $3, status = $4 WHERE id = $5",
      [case_number, parties, registration_date, status, id]
    );
    res.status(200).json({ message: "Case updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export the Express App for Vercel
module.exports = app;
