// src/layouts/AdminLayout.tsx
import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getVisibleNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

// ═══ Same constants as Dashboard ═══
const CARD_W = 170;
const CARD_H = 146;
const PAD = 5;
const BG = "#e06b0a";

const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  const isDashboard =
    location.pathname === "/dashboard" || location.pathname === "/";

  const sidebarItems = getVisibleNavItems(hasPermission, hasAnyPermission, [
    "/dashboard",
  ]);

  return (
    <div className="flex flex-col h-dvh bg-white overflow-hidden">
      {/* ═══ Top Header ═══ */}
      <header className="relative flex items-center  py-3 flex-shrink-0 m-3">
        <div className="absolute inset-0 flex items-center justify-start pointer-events-none ">
          <NavLink to="/dashboard" className="pointer-events-auto">
            <img
              src="/logo.png"
              alt="Ecstatics"
              className="h-14 object-contain"
            />
          </NavLink>
        </div>

        <div className="ml-auto flex items-center gap-2 relative z-10">
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {user?.role?.displayName}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(224,107,10,0.15)" }}
          >
            <span className="text-xs font-semibold" style={{ color: BG }}>
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="h-7 px-2 text-xs transition-colors hover:opacity-90 text-white font-medium"
            title="Logout"
            style={{ background: BG }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ═══ Body ═══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ─── Sidebar (non-dashboard pages) ─── */}
        {!isDashboard && (
          <aside
            className="flex-shrink-0 flex flex-col h-full"
            style={{ width: `${CARD_W + PAD * 2}px` }}
          >
            <nav
              className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin min-h-0"
            >
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={{ padding: PAD }}
                  className="flex-shrink-0"
                >
                  {({ isActive }) => (
                    <div
                      className={cn(
                        "flex flex-col justify-between p-4 transition-all duration-200",
                        isActive
                          ? "border-white/30 shadow-lg"
                          : "border-transparent hover:border-white/30 hover:shadow-lg"
                      )}
                      style={{
                        background: BG,
                        width: CARD_W,
                        height: CARD_H,
                        border: "1px solid transparent",
                      }}
                    >
                      <item.icon
                        className="h-8 w-8"
                        style={{ color: "#d9d9d9" }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: isActive ? "#fff" : "#d9d9d9",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  )}
                </NavLink>
              ))}

              {/* ═══ Filler — same orange below nav cards ═══ */}
              <div
                style={{
                  flexGrow: 1,
                  minHeight: 0,
                  padding: PAD,
                  display: "flex",
                }}
              >
                <div style={{ background: BG, flex: 1, minHeight: 0 }} />
              </div>
            </nav>
          </aside>
        )}

        {/* ─── Content ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            {isDashboard ? (
              <Outlet />
            ) : (
              <div className="px-4 md:px-6 lg:px-4 max-w-[1600px] mx-auto pt-1">
                <Outlet />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ═══ Footer — visible on EVERY page ═══ */}
      <footer className="py-2 text-center flex-shrink-0 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Ecstatics Spaces India Pvt. Ltd.
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
