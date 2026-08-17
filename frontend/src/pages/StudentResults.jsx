import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function statusClass(status) {
  if (status === "Distinction") return "status-distinction";
  if (status === "Credit") return "status-credit";
  if (status === "Fail") return "status-fail";
  return "status-pass";
}

export default function StudentResults() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/students/${encodeURIComponent(user.linkedId)}/results`);
        setSemesters(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="page">
      <Navbar title="MUBAS Student Portal" subtitle="Academic Results History" />
      <div className="content">
        <Link to="/student" className="link-back">
          &larr; Back to Portal
        </Link>

        <div className="card">
          <h2>Academic Results History</h2>
          {error && <div className="login-error">{error}</div>}
          {loading && <p>Loading...</p>}
          {!loading && semesters.length === 0 && (
            <div className="empty-state">No results recorded yet.</div>
          )}

          {semesters.map((sem) => (
            <div key={sem.semester_id} style={{ marginBottom: 24 }}>
              <h3 style={{ color: "var(--navy)" }}>{sem.semester_name}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Module Name</th>
                    <th>Overall Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.modules.map((m) => (
                    <tr key={m.module_code}>
                      <td className={statusClass(m.status)}>{m.status}</td>
                      <td>{m.module_name}</td>
                      <td>{m.overall_grade.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
