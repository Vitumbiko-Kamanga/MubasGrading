const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/grades/gradebook?program_level_id=BIT3&semester_id=2025-S1
// Returns a pivoted grade book: rows = students, columns = module final scores
router.get("/gradebook", authenticate, requireRole("admin", "lecturer"), async (req, res) => {
  const { program_level_id, semester_id } = req.query;
  if (!program_level_id) {
    return res.status(400).json({ error: "program_level_id is required" });
  }
  try {
    let semParam = semester_id;
    if (!semParam) {
      const semRes = await pool.query("SELECT semester_id FROM semester ORDER BY semester_id DESC LIMIT 1");
      semParam = semRes.rows[0]?.semester_id;
    }

    const modulesRes = await pool.query(
      `SELECT DISTINCT m.module_code, m.module_name
       FROM programlevel_semester_module psm
       JOIN module m ON psm.module_code = m.module_code
       WHERE psm.program_level_id = $1 AND psm.semester_id = $2
       ORDER BY m.module_code`,
      [program_level_id, semParam]
    );

    const scoresRes = await pool.query(
      `SELECT s.reg_number, s.first_name, s.last_name, psm.module_code,
              SUM(g.score * a.weight) AS final_score
       FROM student s
       JOIN programlevel_semester_module psm ON psm.program_level_id = s.program_level_id
       LEFT JOIN grade g ON g.reg_number = s.reg_number AND g.programlevel_semester_module_id = psm.programlevel_semester_module_id
       LEFT JOIN assessment a ON a.assessment_id = g.assessment_id
       WHERE s.program_level_id = $1 AND psm.semester_id = $2
       GROUP BY s.reg_number, s.first_name, s.last_name, psm.module_code
       ORDER BY s.reg_number`,
      [program_level_id, semParam]
    );

    const students = {};
    for (const row of scoresRes.rows) {
      if (!students[row.reg_number]) {
        students[row.reg_number] = {
          reg_number: row.reg_number,
          first_name: row.first_name,
          last_name: row.last_name,
          scores: {},
        };
      }
      students[row.reg_number].scores[row.module_code] =
        row.final_score === null ? null : Number(row.final_score);
    }

    res.json({
      program_level_id,
      semester_id: semParam,
      modules: modulesRes.rows,
      students: Object.values(students),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to build grade book" });
  }
});

// GET /api/grades/module/:module_code?program_level_id=BIT3&semester_id=2025-S1&type=Exam
// Used by the lecturer portal to list students + current scores for one module/assessment type
router.get("/module/:module_code", authenticate, requireRole("admin", "lecturer"), async (req, res) => {
  const { module_code } = req.params;
  const { program_level_id, semester_id, type } = req.query;
  if (!program_level_id || !semester_id || !type) {
    return res.status(400).json({ error: "program_level_id, semester_id and type are required" });
  }
  try {
    const assessmentRes = await pool.query(
      `SELECT assessment_id, weight FROM assessment WHERE module_code = $1 AND semester_id = $2 AND type = $3`,
      [module_code, semester_id, type]
    );
    if (!assessmentRes.rows[0]) {
      return res.status(404).json({ error: "No assessment of that type found for this module/semester" });
    }
    const assessment = assessmentRes.rows[0];

    const psmRes = await pool.query(
      `SELECT programlevel_semester_module_id FROM programlevel_semester_module
       WHERE program_level_id = $1 AND semester_id = $2 AND module_code = $3`,
      [program_level_id, semester_id, module_code]
    );
    if (!psmRes.rows[0]) {
      return res.status(404).json({ error: "This module is not offered to this class in this semester" });
    }
    const psmId = psmRes.rows[0].programlevel_semester_module_id;

    const studentsRes = await pool.query(
      `SELECT s.reg_number, s.first_name, s.last_name, g.score
       FROM student s
       LEFT JOIN grade g ON g.reg_number = s.reg_number AND g.assessment_id = $2
       WHERE s.program_level_id = $1
       ORDER BY s.reg_number`,
      [program_level_id, assessment.assessment_id]
    );

    res.json({
      module_code,
      semester_id,
      type,
      assessment_id: assessment.assessment_id,
      programlevel_semester_module_id: psmId,
      weight: Number(assessment.weight),
      students: studentsRes.rows.map((s) => ({ ...s, score: s.score === null ? null : Number(s.score) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch module grades" });
  }
});

// PUT /api/grades  { reg_number, programlevel_semester_module_id, assessment_id, score }
// Upserts a single grade (used by lecturer/admin when saving edits)
router.put("/", authenticate, requireRole("admin", "lecturer"), async (req, res) => {
  const { reg_number, programlevel_semester_module_id, assessment_id, score } = req.body;
  if (!reg_number || !programlevel_semester_module_id || !assessment_id || score === undefined) {
    return res.status(400).json({ error: "reg_number, programlevel_semester_module_id, assessment_id and score are required" });
  }
  try {
    await pool.query(
      `INSERT INTO grade (reg_number, programlevel_semester_module_id, assessment_id, score)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (reg_number, assessment_id) DO UPDATE SET score = EXCLUDED.score`,
      [reg_number, programlevel_semester_module_id, assessment_id, score]
    );
    res.json({ message: "Grade saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save grade" });
  }
});

// GET /api/grades/assessment-types/:module_code?semester_id=2025-S1
router.get("/assessment-types/:module_code", authenticate, requireRole("admin", "lecturer"), async (req, res) => {
  const { module_code } = req.params;
  const { semester_id } = req.query;
  try {
    const r = await pool.query(
      `SELECT type, weight FROM assessment WHERE module_code = $1 AND semester_id = $2 ORDER BY type`,
      [module_code, semester_id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assessment types" });
  }
});

module.exports = router;
