import { NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import Navbar from "../../components/student/Navbar";
import Footer from "../../components/student/Footer";

const sidebarItems = [
  { name: "Dashboard", path: "/admin", icon: assets.home_icon },
  { name: "Categories", path: "/admin/categories", icon: assets.add_icon },
  { name: "Applications", path: "/admin/instructor-applications", icon: assets.user_icon },
];

const AdminSidebar = () => (
  <div className="md:w-64 w-16 border-r min-h-screen text-base border-gray-500 py-2 flex flex-col">
    {sidebarItems.map((item) => (
      <NavLink
        to={item.path}
        key={item.name}
        end={item.path === "/admin"}
        className={({ isActive }) =>
          `flex items-center md:gap-3 gap-0 px-4 py-3 hover:bg-gray-100 ${isActive ? "bg-blue-100 border-r-4 border-blue-500 text-blue-600" : "text-gray-600"}`
        }
      >
        <img src={item.icon} alt="" className="w-6 h-6" />
        <p className="md:block hidden text-center">{item.name}</p>
      </NavLink>
    ))}
  </div>
);

const AdminLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
    <Footer />
  </div>
);

export default AdminLayout;
