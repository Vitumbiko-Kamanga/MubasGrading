const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/lecturers/:lecturer_id/modules -> modules assigned to this lecturer
router.get("/:lecturer_id/modules", authenticate, requireRole("admin", "lecturer"), async (req, res) => {
  const { lecturer_id } = req.params;
  if (req.user.role === "lecturer" && req.user.linkedId !== lecturer_id) {
    return res.status(403).json({ error: "You can only view your own modules" });
  }
  try {
    const r = await pool.query(
      `SELECT DISTINCT m.module_code, m.module_name
       FROM lecturer_module lm
       JOIN module m ON lm.module_code = m.module_code
       WHERE lm.lecturer_id = $1
       ORDER BY m.module_code`,
      [lecturer_id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch lecturer's modules" });
  }
});

module.exports = router;
