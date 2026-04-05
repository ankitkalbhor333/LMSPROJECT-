import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./adminlayout.css";
import "./adminTheme.css";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navbarHeight, setNavbarHeight] = useState(72);

  const quickLinks = [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "All Courses", to: "/admin/courses" },
    { label: "Create Course", to: "/admin/create-course" },
    { label: "Create Test", to: "/admin/create-test" },
    { label: "Enquiries", to: "/admin/enquiries" },
    { label: "Initial Enquiries", to: "/admin/initial-enquiries" },
    { label: "Contacts", to: "/admin/contacts" },
  ];

  useEffect(() => {
    const syncSidebarForViewport = () => {
      if (window.innerWidth <= 992) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    syncSidebarForViewport();
    window.addEventListener("resize", syncSidebarForViewport);
    return () => window.removeEventListener("resize", syncSidebarForViewport);
  }, []);

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector(".navbar");
      const nextHeight = navbar
        ? Math.ceil(navbar.getBoundingClientRect().height)
        : 72;
      setNavbarHeight(nextHeight);
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 992) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className={`admin-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      style={{ "--layout-navbar-height": `${navbarHeight}px` }}
    >
      <div
        className={`admin-sidebar-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <h4>Admin Panel</h4>

        <ul className="nav flex-column">

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/dashboard" onClick={handleNavClick}>
              Dashboard
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/create-course" onClick={handleNavClick}>
              Create Course
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/courses" onClick={handleNavClick}>
              All Courses
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/course-builder" onClick={handleNavClick}>
              Course Builder
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/create-test" onClick={handleNavClick}>
              Create Test
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/students" onClick={handleNavClick}>
              Students
            </NavLink>
          </li>

          <li className="sidebar-section-title">
           Free Study Material upload
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/upload-video" onClick={handleNavClick}>
              Upload Video
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/upload-notes" onClick={handleNavClick}>
              Upload Notes
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/upload-test" onClick={handleNavClick}>
              Create free Test
            </NavLink>
          </li>

          <li className="sidebar-section-title">
           Lead Management
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/enquiries" onClick={handleNavClick}>
              📋 Enquiries
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink className="nav-link" to="/admin/contacts" onClick={handleNavClick}>
              💬 Contacts
            </NavLink>
          </li>

        </ul>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <div className="admin-topbar">
          <button
            type="button"
            className="admin-hamburger-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Close admin menu" : "Open admin menu"}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <span className="admin-topbar-title">Quick Nav</span>
          <nav className="admin-topbar-links" aria-label="Admin quick navigation">
            {quickLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `admin-topbar-link${isActive ? " active" : ""}`}
                onClick={handleNavClick}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;