const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const referenceRoutes = require("./routes/reference");
const studentRoutes = require("./routes/students");
const gradeRoutes = require("./routes/grades");
const lecturerRoutes = require("./routes/lecturers");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "MUBAS Assessment API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api", referenceRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/lecturers", lecturerRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MUBAS Assessment API listening on http://localhost:${PORT}`);
});
