import { NavLink } from "react-router-dom";
import logoImg from "../assets/logo2.jpeg";

const Sidebar = () => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "📊",
    },
    {
      name: "Products",
      path: "/products",
      icon: "📦",
    },
    {
      name: "Add Product",
      path: "/products/add",
      icon: "➕",
    },
    {
      name: "Generate Bill",
      path: "/create-bill",
      icon: "📄",
    },
    {
      name: "Payments & Orders",
      path: "/orders",
      icon: "💳",
    },
    {
      name: "Invoices",
      path: "/invoices",
      icon: "🧾",
    },
    {
      name: "User Approvals",
      path: "/admin/approvals",
      icon: "🛡️",
    },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 shadow-xl">
      {/* =================================================
          LOGO SECTION
      ================================================= */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-5">
        <div className="flex items-center gap-3 px-2">
          <img
            src={logoImg}
            alt="Vraj Creation Logo"
            className="h-10 w-10 shrink-0 rounded-lg border border-slate-700 bg-slate-800 object-cover"
          />

          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold leading-tight tracking-wide text-white">
              Vraj Creation
            </h2>

            <span className="text-xs font-medium text-indigo-400">
              Admin Panel
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          NAVIGATION MENU
      ================================================= */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <div className="flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              <span className="flex w-6 shrink-0 items-center justify-center text-lg">
                {item.icon}
              </span>

              <span className="truncate">
                {item.name}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;