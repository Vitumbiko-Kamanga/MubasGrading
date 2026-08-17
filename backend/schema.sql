-- ============================================================
-- MUBAS Assessment System - Database Schema (Neon PostgreSQL)
-- Based on the logical/physical design in the assessment report
-- ============================================================

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS grade CASCADE;
DROP TABLE IF EXISTS assessment CASCADE;
DROP TABLE IF EXISTS programlevel_semester_module CASCADE;
DROP TABLE IF EXISTS lecturer_module CASCADE;
DROP TABLE IF EXISTS student CASCADE;
DROP TABLE IF EXISTS programlevel CASCADE;
DROP TABLE IF EXISTS program CASCADE;
DROP TABLE IF EXISTS module CASCADE;
DROP TABLE IF EXISTS lecturer CASCADE;
DROP TABLE IF EXISTS semester CASCADE;

-- Programs (e.g. BIT, BIS)
CREATE TABLE program (
  program_code VARCHAR(10) PRIMARY KEY,
  program_name VARCHAR(80) NOT NULL
);

-- Program levels / classes (e.g. BIT3, BIS3)
CREATE TABLE programlevel (
  program_level_id VARCHAR(10) PRIMARY KEY,
  program_code VARCHAR(10) NOT NULL REFERENCES program(program_code),
  level VARCHAR(1) NOT NULL CHECK (level IN ('1','2','3','4','5'))
);

-- Semesters
CREATE TABLE semester (
  semester_id VARCHAR(20) PRIMARY KEY,
  semester_name VARCHAR(50) NOT NULL
);

-- Modules
CREATE TABLE module (
  module_code VARCHAR(15) PRIMARY KEY,
  module_name VARCHAR(80) NOT NULL
);

-- Lecturers
CREATE TABLE lecturer (
  lecturer_id VARCHAR(10) PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  email VARCHAR(60) NOT NULL
);

-- Which lecturer teaches which module
CREATE TABLE lecturer_module (
  lecturer_module_id SERIAL PRIMARY KEY,
  module_code VARCHAR(15) NOT NULL REFERENCES module(module_code),
  lecturer_id VARCHAR(10) NOT NULL REFERENCES lecturer(lecturer_id)
);

-- Students
CREATE TABLE student (
  reg_number VARCHAR(20) PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  gender CHAR(1) NOT NULL CHECK (gender IN ('M','F')),
  email VARCHAR(60) NOT NULL,
  program_level_id VARCHAR(10) NOT NULL REFERENCES programlevel(program_level_id)
);

-- Which module is offered to which program level in which semester
CREATE TABLE programlevel_semester_module (
  programlevel_semester_module_id SERIAL PRIMARY KEY,
  program_level_id VARCHAR(10) NOT NULL REFERENCES programlevel(program_level_id),
  semester_id VARCHAR(20) NOT NULL REFERENCES semester(semester_id),
  module_code VARCHAR(15) NOT NULL REFERENCES module(module_code),
  UNIQUE (program_level_id, semester_id, module_code)
);

-- Assessment components for a module in a semester (e.g. As1, As2, Mid_T, Exam)
CREATE TABLE assessment (
  assessment_id SERIAL PRIMARY KEY,
  module_code VARCHAR(15) NOT NULL REFERENCES module(module_code),
  semester_id VARCHAR(20) NOT NULL REFERENCES semester(semester_id),
  type VARCHAR(10) NOT NULL,
  weight NUMERIC(4,2) NOT NULL CHECK (weight >= 0 AND weight <= 1)
);

-- Individual grade / score a student got for an assessment
CREATE TABLE grade (
  grade_id SERIAL PRIMARY KEY,
  reg_number VARCHAR(20) NOT NULL REFERENCES student(reg_number),
  programlevel_semester_module_id INT NOT NULL REFERENCES programlevel_semester_module(programlevel_semester_module_id),
  assessment_id INT NOT NULL REFERENCES assessment(assessment_id),
  score NUMERIC(6,2) NOT NULL,
  UNIQUE (reg_number, assessment_id)
);

-- ============================================================
-- Login accounts for Student / Lecturer / Admin portals
-- (kept separate from the academic tables above)
-- ============================================================
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  role VARCHAR(10) NOT NULL CHECK (role IN ('student','lecturer','admin')),
  username VARCHAR(30) NOT NULL UNIQUE, -- reg_number for students, lecturer_id for lecturers, email/name for admin
  password_hash VARCHAR(100) NOT NULL,
  linked_id VARCHAR(20) -- reg_number or lecturer_id this account belongs to (NULL for admin)
);

CREATE INDEX idx_student_program_level ON student(program_level_id);
CREATE INDEX idx_grade_reg_number ON grade(reg_number);
CREATE INDEX idx_psm_program_level ON programlevel_semester_module(program_level_id);
