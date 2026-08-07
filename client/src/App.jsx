import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { EnrollmentProvider } from "./contexts/EnrollmentContext";
import { ToastProvider } from "./contexts/ToastContext";
import Toast from "./components/Toast";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import BottomNavigation from "./components/BottomNavigation";

import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Login from "./pages/auth/Login";
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
import TestsList from "./pages/TestsList";
import UpcomingFeaturePage from "./pages/UpcomingFeaturePage";
import Enquiry from "./pages/Enquiry";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminInitialEnquiries from "./pages/admin/AdminInitialEnquiries";
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
import FreeVideoPlayer from "./pages/freematerial/FreeVideoPlayer";
import ContactPage from "./components/contactPage";
import CheckoutPage from "./components/payment/CheckoutPage";
import PaymentSuccess from "./components/payment/PaymentSuccess";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const seoByPath = {
  "/": {
    title: "BRSaiNa | Navodaya Coaching, Courses & Free Study Material",
    description:
      "BRSaiNa offers Navodaya entrance coaching, courses, free study materials, tests, and student support for learners across India.",
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  },
  "/courses": {
    title: "Courses | BRSaiNa",
    description:
      "Explore BRSaiNa courses for Navodaya entrance preparation, exam support, and guided learning.",
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  },
  "/freematerial": {
    title: "Free Study Material | BRSaiNa",
    description:
      "Download free study material and learning resources from BRSaiNa to support your Navodaya preparation.",
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  },
  "/contact": {
    title: "Contact BRSaiNa",
    description:
      "Get in touch with BRSaiNa for Navodaya coaching support, course guidance, and student queries.",
    robots: "index, follow",
  },
  "/enquiry": {
    title: "Free Counseling & Enquiry | BRSaiNa",
    description:
      "Send an enquiry to BRSaiNa for free counseling, course recommendations, and admission guidance.",
    robots: "index, follow",
  },
};

const noIndexPaths = [
  "/login",
  "/register",
  "/profile",
  "/mybatches",
  "/checkout",
  "/payment/success",
  "/admin",
  "/batch",
  "/course-player",
  "/attempt",
  "/attempt-test",
  "/live-class",
  "/test",
  "/community",
  "/comunity",
  "/doubts",
  "/leaderboard",
];

const updateMetaTag = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const updateLinkTag = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const updateSeo = (pathname) => {
  const isNoIndex = noIndexPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const seo = seoByPath[pathname] || seoByPath["/"];

  document.title = seo.title;
  updateMetaTag('meta[name="description"]', {
    name: "description",
    content: seo.description,
  });
  updateMetaTag('meta[name="robots"]', {
    name: "robots",
    content: isNoIndex ? "noindex, nofollow" : seo.robots,
  });
  updateMetaTag('meta[property="og:title"]', {
    property: "og:title",
    content: seo.title,
  });
  updateMetaTag('meta[property="og:description"]', {
    property: "og:description",
    content: seo.description,
  });
  updateMetaTag('meta[property="og:url"]', {
    property: "og:url",
    content: `https://brsaina.in${pathname}`,
  });
  updateMetaTag('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: seo.title,
  });
  updateMetaTag('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: seo.description,
  });
  updateLinkTag('link[rel="canonical"]', {
    rel: "canonical",
    href: `https://brsaina.in${pathname}`,
  });
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
          background: '#f9fafb',
          paddingBottom: '80px'
        }}
      >
        <Routes location={location}>

          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/freematerial" element={<FreeStudyMaterial />} />
          <Route path="/free-video/:videoId" element={<FreeVideoPlayer />} />
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
                <TestsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attempt-test/:id"
            element={
              <ProtectedRoute role="student">
                <AttemptTest />
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
            <Route path="initial-enquiries" element={<AdminInitialEnquiries />} />
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
    const hideNavbar = /^\/(login|register)/.test(
      location.pathname
    );

    React.useEffect(() => {
      updateSeo(location.pathname);
    }, [location.pathname]);

    return (
      <>
        {!hideNavbar ? <Navbar /> : null}
        <AnimatedRoutes />
        <BottomNavigation />
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