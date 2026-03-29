import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import API from "../../utils/api";
import "./navbar.css";
import { Menu, X, ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const normalizeRole = (value) => (value || "").trim().toLowerCase();

const getRoleFromToken = (token) => {
  if (!token) {
    return "";
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return "";
    }

    const decodedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(decodedPayload));
    return normalizeRole(parsed?.role);
  } catch {
    return "";
  }
};

const getAuthFromStorage = () => {
  const token = localStorage.getItem("token");
  const storedRole = normalizeRole(localStorage.getItem("role"));

  return {
    token,
    role: storedRole || getRoleFromToken(token),
    name: localStorage.getItem("name"),
    avatar: localStorage.getItem("avatar") || "",
  };
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const navbarRef = useRef(null);

  const [auth, setAuth] = useState(getAuthFromStorage);

  const { token, role, name, avatar } = auth;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync auth state after navigation and cross-tab/same-tab auth updates.
  useEffect(() => {
    setAuth(getAuthFromStorage());
  }, [location.pathname]);

  useEffect(() => {
    const syncAuth = () => setAuth(getAuthFromStorage());

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  // Keep navbar avatar in sync with backend profile data.
  useEffect(() => {
    let isMounted = true;

    const syncAvatar = async () => {
      if (!token) {
        return;
      }

      try {
        const { data } = await API.get("/user/profile");
        const nextAvatar = data?.avatar || "";
        if (!isMounted) {
          return;
        }

        localStorage.setItem("avatar", nextAvatar);
        setAuth((prev) => ({ ...prev, avatar: nextAvatar }));
      } catch {
        // Ignore avatar sync failures to avoid impacting navbar UX.
      }
    };

    syncAvatar();

    return () => {
      isMounted = false;
    };
  }, [token, location.pathname]);

  // Keep outside-click active only while dropdown is open.
  useEffect(() => {
    if (!dropdownOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Keep a real navbar height variable for all sticky/fixed layout offsets.
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (!navbarRef.current) return;
      const nextHeight = Math.ceil(navbarRef.current.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--app-navbar-height", `${nextHeight}px`);
    };

    updateNavbarHeight();

    let observer;
    if (window.ResizeObserver && navbarRef.current) {
      observer = new ResizeObserver(updateNavbarHeight);
      observer.observe(navbarRef.current);
    }

    window.addEventListener("resize", updateNavbarHeight);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateNavbarHeight);
    };
  }, [mobileMenuOpen, location.pathname, token, role, name]);

  // Prevent background scroll when mobile menu is open.
  useEffect(() => {
    if (window.innerWidth > 992) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("avatar");
    setAuth({ token: null, role: null, name: null });
    window.dispatchEvent(new Event("auth-changed"));
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      "Hello! I want to know more about your courses."
    );
    window.open(`https://wa.me/8817457938?text=${msg}`, "_blank");
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Courses", to: "/courses" },
    { label: "Free Materials", to: "/freematerial" },
    { label: "Contact", to: "/contact"} ,
    {  label:"enquiry",to:"/enquiry"},
  
  ];

  const studentLinks = [
    { label: "My Batches", to: "/mybatches" },
  ];

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
      return "";
    }

    if (/^https?:\/\//i.test(avatarPath)) {
      return avatarPath;
    }

    const base = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/$/, "");
    const normalizedPath = avatarPath.replace(/\\/g, "/");
    const finalPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
    return `${base}${finalPath}`;
  };

  const avatarUrl = getAvatarUrl(avatar);

  return (
    <nav className="navbar" ref={navbarRef}>
      <div className="navbar-container">

        {/* LOGO */}
        <Link to="/" className="navbar-logo">
          <motion.div className="logo-text" whileHover={{ scale: 1.05 }}>
            🎓 BRSaiNa
          </motion.div>
        </Link>

        {/* CENTER */}
        <div className="navbar-center">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {token && role === "student" &&
            studentLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}

          {token && role === "admin" && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `nav-link admin-link${isActive ? " active" : ""}`
              }
            >
              Admin Panel
            </NavLink>
          )}
        </div>

        {/* RIGHT SECTION - CTA, WHATSAPP & PROFILE */}
        <div className="navbar-right">
          {!token ? (
            <>
              {/* PRIMARY CTA BUTTON */}
              <button
                className="btn-get-demo"
                onClick={handleWhatsApp}
              >
                Get Free Demo
              </button>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Register</Link>
            </>
          ) : (
            <>
              {/* WHATSAPP BUTTON FOR LOGGED IN USERS */}
             

              {/* USER DROPDOWN */}
              <div className="user-dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-btn"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <div
                    className="user-avatar-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDropdownOpen(false);
                      navigate("/profile");
                    }}
                    role="button"
                    tabIndex="0"
                    aria-label="Go to profile"
                  >
                    <span className="user-initial">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile avatar"
                          className="user-avatar-image"
                        />
                      ) : (
                        name ? name.charAt(0).toUpperCase() : "U"
                      )}
                    </span>
                  </div>
                  <span className="user-name">{name || "User"}</span>
                  <ChevronDown size={16} className={dropdownOpen ? "open" : ""} />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown-menu">
                    <Link
                      to="/profile"
                      className="user-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>

                    {role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        className="user-dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin
                      </Link>
                    )}

                    <button
                      type="button"
                      className="user-dropdown-item user-logout-item"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            className="navbar-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu open"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mobile-menu-content">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `mobile-nav-link${isActive ? " active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {token && role === "student" &&
                studentLinks.map((link) => (
                  <NavLink
                    key={`mobile-${link.to}`}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `mobile-nav-link${isActive ? " active" : ""}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

              {token && role === "admin" && (
                <NavLink
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `mobile-nav-link${isActive ? " active" : ""}`
                  }
                >
                  Admin Panel
                </NavLink>
              )}

              {!token ? (
                <>
                  <button
                    className="btn-get-demo"
                    style={{ width: "100%", marginTop: "8px" }}
                    onClick={() => {
                      handleWhatsApp();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Get Free Demo
                  </button>
                  <Link
                    to="/login"
                    className="mobile-btn-login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="mobile-btn-register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <div className="mobile-user-summary">
                    <div className="mobile-user-avatar">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile avatar"
                          className="user-avatar-image"
                        />
                      ) : (
                        name ? name.charAt(0).toUpperCase() : "U"
                      )}
                    </div>
                    <div className="mobile-user-meta">
                      <span className="mobile-user-name">{name || "User"}</span>
                      <span className="mobile-user-role">{role || "student"}</span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="mobile-nav-link mobile-logout-btn"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;