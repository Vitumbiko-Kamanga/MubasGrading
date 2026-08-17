import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../api";

const emptyForm = {
  reg_number: "",
  first_name: "",
  last_name: "",
  gender: "M",
  email: "",
  program_level_id: "",
  password: "",
};

export default function AddStudent() {
  const [form, setForm] = useState(emptyForm);
  const [programLevels, setProgramLevels] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/program-levels").then((res) => setProgramLevels(res.data)).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      await api.post("/students", { ...form, password: form.password || undefined });
      setMessage(`Student ${form.first_name} ${form.last_name} added successfully.`);
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <Navbar title="MUBAS Assessment System" subtitle="Add a New Student" />
      <div className="content">
        <Link to="/admin" className="link-back">
          &larr; Back to Dashboard
        </Link>

        <div className="card" style={{ maxWidth: 480 }}>
          <h2>Add a New Student</h2>
          {message && <div className="badge" style={{ display: "block", marginBottom: 14 }}>{message}</div>}
          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Registration Number</label>
              <input
                value={form.reg_number}
                onChange={(e) => update("reg_number", e.target.value)}
                placeholder="e.g. BIT/23/SS/001"
                required
              />
            </div>
            <div className="form-group">
              <label>First Name</label>
              <input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Class / Program Level</label>
              <select
                value={form.program_level_id}
                onChange={(e) => update("program_level_id", e.target.value)}
                required
              >
                <option value="">Select class...</option>
                {programLevels.map((pl) => (
                  <option key={pl.program_level_id} value={pl.program_level_id}>
                    {pl.program_level_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Initial Password (optional — defaults to password123)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="password123"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Adding..." : "Add Student"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
