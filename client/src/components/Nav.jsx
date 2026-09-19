import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { IconLogo } from './Icons.jsx';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 路由变化时收起菜单并回到顶部
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [loc.pathname]);

  const links = [
    { to: '/', label: '首页' },
    { to: '/courses', label: '全部课程' },
    { to: '/redeem', label: '兑换中心' },
  ];

  return (
    <>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <IconLogo />
            <span>拾光学院</span>
          </Link>

          <nav className="nav-links">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/admin" className="nav-admin" title="管理后台">管理</Link>
            <Link to="/redeem" className="nav-cta">兑换课程</Link>
          </nav>

          <button
            className={`nav-burger ${open ? 'open' : ''}`}
            aria-label="菜单"
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`nav-drawer ${open ? 'open' : ''}`}>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
        ))}
        <Link to="/admin" style={{ color: 'var(--text-3)' }}>管理后台</Link>
        <Link to="/redeem" style={{ color: 'var(--link)', fontWeight: 600 }}>兑换课程</Link>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>© {new Date().getFullYear()} 拾光学院 · 用知识点亮旅程</div>
        <div className="footer-links">
          <Link to="/courses">课程</Link>
          <Link to="/redeem">兑换中心</Link>
          <Link to="/admin" style={{ color: 'var(--text-3)' }}>管理后台</Link>
        </div>
      </div>
    </footer>
  );
}
