// Populates the database with sample data so the app works immediately after setup.
// Run with: npm run seed

require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

const DEFAULT_PASSWORD = "password123";

async function run() {
  const client = await pool.connect();
  try {
    console.log("Seeding database...");
    await client.query("BEGIN");

    // Programs
    await client.query(`
      INSERT INTO program (program_code, program_name) VALUES
      ('BIT', 'Bachelor of Science in Information Technology'),
      ('BIS', 'Bachelor of Science in Information Systems')
      ON CONFLICT DO NOTHING;
    `);

    // Program levels
    await client.query(`
      INSERT INTO programlevel (program_level_id, program_code, level) VALUES
      ('BIT3', 'BIT', '3'),
      ('BIS3', 'BIS', '3')
      ON CONFLICT DO NOTHING;
    `);

    // Semesters
    await client.query(`
      INSERT INTO semester (semester_id, semester_name) VALUES
      ('2025-S1', '2025 Semester 1'),
      ('2025-S2', '2025 Semester 2')
      ON CONFLICT DO NOTHING;
    `);

    // Modules
    await client.query(`
      INSERT INTO module (module_code, module_name) VALUES
      ('DMS-301', 'Database Management Systems'),
      ('DSA-301', 'Data Structures and Algorithms'),
      ('COA-301', 'Cost Accounting I'),
      ('COA-302', 'Cost Accounting II'),
      ('FIN-301', 'Computerised Accounting'),
      ('FIN-302', 'Financial Accounting III'),
      ('SYS-301', 'Information Systems Audits'),
      ('ELE-305', 'Micro-Electronics Systems'),
      ('HWS-302', 'Computer Hardware II'),
      ('HWS-303', 'Computer Hardware III'),
      ('TEL-301', 'Telecommunications I'),
      ('TEL-302', 'Telecommunications II'),
      ('OPS-301', 'Operating Systems I'),
      ('OPS-302', 'Operating Systems II'),
      ('PRG-306', 'Script Programming'),
      ('RES-301', 'Research Methods'),
      ('WEB-301', 'Web Technologies')
      ON CONFLICT DO NOTHING;
    `);

    // Lecturers
    await client.query(`
      INSERT INTO lecturer (lecturer_id, first_name, last_name, email) VALUES
      ('LEC001', 'Goodall', 'Nyirenda', 'gnyirenda@mubas.ac.mw'),
      ('LEC002', 'Miriam', 'Taylor', 'mtaylor@mubas.ac.mw'),
      ('LEC003', 'Don', 'Nkavea', 'dnkavea@mubas.ac.mw'),
      ('LEC004', 'Emmanuel', 'Kumwenda', 'ekumwenda@mubas.ac.mw'),
      ('LEC005', 'Hope', 'Chilunga', 'hchilunga@mubas.ac.mw')
      ON CONFLICT DO NOTHING;
    `);

    // Lecturer <-> module assignments
    await client.query(`
      INSERT INTO lecturer_module (module_code, lecturer_id) VALUES
      ('DMS-301', 'LEC001'),
      ('DSA-301', 'LEC002'),
      ('OPS-301', 'LEC003'),
      ('OPS-302', 'LEC003'),
      ('COA-301', 'LEC004'),
      ('COA-302', 'LEC004'),
      ('HWS-302', 'LEC005'),
      ('HWS-303', 'LEC005')
      ON CONFLICT DO NOTHING;
    `);

    // Modules offered per program level per semester
    const psmRows = [
      ["BIT3", "2025-S1", "DMS-301"],
      ["BIT3", "2025-S1", "DSA-301"],
      ["BIT3", "2025-S1", "OPS-301"],
      ["BIT3", "2025-S1", "TEL-301"],
      ["BIT3", "2025-S1", "WEB-301"],
      ["BIT3", "2025-S2", "ELE-305"],
      ["BIT3", "2025-S2", "HWS-303"],
      ["BIT3", "2025-S2", "OPS-302"],
      ["BIT3", "2025-S2", "PRG-306"],
      ["BIT3", "2025-S2", "RES-301"],
      ["BIT3", "2025-S2", "TEL-302"],
      ["BIS3", "2025-S1", "DMS-301"],
      ["BIS3", "2025-S1", "DSA-301"],
      ["BIS3", "2025-S1", "COA-301"],
      ["BIS3", "2025-S1", "FIN-301"],
      ["BIS3", "2025-S2", "COA-302"],
      ["BIS3", "2025-S2", "FIN-302"],
      ["BIS3", "2025-S2", "SYS-301"],
      ["BIS3", "2025-S2", "OPS-302"],
    ];
    const psmIds = {}; // key: level|semester|module -> id
    for (const [level, sem, mod] of psmRows) {
      const res = await client.query(
        `INSERT INTO programlevel_semester_module (program_level_id, semester_id, module_code)
         VALUES ($1,$2,$3)
         ON CONFLICT (program_level_id, semester_id, module_code) DO UPDATE SET module_code = EXCLUDED.module_code
         RETURNING programlevel_semester_module_id`,
        [level, sem, mod]
      );
      psmIds[`${level}|${sem}|${mod}`] = res.rows[0].programlevel_semester_module_id;
    }

    // Assessments per module/semester (As1, As2, Mid_T, Exam pattern like the report)
    const assessmentDefs = [
      ["DMS-301", "2025-S1", "As1", 0.1],
      ["DMS-301", "2025-S1", "As2", 0.1],
      ["DMS-301", "2025-S1", "Mid_T", 0.2],
      ["DMS-301", "2025-S1", "Exam", 0.6],
      ["DSA-301", "2025-S1", "Mid_T", 0.5],
      ["DSA-301", "2025-S1", "Exam", 0.5],
      ["OPS-301", "2025-S1", "Mid_T", 0.5],
      ["OPS-301", "2025-S1", "Exam", 0.5],
      ["OPS-302", "2025-S2", "Mid_T", 0.5],
      ["OPS-302", "2025-S2", "Exam", 0.5],
      ["WEB-301", "2025-S1", "Exam", 1.0],
      ["TEL-301", "2025-S1", "Exam", 1.0],
      ["COA-301", "2025-S1", "Exam", 1.0],
      ["FIN-301", "2025-S1", "Exam", 1.0],
      ["COA-302", "2025-S2", "Exam", 1.0],
      ["FIN-302", "2025-S2", "Exam", 1.0],
      ["SYS-301", "2025-S2", "Mid_T", 0.5],
      ["SYS-301", "2025-S2", "Exam", 0.5],
      ["HWS-303", "2025-S2", "Exam", 1.0],
      ["ELE-305", "2025-S2", "Exam", 1.0],
      ["PRG-306", "2025-S2", "Exam", 1.0],
      ["RES-301", "2025-S2", "Exam", 1.0],
      ["TEL-302", "2025-S2", "Exam", 1.0],
    ];
    const assessmentIds = {}; // key: module|semester|type -> id
    for (const [mod, sem, type, weight] of assessmentDefs) {
      const res = await client.query(
        `INSERT INTO assessment (module_code, semester_id, type, weight)
         VALUES ($1,$2,$3,$4) RETURNING assessment_id`,
        [mod, sem, type, weight]
      );
      assessmentIds[`${mod}|${sem}|${type}`] = res.rows[0].assessment_id;
    }

    // Students
    const students = [
      ["BIT/22/SS/012", "KAMANGA", "VITUMBIKO", "M", "vitukamanga03@gmail.com", "BIT3"],
      ["BIT/20/SS/002", "CHUNGA", "SILVESTER", "M", "bit20-schunga@mubas.ac.mw", "BIT3"],
      ["BIT/20/SS/003", "DAKA", "JOHN", "M", "bit20-jdaka@mubas.ac.mw", "BIT3"],
      ["BIT/20/SS/004", "DAUD", "FAHAD", "M", "bit20-fdaud@mubas.ac.mw", "BIT3"],
      ["BIT/20/SS/005", "GONDWE", "VICTORIA", "F", "bit20-vgondwe@mubas.ac.mw", "BIT3"],
      ["BIT/20/SS/006", "HOWSE", "COMFORT", "F", "bit20-chowse@mubas.ac.mw", "BIT3"],
      ["BIS/18/SS/036", "GEOFREY", "WISDOM", "M", "bis18-wgeofrey@mubas.ac.mw", "BIS3"],
      ["BIS/20/SS/004", "KABVALO", "MARTIN", "M", "bis20-mkabvalo@mubas.ac.mw", "BIS3"],
      ["BIS/16/SS/010", "KAMILONDE", "MUNGO", "M", "bis16-mkamilonde@mubas.ac.mw", "BIS3"],
      ["BIS/19/SS/014", "LUNDU", "SHAKIRA", "F", "bis19-slundu@mubas.ac.mw", "BIS3"],
    ];
    for (const s of students) {
      await client.query(
        `INSERT INTO student (reg_number, last_name, first_name, gender, email, program_level_id)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (reg_number) DO NOTHING`,
        s
      );
    }

    // Sample grades so the grade book / results pages have data
    const gradeRows = [
      ["BIT/22/SS/012", "BIT3|2025-S1|DMS-301", "DMS-301|2025-S1|As1", 8],
      ["BIT/22/SS/012", "BIT3|2025-S1|DMS-301", "DMS-301|2025-S1|As2", 7],
      ["BIT/22/SS/012", "BIT3|2025-S1|DMS-301", "DMS-301|2025-S1|Mid_T", 65],
      ["BIT/22/SS/012", "BIT3|2025-S1|DMS-301", "DMS-301|2025-S1|Exam", 70],
      ["BIT/22/SS/012", "BIT3|2025-S1|DSA-301", "DSA-301|2025-S1|Mid_T", 60],
      ["BIT/22/SS/012", "BIT3|2025-S1|DSA-301", "DSA-301|2025-S1|Exam", 68],
      ["BIT/22/SS/012", "BIT3|2025-S1|OPS-301", "OPS-301|2025-S1|Mid_T", 55],
      ["BIT/22/SS/012", "BIT3|2025-S1|OPS-301", "OPS-301|2025-S1|Exam", 58],
      ["BIT/20/SS/002", "BIT3|2025-S1|DMS-301", "DMS-301|2025-S1|Exam", 60],
      ["BIT/20/SS/002", "BIT3|2025-S1|DSA-301", "DSA-301|2025-S1|Exam", 75],
      ["BIS/18/SS/036", "BIS3|2025-S1|DMS-301", "DMS-301|2025-S1|Exam", 58],
      ["BIS/18/SS/036", "BIS3|2025-S1|COA-301", "COA-301|2025-S1|Exam", 52],
      ["BIS/20/SS/004", "BIS3|2025-S1|DMS-301", "DMS-301|2025-S1|Exam", 29],
      ["BIS/20/SS/004", "BIS3|2025-S1|COA-301", "COA-301|2025-S1|Exam", 58],
    ];
    for (const [reg, psmKey, aKey, score] of gradeRows) {
      const psmId = psmIds[psmKey];
      const aId = assessmentIds[aKey];
      if (!psmId || !aId) continue;
      await client.query(
        `INSERT INTO grade (reg_number, programlevel_semester_module_id, assessment_id, score)
         VALUES ($1,$2,$3,$4) ON CONFLICT (reg_number, assessment_id) DO UPDATE SET score = EXCLUDED.score`,
        [reg, psmId, aId, score]
      );
    }

    // ------- Login accounts -------
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Admin
    await client.query(
      `INSERT INTO users (role, username, password_hash, linked_id)
       VALUES ('admin', 'admin', $1, NULL) ON CONFLICT (username) DO NOTHING`,
      [hash]
    );

    // Lecturer accounts (username = lecturer_id)
    const lecturerIds = ["LEC001", "LEC002", "LEC003", "LEC004", "LEC005"];
    for (const id of lecturerIds) {
      await client.query(
        `INSERT INTO users (role, username, password_hash, linked_id)
         VALUES ('lecturer', $1, $2, $1) ON CONFLICT (username) DO NOTHING`,
        [id, hash]
      );
    }

    // Student accounts (username = reg_number)
    for (const s of students) {
      await client.query(
        `INSERT INTO users (role, username, password_hash, linked_id)
         VALUES ('student', $1, $2, $1) ON CONFLICT (username) DO NOTHING`,
        [s[0], hash]
      );
    }

    await client.query("COMMIT");
    console.log("Seeding complete.");
    console.log("\nSample login credentials (password for all: " + DEFAULT_PASSWORD + "):");
    console.log("  Admin    -> username: admin");
    console.log("  Lecturer -> username: LEC001 (Dr. Goodall Nyirenda)");
    console.log("  Student  -> username: BIT/22/SS/012 (Vitumbiko Kamanga)");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
