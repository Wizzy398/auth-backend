const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: "authdb_j64n_user",
  host: "dpg-d8t8od7lk1mc73ar21t0-a.oregon-postgres.render.com",
  database: "authdb_j64n",
  password: "pJUXtmClVm2Hy7FxegoCgiMgcIPbrVc1",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create users table automatically
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)
.then(() => console.log("Users table ready"))
.catch(err => console.error("Table creation error:", err));

// Test route
app.get("/test", (req, res) => {
  res.send("TEST ROUTE WORKS");
});

// View all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// REGISTER API
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, password]
    );

    res.json({
      message: "User registered successfully",
      user: result.rows[0],
    });

  } catch (err) {

    if (err.code === "23505") {
      return res.status(400).json({
        message: "Username or email already exists"
      });
    }

    res.status(500).json({
      error: err.message
    });
  }
});

// LOGIN API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: result.rows[0],
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});