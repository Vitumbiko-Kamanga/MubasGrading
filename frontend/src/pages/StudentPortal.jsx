import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function StudentPortal() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user?.profile || null);
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const regNumber = user.linkedId;
        const [profileRes, modulesRes] = await Promise.all([
          api.get(`/students/${encodeURIComponent(regNumber)}`),
          api.get(`/students/${encodeURIComponent(regNumber)}/modules`),
        ]);
        setProfile(profileRes.data);
        setModuleData(modulesRes.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load your information");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="page">
      <Navbar title="MUBAS Student Portal" subtitle="Academic Information" />
      <div className="content">
        {error && <div className="login-error">{error}</div>}
        {loading && <p>Loading...</p>}

        {profile && (
          <div className="card">
            <h2>Student Information</h2>
            <p>
              <strong>Registration Number:</strong> {profile.reg_number}
            </p>
            <p>
              <strong>Name:</strong> {profile.first_name} {profile.last_name}
            </p>
            <p>
              <strong>Program:</strong> {profile.program_level_id}
            </p>
            {moduleData && (
              <p>
                <strong>Current Semester:</strong> {moduleData.semester_id}
              </p>
            )}
          </div>
        )}

        {moduleData && (
          <div className="card">
            <h2>My Modules — {moduleData.semester_id}</h2>
            {moduleData.modules.length === 0 ? (
              <div className="empty-state">No modules found for this semester.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Module Code</th>
                    <th>Module Name</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleData.modules.map((m) => (
                    <tr key={m.module_code}>
                      <td>{m.module_code}</td>
                      <td>{m.module_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 16 }}>
              <Link to="/student/results">
                <button className="btn btn-primary">View Result History</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
