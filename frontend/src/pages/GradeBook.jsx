import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../api";

function statusFor(score) {
  if (score === null || score === undefined) return { label: "—", cls: "" };
  if (score >= 75) return { label: `${score.toFixed(0)}`, cls: "status-distinction" };
  if (score >= 50) return { label: `${score.toFixed(0)}`, cls: "status-pass" };
  return { label: `${score.toFixed(0)}`, cls: "status-fail" };
}

export default function GradeBook() {
  const [programLevels, setProgramLevels] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [programLevelId, setProgramLevelId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/program-levels"), api.get("/semesters")]).then(([plRes, semRes]) => {
      setProgramLevels(plRes.data);
      setSemesters(semRes.data);
      if (plRes.data[0]) setProgramLevelId(plRes.data[0].program_level_id);
      if (semRes.data[0]) setSemesterId(semRes.data[semRes.data.length - 1].semester_id);
    });
  }, []);

  useEffect(() => {
    if (!programLevelId) return;
    loadGradeBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programLevelId, semesterId]);

  async function loadGradeBook() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/grades/gradebook", {
        params: { program_level_id: programLevelId, semester_id: semesterId || undefined },
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load grade book");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="page">
      <Navbar title="MUBAS Assessment System" subtitle="Grade Book" />
      <div className="content">
        <Link to="/admin" className="link-back">
          &larr; Back to Dashboard
        </Link>

        <div className="card">
          <h2>Gradebook</h2>
          <div className="filters-row">
            <div className="form-group">
              <label>Select Program / Class</label>
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
            <button className="btn btn-primary" onClick={handlePrint}>
              Print Gradebook
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}
          {loading && <p>Loading...</p>}

          {data && !loading && (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Reg. Number</th>
                    <th>Last Name</th>
                    <th>First Name</th>
                    {data.modules.map((m) => (
                      <th key={m.module_code}>{m.module_code}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={s.reg_number}>
                      <td>{s.reg_number}</td>
                      <td>{s.last_name}</td>
                      <td>{s.first_name}</td>
                      {data.modules.map((m) => {
                        const { label, cls } = statusFor(s.scores[m.module_code]);
                        return (
                          <td key={m.module_code} className={cls}>
                            {label}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.students.length === 0 && <div className="empty-state">No students in this class.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
