import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getVisibleNavItems } from "@/config/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_W = 180;
const CARD_H = 140;
const GAP = 12;

const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  const isDashboard =
    location.pathname === "/dashboard" || location.pathname === "/";

  const sidebarItems = getVisibleNavItems(hasPermission, hasAnyPermission, [
    "/dashboard",
  ]);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* ═══ Top Header — always visible on every page ═══ */}
      <header className="relative flex items-center px-6 py-6 flex-shrink-0 border-b border-gray-100">
        {/* Center — Logo (absolutely centered) */}
        <div className="absolute inset-0 flex items-center justify-start pointer-events-none ml-3">
          <NavLink to="/dashboard" className="pointer-events-auto">
            <img
              src="/logo.png"
              alt="Ecstatics"
              className="h-14 object-contain"
            />
          </NavLink>
        </div>

        {/* Right — User Info + Logout */}
        <div className="ml-auto flex items-center gap-3 relative z-10">
          <div className="text-right">
            <p className="text-xs font-normal text-gray-700">{user?.name}</p>
            <p className="text-[10px] text-gray-400">
              {user?.role?.displayName}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(224,107,10,0.15)" }}
          >
            <span className="text-sm font-medium" style={{ color: "#e06b0a" }}>
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-white "
            title="Logout"
            style={{ background: "#e06b0a" }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ═══ Body ═══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar — only on non-dashboard pages */}
        {!isDashboard && (
          <aside
            className="flex-shrink-0 flex flex-col h-full bg-background"
            style={{ width: `${CARD_W + GAP * 2}px` }}
          >
            {/* Nav — scrollable cards */}
            <nav
              className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin min-h-0"
              style={{ paddingBottom: `${GAP}px`, paddingLeft: `${GAP}px`, paddingRight: `${GAP}px`,gap: `${GAP}px` }}
            >
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col justify-between p-4 transition-all duration-200 flex-shrink-0",
                      isActive
                        ? "bg-white/15 border-white/30"
                        : "border-transparent hover:bg-white/10"
                    )
                  }
                  style={{
                    width: `${CARD_W}px`,
                    height: `${CARD_H}px`,
                    border: "1px solid transparent",
                    background: "#e06b0a",
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className="h-8 w-8"
                        style={{ color: "#d9d9d9" }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isActive ? "#fff" : "#d9d9d9" }}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
              <div
                className="flex-shrink-0"
                style={{ height: `${GAP}px` }}
              />
            </nav>
          </aside>
        )}

        {/* ═══ Content ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            {isDashboard ? (
              <Outlet />
            ) : (
              <div className="p-4 md:p-6 lg:p-4 max-w-[1600px] mx-auto">
                <Outlet />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;