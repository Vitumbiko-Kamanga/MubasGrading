const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require("../db");

const router = express.Router();

// POST /api/auth/login  { role, username, password }
router.post("/login", async (req, res) => {
  const { role, username, password } = req.body;
  if (!role || !username || !password) {
    return res.status(400).json({ error: "role, username and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND role = $2",
      [username, role]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
        username: user.username,
        linkedId: user.linked_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    let profile = null;
    if (user.role === "student") {
      const r = await pool.query("SELECT * FROM student WHERE reg_number = $1", [user.linked_id]);
      profile = r.rows[0] || null;
    } else if (user.role === "lecturer") {
      const r = await pool.query("SELECT * FROM lecturer WHERE lecturer_id = $1", [user.linked_id]);
      profile = r.rows[0] || null;
    }

    res.json({ token, role: user.role, username: user.username, linkedId: user.linked_id, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;
