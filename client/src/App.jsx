import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { EnrollmentProvider } from "./contexts/EnrollmentContext";
import { ToastProvider } from "./contexts/ToastContext";
import Toast from "./components/Toast";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import MyBatches from "./pages/student/MyBatches";
import CoursePlayer from "./pages/student/CoursePlayer";
import BatchEntryDashboard from "./pages/BatchEntryDashboard";
import UserProfile from "./pages/UserProfile";
import Leaderboard from "./pages/Leaderboard";
import ProtectedRoute from "./components/ProtectedRoute";
import InitialEnquiryGuard from "./components/InitialEnquiryGuard";
import Navbar from "./components/homecomponent/Navbar";
import Home from "./pages/Home";
import AttemptTest from "./pages/AttemptTest";
import UpcomingFeaturePage from "./pages/UpcomingFeaturePage";
import Enquiry from "./pages/Enquiry";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminContacts from "./pages/admin/AdminContacts";
import CreateCourse from "./pages/admin/CreateCourse";
import CoursesList from "./pages/admin/CourseList";
import EditCourse from "./pages/admin/EditCourse";
import CourseBuilderAdmin from "./pages/admin/CourseBuilderAdmin";
import AdminTests from "./pages/admin/AdminTests";
import AdminStudents from "./pages/admin/AdminStudents";
import UploadVideo from "./pages/admin/UploadVideo";
import UploadNotes from "./pages/admin/UploadNotes";
import CreateFreeTest from "./pages/admin/CreatefreeTest";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import FreeStudyMaterial from "./pages/freematerial/FreeStudyMaterial";
import ContactPage from "./components/contactPage";
import CheckoutPage from "./components/payment/CheckoutPage";
import PaymentSuccess from "./components/payment/PaymentSuccess";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: 'block',
          width: '100%',
          minHeight: '100vh',
          position: 'relative',
          background: '#f9fafb'
        }}
      >
        <Routes location={location}>

          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/freematerial" element={<FreeStudyMaterial />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/enquiry" element={<Enquiry />} />

          {/* ================= INITIAL ENQUIRY FLOW (After Registration) ================= */}
          <Route
            path="/initial-enquiry"
            element={<InitialEnquiryGuard />}
          />

          {/* ================= PAYMENT ROUTES ================= */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute role={["student", "admin"]}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route path="/payment/success" element={<PaymentSuccess />} />
            
          <Route
            path="/mybatches"
            element={
              <ProtectedRoute role={["student", "admin"]}>
                <MyBatches />
              </ProtectedRoute>
            }
          />
         

          <Route
            path="/batch/:batchId"
            element={
              <ProtectedRoute role={["student", "admin"]}>
                <BatchEntryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/course-player/:courseId"
            element={
              <ProtectedRoute role={["student", "admin"]}>
                <CoursePlayer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attempt/:id"
            element={
              <ProtectedRoute role="student">
                <AttemptTest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/live-class/:batchId"
            element={
              <ProtectedRoute role="student">
                <UpcomingFeaturePage featureKey="live-class" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/test/:batchId"
            element={
              <ProtectedRoute role="student">
                <UpcomingFeaturePage featureKey="test" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/community/:batchId"
            element={
              <ProtectedRoute role="student">
                <UpcomingFeaturePage featureKey="community" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/comunity/:batchId"
            element={
              <ProtectedRoute role="student">
                <UpcomingFeaturePage featureKey="comunity" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doubts/:batchId"
            element={
              <ProtectedRoute role="student">
                <UpcomingFeaturePage featureKey="doubts" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard/:testId"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="create-course" element={<CreateCourse />} />
            <Route path="courses" element={<CoursesList />} />
            <Route path="edit-course/:id" element={<EditCourse />} />
            <Route path="course-builder" element={<CourseBuilderAdmin />} />
            <Route path="create-test" element={<AdminTests />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="upload-video" element={<UploadVideo />} />
            <Route path="upload-notes" element={<UploadNotes />} />
            <Route path="upload-test" element={<CreateFreeTest />} />
          </Route>

        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const toastRef = React.useRef();

  const AppLayout = () => {
    const location = useLocation();
    const hideNavbar = /^\/(login|register|forgot-password|reset-password|verify-email)/.test(
      location.pathname
    );

    return (
      <>
        {!hideNavbar ? <Navbar /> : null}
        <AnimatedRoutes />
      </>
    );
  };

  return (
    <ToastProvider>
      <Toast ref={toastRef} />
      <EnrollmentProvider>
        <Router>
          <AppLayout />
        </Router>
      </EnrollmentProvider>
    </ToastProvider>
  )
}

export default App;