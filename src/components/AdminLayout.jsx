import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { admin: 'Admin', subadmin: 'Sub-Admin', viewer: 'Report Viewer' };
const ROLE_COLORS = { admin: 'text-indigo-600', subadmin: 'text-blue-600', viewer: 'text-amber-600' };

const allNavItems = [
  { to: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'subadmin'] },
  { to: '/organizations', label: 'Organizations', icon: '🏢', roles: ['admin', 'subadmin'] },
  { to: '/question-papers', label: 'Question Papers', icon: '📝', roles: ['admin', 'subadmin'] },
  { to: '/tests', label: 'Manage Tests', icon: '🔗', roles: ['admin', 'subadmin'] },
  { to: '/attempts', label: 'Candidate Attempts', icon: '👥', roles: ['admin', 'subadmin'] },
  { to: '/evaluate', label: 'Evaluate Written', icon: '✏️', roles: ['admin', 'subadmin'] },
  { to: '/analytics', label: 'Analytics', icon: '📈', roles: ['admin', 'subadmin'] },
  { to: '/reports', label: 'Reports', icon: '📄', roles: ['admin', 'subadmin'] },
  { to: '/users', label: 'User Management', icon: '👤', roles: ['admin'] },
  { to: '/viewer-reports', label: 'Evaluated Reports', icon: '📄', roles: ['viewer'] },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = admin?.role || 'admin';
  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar - Desktop */}
      <aside className="w-60 bg-white border-r border-gray-200 flex-shrink-0 hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">{import.meta.env.VITE_APP_NAME}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[role] || 'Admin Panel'}</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        {/* Admin info & logout */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_COLORS[role]} bg-opacity-10 ${role === 'admin' ? 'bg-indigo-100' : role === 'subadmin' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">{admin?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-600">{import.meta.env.VITE_APP_NAME}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{admin?.name}</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content - full width */}
      <main className="flex-1 w-full lg:ml-60 overflow-auto">
        <div className="p-4 pt-16 lg:pt-6 pb-6 lg:p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
