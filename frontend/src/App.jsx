import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";
import StudentResults from "./pages/StudentResults.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AddStudent from "./pages/AddStudent.jsx";
import StudentList from "./pages/StudentList.jsx";
import GradeBook from "./pages/GradeBook.jsx";
import LecturerPortal from "./pages/LecturerPortal.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/results"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentResults />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/add-student"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AddStudent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StudentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/gradebook"
        element={
          <ProtectedRoute roles={["admin", "lecturer"]}>
            <GradeBook />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer"
        element={
          <ProtectedRoute roles={["lecturer"]}>
            <LecturerPortal />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
