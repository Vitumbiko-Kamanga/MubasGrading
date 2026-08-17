import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function LecturerPortal() {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [programLevels, setProgramLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [moduleCode, setModuleCode] = useState("");
  const [programLevelId, setProgramLevelId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [type, setType] = useState("");

  const [gradeData, setGradeData] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function loadInitial() {
      const [modRes, plRes, semRes] = await Promise.all([
        api.get(`/lecturers/${encodeURIComponent(user.linkedId)}/modules`),
        api.get("/program-levels"),
        api.get("/semesters"),
      ]);
      setModules(modRes.data);
      setProgramLevels(plRes.data);
      setSemesters(semRes.data);
      if (modRes.data[0]) setModuleCode(modRes.data[0].module_code);
      if (plRes.data[0]) setProgramLevelId(plRes.data[0].program_level_id);
      if (semRes.data[0]) setSemesterId(semRes.data[semRes.data.length - 1].semester_id);
    }
    loadInitial();
  }, [user]);

  useEffect(() => {
    if (!moduleCode || !semesterId) return;
    api
      .get(`/grades/assessment-types/${encodeURIComponent(moduleCode)}`, { params: { semester_id: semesterId } })
      .then((res) => {
        setAssessmentTypes(res.data);
        if (res.data[0]) setType(res.data[0].type);
        else setType("");
      })
      .catch(() => setAssessmentTypes([]));
  }, [moduleCode, semesterId]);

  useEffect(() => {
    if (!moduleCode || !programLevelId || !semesterId || !type) return;
    loadGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleCode, programLevelId, semesterId, type]);

  async function loadGrades() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/grades/module/${encodeURIComponent(moduleCode)}`, {
        params: { program_level_id: programLevelId, semester_id: semesterId, type },
      });
      setGradeData(res.data);
      const initialScores = {};
      res.data.students.forEach((s) => {
        initialScores[s.reg_number] = s.score ?? "";
      });
      setScores(initialScores);
    } catch (err) {
      setGradeData(null);
      setError(err.response?.data?.error || "No grades found for this selection");
    } finally {
      setLoading(false);
    }
  }

  function handleScoreChange(reg_number, value) {
    setScores((s) => ({ ...s, [reg_number]: value }));
  }

  async function handleSave() {
    if (!gradeData) return;
    setSaving(true);
    setError("");
    try {
      const updates = Object.entries(scores)
        .filter(([, v]) => v !== "" && v !== null)
        .map(([reg_number, score]) =>
          api.put("/grades", {
            reg_number,
            programlevel_semester_module_id: gradeData.programlevel_semester_module_id,
            assessment_id: gradeData.assessment_id,
            score: Number(score),
          })
        );
      await Promise.all(updates);
      setToast("Grades saved successfully.");
      setTimeout(() => setToast(""), 3000);
      loadGrades();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save grades");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <Navbar title="Grade Management System" subtitle="Lecturer Portal" />
      <div className="content">
        <div className="card">
          <h2>Manage Grades</h2>

          <div className="filters-row">
            <div className="form-group">
              <label>Select Module</label>
              <select value={moduleCode} onChange={(e) => setModuleCode(e.target.value)}>
                {modules.map((m) => (
                  <option key={m.module_code} value={m.module_code}>
                    {m.module_name} ({m.module_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select value={programLevelId} onChange={(e) => setProgramLevelId(e.target.value)}>
                {programLevels.map((pl) => (
                  <option key={pl.program_level_id} value={pl.program_level_id}>
                    {pl.program_level_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Semester</label>
              <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
                {semesters.map((s) => (
                  <option key={s.semester_id} value={s.semester_id}>
                    {s.semester_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assessment Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {assessmentTypes.map((a) => (
                  <option key={a.type} value={a.type}>
                    {a.type} (weight {a.weight})
                  </option>
                ))}
                {assessmentTypes.length === 0 && <option value="">No assessments defined</option>}
              </select>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}
          {loading && <p>Loading...</p>}

          {gradeData && !loading && (
            <>
              <h3 style={{ color: "var(--navy)" }}>
                Student Grades for {gradeData.module_code} — {gradeData.type}
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Registration Number</th>
                    <th>Name</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.students.map((s) => (
                    <tr key={s.reg_number}>
                      <td>{s.reg_number}</td>
                      <td>{s.first_name} {s.last_name}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="score-input"
                          value={scores[s.reg_number] ?? ""}
                          onChange={(e) => handleScoreChange(s.reg_number, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gradeData.students.length === 0 && (
                <div className="empty-state">No students found for this class.</div>
              )}
              <div className="save-bar">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Grades"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
