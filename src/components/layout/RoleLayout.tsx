import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Users, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_W = 180;
const CARD_H = 140;
const GAP = 12;

const SIDEBAR_ITEMS = [
  { path: "/customers", label: "Client", icon: Users },
  { path: "/projects", label: "Project", icon: FolderKanban },
];

const RoleLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isDashboard =
    location.pathname === "/dashboard" || location.pathname === "/";

  if (isDashboard) {
    return (
      <div className="h-screen overflow-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* ═══ Sidebar — always open, same card size as dashboard ═══ */}
      <aside
        className="flex-shrink-0 flex flex-col h-screen bg-background"
        style={{
          width: `${CARD_W + GAP * 2}px`,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ padding: `${GAP}px` }}
        >
          <NavLink to="/dashboard">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-28 object-contain"
            />
          </NavLink>
        </div>

        {/* Nav — same size cards as dashboard */}
        <nav
          className="flex flex-col flex-shrink-0"
          style={{ padding: `0 ${GAP}px`, gap: `${GAP}px` }}
        >
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col justify-between p-4 transition-all duration-200",
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
                    className="text-xs font-normal"
                    style={{ color: isActive ? "#fff" : "#d9d9d9" }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User — same card size */}
        <div style={{ padding: `0 ${GAP}px ${GAP}px`,  }} >
          <div
            className="flex flex-col justify-between p-4"
            style={{
              width: `${CARD_W}px`,
              height: `${CARD_H}px`,
              background: "#e06b0a",
            }}
          >
            <div className="flex items-center gap-3" style={{}}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <span className="text-sm" style={{ color: "#d9d9d9" }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs font-normal truncate"
                  style={{ color: "#d9d9d9" }}
                >
                  {user?.name}
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: "rgba(217,217,217,0.5)" }}
                >
                  {user?.role?.displayName}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 transition-colors hover:opacity-70"
            >
              <LogOut className="h-4 w-4" style={{ color: "#d9d9d9" }} />
              <span
                className="text-xs font-normal"
                style={{ color: "#d9d9d9" }}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ Content ═══ */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoleLayout;