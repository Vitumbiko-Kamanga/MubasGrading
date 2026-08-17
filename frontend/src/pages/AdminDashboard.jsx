import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function AdminDashboard() {
  return (
    <div className="page">
      <Navbar title="MUBAS Assessment System" subtitle="Administrator Dashboard" />
      <div className="content">
        <h2 style={{ color: "var(--navy)" }}>Administration Dashboard</h2>
        <div className="dashboard-grid">
          <div className="dashboard-tile">
            <h3>Student Management</h3>
            <p>Add, view, or manage student records in the system.</p>
            <div className="actions">
              <Link to="/admin/students">
                <button className="btn btn-primary btn-small">View Students</button>
              </Link>
              <Link to="/admin/add-student">
                <button className="btn btn-gold btn-small">Add Student</button>
              </Link>
            </div>
          </div>

          <div className="dashboard-tile">
            <h3>Module Management</h3>
            <p>View grade books for each class and module.</p>
            <div className="actions">
              <Link to="/admin/gradebook">
                <button className="btn btn-primary btn-small">Grade Books</button>
              </Link>
            </div>
          </div>

          <div className="dashboard-tile">
            <h3>Lecturer View</h3>
            <p>Preview how lecturers manage grades for their modules.</p>
            <div className="actions">
              <Link to="/lecturer">
                <button className="btn btn-primary btn-small" disabled title="Log in as a lecturer to access this">
                  Lecturer Portal
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
