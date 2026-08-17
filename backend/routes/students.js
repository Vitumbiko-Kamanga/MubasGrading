const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/students?search=&program=&gender=  (admin: list + filter)
router.get("/", authenticate, requireRole("admin", "lecturer"), async (req, res) => {
  const { search = "", program = "", gender = "" } = req.query;
  try {
    const params = [];
    let where = "WHERE 1=1";

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where += ` AND (LOWER(s.reg_number) LIKE $${params.length} OR LOWER(s.first_name) LIKE $${params.length} OR LOWER(s.last_name) LIKE $${params.length})`;
    }
    if (program) {
      params.push(program);
      where += ` AND pl.program_code = $${params.length}`;
    }
    if (gender) {
      params.push(gender);
      where += ` AND s.gender = $${params.length}`;
    }

    const query = `
      SELECT s.reg_number, s.first_name, s.last_name, s.gender, s.email,
             s.program_level_id, pl.program_code, pl.level,
             COUNT(DISTINCT psm.module_code) AS module_count,
             ROUND(AVG(final_scores.final_score)::numeric, 1) AS avg_score
      FROM student s
      JOIN programlevel pl ON s.program_level_id = pl.program_level_id
      LEFT JOIN programlevel_semester_module psm ON psm.program_level_id = s.program_level_id
      LEFT JOIN (
        SELECT g.reg_number, g.programlevel_semester_module_id, SUM(g.score * a.weight) AS final_score
        FROM grade g
        JOIN assessment a ON g.assessment_id = a.assessment_id
        GROUP BY g.reg_number, g.programlevel_semester_module_id
      ) AS final_scores ON final_scores.reg_number = s.reg_number
      ${where}
      GROUP BY s.reg_number, s.first_name, s.last_name, s.gender, s.email, s.program_level_id, pl.program_code, pl.level
      ORDER BY s.reg_number;
    `;
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// POST /api/students  (admin: add new student, also creates login account)
router.post("/", authenticate, requireRole("admin"), async (req, res) => {
  const { reg_number, first_name, last_name, gender, email, program_level_id, password } = req.body;
  if (!reg_number || !first_name || !last_name || !gender || !email || !program_level_id) {
    return res.status(400).json({ error: "All student fields are required" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO student (reg_number, first_name, last_name, gender, email, program_level_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [reg_number, first_name, last_name, gender, email, program_level_id]
    );
    const hash = await bcrypt.hash(password || "password123", 10);
    await client.query(
      `INSERT INTO users (role, username, password_hash, linked_id) VALUES ('student', $1, $2, $1)
       ON CONFLICT (username) DO NOTHING`,
      [reg_number, hash]
    );
    await client.query("COMMIT");
    res.status(201).json({ message: "Student added successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "A student with this registration number already exists" });
    }
    res.status(500).json({ error: "Failed to add student" });
  } finally {
    client.release();
  }
});

// GET /api/students/:reg_number  -> single student profile
router.get("/:reg_number", authenticate, async (req, res) => {
  const { reg_number } = req.params;
  if (req.user.role === "student" && req.user.linkedId !== reg_number) {
    return res.status(403).json({ error: "You can only view your own profile" });
  }
  try {
    const r = await pool.query(
      `SELECT s.*, pl.program_code, pl.level FROM student s
       JOIN programlevel pl ON s.program_level_id = pl.program_level_id
       WHERE s.reg_number = $1`,
      [reg_number]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Student not found" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// GET /api/students/:reg_number/modules?semester=2025-S2  -> current modules
router.get("/:reg_number/modules", authenticate, async (req, res) => {
  const { reg_number } = req.params;
  if (req.user.role === "student" && req.user.linkedId !== reg_number) {
    return res.status(403).json({ error: "You can only view your own modules" });
  }
  try {
    const studentRes = await pool.query("SELECT program_level_id FROM student WHERE reg_number = $1", [reg_number]);
    if (!studentRes.rows[0]) return res.status(404).json({ error: "Student not found" });
    const programLevelId = studentRes.rows[0].program_level_id;

    let semesterId = req.query.semester;
    if (!semesterId) {
      const semRes = await pool.query("SELECT semester_id FROM semester ORDER BY semester_id DESC LIMIT 1");
      semesterId = semRes.rows[0]?.semester_id;
    }

    const r = await pool.query(
      `SELECT psm.module_code, m.module_name, sem.semester_id, sem.semester_name
       FROM programlevel_semester_module psm
       JOIN module m ON psm.module_code = m.module_code
       JOIN semester sem ON psm.semester_id = sem.semester_id
       WHERE psm.program_level_id = $1 AND psm.semester_id = $2
       ORDER BY psm.module_code`,
      [programLevelId, semesterId]
    );
    res.json({ semester_id: semesterId, modules: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch student's modules" });
  }
});

// GET /api/students/:reg_number/results  -> results history grouped by semester
router.get("/:reg_number/results", authenticate, async (req, res) => {
  const { reg_number } = req.params;
  if (req.user.role === "student" && req.user.linkedId !== reg_number) {
    return res.status(403).json({ error: "You can only view your own results" });
  }
  try {
    const r = await pool.query(
      `SELECT sem.semester_id, sem.semester_name, m.module_code, m.module_name,
              SUM(g.score * a.weight) AS overall_grade
       FROM grade g
       JOIN assessment a ON g.assessment_id = a.assessment_id
       JOIN programlevel_semester_module psm ON g.programlevel_semester_module_id = psm.programlevel_semester_module_id
       JOIN module m ON psm.module_code = m.module_code
       JOIN semester sem ON psm.semester_id = sem.semester_id
       WHERE g.reg_number = $1
       GROUP BY sem.semester_id, sem.semester_name, m.module_code, m.module_name
       ORDER BY sem.semester_id, m.module_code`,
      [reg_number]
    );

    const bySemester = {};
    for (const row of r.rows) {
      const grade = Number(row.overall_grade);
      let status = "Fail";
      if (grade >= 75) status = "Distinction";
      else if (grade >= 60) status = "Credit";
      else if (grade >= 50) status = "Pass";

      if (!bySemester[row.semester_id]) {
        bySemester[row.semester_id] = { semester_id: row.semester_id, semester_name: row.semester_name, modules: [] };
      }
      bySemester[row.semester_id].modules.push({
        module_code: row.module_code,
        module_name: row.module_name,
        overall_grade: grade,
        status,
      });
    }
    res.json(Object.values(bySemester));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

module.exports = router;
