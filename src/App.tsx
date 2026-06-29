import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPassword from "./pages/auth/ResetPassword";

import Home from "./pages/student/Home";
import CourseList from "./pages/student/CoursesList";
import CategoryCourses from "./pages/student/CategoryCourses";
import CourseDetails from "./pages/student/CourseDetails";
import CheckoutPage from "./pages/student/CheckoutPage";
import MyEnrollments from "./pages/student/MyEnrollments";
import Player from "./pages/student/Player";
import QuizPage from "./pages/student/QuizPage";
import VerifyCertificate from "./pages/student/VerifyCertificate";

import Educator from "./pages/educator/Educator";
import EducatorDashboard from "./pages/educator/Dashboard";
import AddCourse from "./pages/educator/AddCourse";
import EditCourse from "./pages/educator/EditCourse";
import MyCourses from "./pages/educator/MyCourses";
import StudentsEnrolled from "./pages/educator/StudentsEnrolled";
import LessonAnalytics from "./pages/educator/LessonAnalytics";
import RevenueAnalytics from "./pages/educator/RevenueAnalytics";
import QuizAnalytics from "./pages/educator/QuizAnalytics";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CategoryManager from "./pages/admin/CategoryManager";
import InstructorApplications from "./pages/admin/InstructorApplications";
import AuditLogs from "./pages/admin/AuditLogs";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/" element={<Home />} />
            <Route path="/course-list" element={<CourseList />} />
            <Route path="/course-list/:input" element={<CourseList />} />
            <Route path="/category/:slug" element={<CategoryCourses />} />
            <Route path="/course/:id" element={<CourseDetails />} />
            <Route path="/verify/:code" element={<VerifyCertificate />} />

            <Route
              path="/checkout/:courseId"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-enrollments"
              element={
                <ProtectedRoute>
                  <MyEnrollments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/player/:courseId"
              element={
                <ProtectedRoute>
                  <Player />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:lessonId"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/educator"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <Educator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/dashboard"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <EducatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/add-course"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <AddCourse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/edit-course/:courseId"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <EditCourse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/my-courses"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <MyCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/students-enrolled"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <StudentsEnrolled />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/course/:courseId/analytics/lessons"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <LessonAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/course/:courseId/analytics/revenue"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <RevenueAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/educator/course/:courseId/analytics/quiz-stats"
              element={
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <QuizAnalytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="categories" element={<CategoryManager />} />
              <Route path="instructor-applications" element={<InstructorApplications />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
          </Routes>
          <Toast />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
