const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/programs", authenticate, async (req, res) => {
  const r = await pool.query("SELECT * FROM program ORDER BY program_code");
  res.json(r.rows);
});

router.get("/program-levels", authenticate, async (req, res) => {
  const r = await pool.query("SELECT * FROM programlevel ORDER BY program_level_id");
  res.json(r.rows);
});

router.get("/semesters", authenticate, async (req, res) => {
  const r = await pool.query("SELECT * FROM semester ORDER BY semester_id");
  res.json(r.rows);
});

router.get("/modules", authenticate, async (req, res) => {
  const r = await pool.query("SELECT * FROM module ORDER BY module_code");
  res.json(r.rows);
});

router.get("/lecturers", authenticate, async (req, res) => {
  const r = await pool.query("SELECT * FROM lecturer ORDER BY last_name");
  res.json(r.rows);
});

module.exports = router;
