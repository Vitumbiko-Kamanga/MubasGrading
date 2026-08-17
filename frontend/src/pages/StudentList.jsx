import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../api";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/programs").then((res) => setPrograms(res.data)).catch(() => {});
  }, []);

  async function loadStudents() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/students", { params: { search, program, gender } });
      setStudents(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    loadStudents();
  }

  function resetFilters() {
    setSearch("");
    setProgram("");
    setGender("");
    setTimeout(loadStudents, 0);
  }

  return (
    <div className="page">
      <Navbar title="MUBAS Assessment System" subtitle="Student Information System" />
      <div className="content">
        <Link to="/admin" className="link-back">
          &larr; Back to Dashboard
        </Link>

        <div className="card">
          <h2>Student Information System</h2>

          <form onSubmit={handleFilter} className="filters-row">
            <div className="form-group">
              <label>Search Students</label>
              <input
                placeholder="Name or Reg Number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Program</label>
              <select value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p.program_code} value={p.program_code}>
                    {p.program_code}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">All Genders</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Apply Filters
            </button>
            <button type="button" className="btn btn-outline" style={{ color: "var(--navy)", borderColor: "var(--navy)" }} onClick={resetFilters}>
              Reset
            </button>
          </form>

          {error && <div className="login-error">{error}</div>}
          {loading && <p>Loading...</p>}

          {!loading && (
            <table>
              <thead>
                <tr>
                  <th>Reg Number</th>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>Gender</th>
                  <th>Email</th>
                  <th>Program</th>
                  <th>Level</th>
                  <th>Modules</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.reg_number}>
                    <td>{s.reg_number}</td>
                    <td>{s.last_name}</td>
                    <td>{s.first_name}</td>
                    <td>{s.gender}</td>
                    <td>{s.email}</td>
                    <td>{s.program_code}</td>
                    <td>{s.level}</td>
                    <td>{s.module_count}</td>
                    <td>{s.avg_score !== null ? `${s.avg_score}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && students.length === 0 && <div className="empty-state">No students found.</div>}
        </div>
      </div>
    </div>
  );
}
