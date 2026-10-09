import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import AppNavbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Browse from './pages/notes/Browse';
import NoteDetail from './pages/notes/NoteDetail';
import TopNotes from './pages/notes/TopNotes';

import StudentDashboard from './pages/student/Dashboard';
import Upload from './pages/student/Upload';
import MyNotes from './pages/student/MyNotes';
import EditNote from './pages/student/EditNote';
import Profile from './pages/student/Profile';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminNotes from './pages/admin/Notes';
import AdminReports from './pages/admin/Reports';
import AdminUsers from './pages/admin/Users';
import AdminCourses from './pages/admin/Courses';
import AdminSubjects from './pages/admin/Subjects';
import AdminCategories from './pages/admin/Categories';

/**
 * Application shell: providers first, then the navbar,
 * then the route table.
 *
 *  Public routes   -> / , /notes , /notes/:id , /top-notes , /login , /register
 *  Protected       -> /dashboard , /upload , /my-notes , /notes/:id/edit , /profile
 *  Admin only      -> /admin/*
 */
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppNavbar />

        <Routes>
          {/* ---------- public ---------- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/notes" element={<Browse />} />
          <Route path="/top-notes" element={<TopNotes />} />

          {/* note detail must come AFTER /notes and BEFORE /notes/:id/edit is fine
              because React Router v6 matches exact segments */}
          <Route path="/notes/:id" element={<NoteDetail />} />

          {/* ---------- logged-in students ---------- */}
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/my-notes" element={<ProtectedRoute><MyNotes /></ProtectedRoute>} />
          <Route path="/notes/:id/edit" element={<ProtectedRoute><EditNote /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* ---------- admin ---------- */}
          <Route
            path="/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="notes" element={<AdminNotes />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="categories" element={<AdminCategories />} />
          </Route>

          {/* anything unknown -> home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
