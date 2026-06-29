import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAuth } from "../../context/AuthContext";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3">
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="w-28 lg:w-32" />
      </Link>
      <div className="flex items-center gap-3 text-gray-500">
        <p className="hidden sm:block truncate max-w-48">
          Hi! {user?.email ?? "Educator"}
        </p>
        {user ? (
          <>
            <NotificationBell />
            <UserMenu user={user} onSignOut={handleSignOut} />
          </>
        ) : (
          <img className="max-w-8" src={assets.profile_img} alt="" />
        )}
      </div>
    </div>
  );
};

export default Navbar;
