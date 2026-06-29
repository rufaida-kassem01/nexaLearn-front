import { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { getStreak } from "../../services/streakService";
import NotificationBell from "../NotificationBell";

const UserMenu = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center hover:bg-blue-700 transition"
      >
        {user.email?.[0]?.toUpperCase() ?? "U"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-custom-card border border-gray-100 py-1 z-50">
          <p className="px-4 py-2 text-xs text-gray-400 truncate">{user.email}</p>
          <hr className="border-gray-100" />
          <button
            onClick={onSignOut}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEducator } = useContext(AppContext);
  const { user, logout } = useAuth();
  
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    if (!user) {
      setStreakData(null);
      return;
    }
    getStreak()
      .then(setStreakData)
      .catch(() => {});
  }, [user]);

  const isCourseListPage = location.pathname.includes("/course-list");
  const isEducatorRoute = location.pathname.includes("/educator");
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";
  
  // Hide navbar on educator and auth routes
  if (isEducatorRoute || isAuthRoute) {
    return null;
  }

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div
      className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${
        isCourseListPage ? "bg-white" : "bg-cyan-100"
      }`}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => navigate("/")}
      >
        <img src={assets.logo} alt="Logo" className="h-10 w-auto object-contain" />
        <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          NexaLearn
        </span>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-5 text-gray-500">
        {user && (
          <>
            <button onClick={() => navigate("/educator")}>
              {isEducator ? "Educator Dashboard" : "Become Educator"}
            </button>
            |
            <Link to="/my-enrollments">My Enrollments</Link>
            {streakData && (
              <div className="group relative flex items-center gap-1 text-sm" title={`Longest streak: ${streakData.longestStreak} days`}>
                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C12 2 7 8 7 13c0 2.76 2.24 5 5 5s5-2.24 5-5c0-5-5-11-5-11zm0 16c-1.66 0-3-1.34-3-3 0-2.5 3-7 3-7s3 4.5 3 7c0 1.66-1.34 3-3 3z"/>
                </svg>
                <span className="text-gray-700 font-medium">{streakData.currentStreak}</span>
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  Longest streak: {streakData.longestStreak} days
                </div>
              </div>
            )}
          </>
        )}
        {user ? (
          <>
            <NotificationBell />
            <UserMenu user={user} onSignOut={handleSignOut} />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-600 font-medium hover:text-blue-600 transition text-sm"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition"
            >
              Get started
            </Link>
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        {user && (
          <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
            <button onClick={() => navigate("/educator")}>
              {isEducator ? "Educator Dashboard" : "Become Educator"}
            </button>
            |
            <Link to="/my-enrollments">My Enrollments</Link>
            {streakData && (
              <span className="flex items-center gap-0.5 text-orange-500 font-medium" title={`Longest streak: ${streakData.longestStreak} days`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C12 2 7 8 7 13c0 2.76 2.24 5 5 5s5-2.24 5-5c0-5-5-11-5-11zm0 16c-1.66 0-3-1.34-3-3 0-2.5 3-7 3-7s3 4.5 3 7c0 1.66-1.34 3-3 3z"/>
                </svg>
                {streakData.currentStreak}
              </span>
            )}
          </div>
        )}
        {user ? (
          <>
            <NotificationBell />
            <UserMenu user={user} onSignOut={handleSignOut} />
          </>
        ) : (
          <Link to="/login">
            <img src={assets.user_icon} alt="Sign in" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
