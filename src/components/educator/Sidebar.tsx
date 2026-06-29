import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

const Sidebar = () => {
  const { isEducator } = useContext(AppContext);

  const menuItems: MenuItem[] = [
    { name: "Dashboard", path: "/educator", icon: assets.home_icon },
    { name: "Add Course", path: "/educator/add-course", icon: assets.add_icon },
    {
      name: "My Courses",
      path: "/educator/my-courses",
      icon: assets.my_course_icon,
    },
    {
      name: "Student Enrolled",
      path: "/educator/student-enrolled",
      icon: assets.person_tick_icon,
    },
  ];

  return (
    isEducator && (
      <div className="md:w-64 w-16 border-r min-h-screen text-base border-gray-500 py-2 flex flex-col">
        {menuItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.name}
            end={item.path === "/educator"}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center md:gap-3 gap-0 px-4 py-3 hover:bg-gray-100 ${isActive ? "bg-blue-100 border-r-4 border-blue-500 text-blue-600" : "text-gray-600"}`
            }
          >
            <img src={item.icon} alt="" className="w-6 h-6" />
            <p className="md:block hidden text-center">{item.name}</p>
          </NavLink>
        ))}
      </div>
    )
  );
};

export default Sidebar;
