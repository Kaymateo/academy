import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getAdminToken, getAdminUser, clearAdminSession, api } from '../../lib/api.js';
import { IconLogo, IconLogout } from '../../components/Icons.jsx';
import { useToast } from '../../components/Toast.jsx';

const TABS = [
  { to: '/admin', label: '概览', end: true },
  { to: '/admin/videos', label: '课程管理' },
  { to: '/admin/codes', label: '兑换码' },
  { to: '/admin/records', label: '兑换记录' },
];

export default function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [authed, setAuthed] = useState(null); // null=检查中

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { setAuthed(false); return; }
    api.get('/api/admin/me', { admin: true })
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, [loc.pathname]);

  if (authed === null) {
    return <div className="admin-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-3)' }}>正在验证登录…</div>;
  }
  if (authed === false) return <Navigate to="/login" replace />;

  const logout = () => {
    clearAdminSession();
    toast.success('已退出登录');
    nav('/login');
  };

  return (
    <div className="admin-shell">
      <header className="nav">
        <div className="nav-inner">
          <NavLink to="/admin" className="nav-logo"><IconLogo /> <span>管理后台</span></NavLink>
          <div className="nav-links">
            <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{getAdminUser()}</span>
            <button className="icon-btn" onClick={logout} title="退出登录"><IconLogout /></button>
            <NavLink to="/" style={{ fontSize: 13 }}>查看前台 →</NavLink>
          </div>
        </div>
      </header>

      <div className="admin-body">
        <div className="admin-tabs">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `admin-tab ${isActive ? 'active' : ''}`}>
              {t.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
