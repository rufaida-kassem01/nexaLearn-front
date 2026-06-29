import { useContext, useState, useRef, useEffect } from "react";
import type { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getStreak } from "../../services/streakService";
import type { Streak } from "../../types";
import NotificationBell from "../NotificationBell";

interface UserMenuProps {
  user: { email: string };
  onSignOut: () => void;
}

const UserMenu: FC<UserMenuProps> = ({ user, onSignOut }) => {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-custom-card border border-gray-100 dark:border-gray-700 py-1 z-50">
          <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
          <hr className="border-gray-100 dark:border-gray-700" />
          <button
            onClick={onSignOut}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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
  const { theme, toggleTheme } = useTheme();

  const [streakData, setStreakData] = useState<Streak | null>(null);

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

  if (isEducatorRoute || isAuthRoute) {
    return null;
  }

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div
      className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 dark:border-gray-700 py-4 ${
        isCourseListPage ? "bg-white dark:bg-slate-800" : "bg-cyan-100 dark:bg-slate-800"
      }`}
    >
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => navigate("/")}
      >
        <img src={assets.logo} alt="Logo" className="h-10 w-auto object-contain" />
        <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          NexaLearn
        </span>
      </div>

      <div className="hidden md:flex items-center gap-5 text-gray-500">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          )}
        </button>
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

      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          )}
        </button>
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
