import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Loading from "./components/student/Loading";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import Navbar from "./components/student/Navbar";
import { ToastProvider } from "./context/ToastContext.jsx";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ResetPassword from "./pages/auth/ResetPassword";
import AddCourse from "./pages/educator/AddCourse";
import EditCourse from "./pages/educator/EditCourse";
import Dashboard from "./pages/educator/Dashboard";
import Educator from "./pages/educator/Educator";
import LessonAnalytics from "./pages/educator/LessonAnalytics";
import MyCourses from "./pages/educator/MyCourses";
import QuizAnalytics from "./pages/educator/QuizAnalytics";
import RevenueAnalytics from "./pages/educator/RevenueAnalytics";
import StudentsEnrolled from "./pages/educator/StudentsEnrolled";
import CheckoutPage from "./pages/student/CheckoutPage";
import CourseDetails from "./pages/student/CourseDetails";
import CoursesList from "./pages/student/CoursesList";
import CategoryCourses from "./pages/student/CategoryCourses";
import Home from "./pages/student/Home";
import MyEnrollments from "./pages/student/MyEnrollments";
import Player from "./pages/student/Player";
import QuizPage from "./pages/student/QuizPage";
import VerifyCertificate from "./pages/student/VerifyCertificate";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CategoryManager from "./pages/admin/CategoryManager";
import InstructorApplications from "./pages/admin/InstructorApplications";
import "quill/dist/quill.snow.css";

const App = () => {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="text-default min-h-screen bg-white">
          <Navbar />
          <Toast />
          <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Student */}
          <Route path="/" element={<Home />} />
          <Route path="/course-list" element={<CoursesList />} />
          <Route path="/course-list/:input" element={<CoursesList />} />
          <Route path="/category/:slug" element={<CategoryCourses />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route
            path="/checkout/:courseId"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route path="/verify/:code" element={<VerifyCertificate />} />
          <Route
            path="/my-enrollments"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <MyEnrollments />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/player/:courseId"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <Player />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route
            path="/quiz/:lessonId"
            element={
              <ErrorBoundary>
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route path="/loading/:path" element={<Loading />} />

          {/* Educator */}
          <Route
            path="/educator"
            element={
              <ErrorBoundary>
                <ProtectedRoute requiredRole="INSTRUCTOR">
                  <Educator />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="add-course" element={<AddCourse />} />
            <Route path="edit-course/:courseId" element={<EditCourse />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="student-enrolled" element={<StudentsEnrolled />} />
            <Route path="course/:courseId/analytics/lessons" element={<LessonAnalytics />} />
            <Route path="course/:courseId/analytics/revenue" element={<RevenueAnalytics />} />
            <Route path="course/:courseId/analytics/quiz-stats" element={<QuizAnalytics />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="instructor-applications" element={<InstructorApplications />} />
          </Route>
          </Routes>
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
};

export default App;
