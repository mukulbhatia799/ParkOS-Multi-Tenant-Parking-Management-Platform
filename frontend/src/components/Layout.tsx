import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Camera,
  Receipt,
  Map,
  Users as UsersIcon,
  LogOut,
  ParkingSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Role, ROLE_LABELS } from "../types";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/locator", label: "Vehicle Locator", icon: Search },
  { to: "/cameras", label: "Cameras", icon: Camera },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/map-builder", label: "Map Builder", icon: Map },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.role === Role.CLIENT_ADMIN ? [{ to: "/users", label: "Users", icon: UsersIcon }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-accent-500 flex items-center justify-center">
            <ParkingSquare className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-slate-900">ParkOS</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-accent-50 text-accent-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-slate-100 p-3 space-y-2">
            <div className="px-2">
              <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-status-critical transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 ml-60 p-6">{children}</main>
    </div>
  );
}
