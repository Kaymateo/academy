import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAdminSession, getAdminToken } from '../lib/api.js';
import { IconLogo, IconArrowRight } from '../components/Icons.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 已有有效会话则直接进入后台（30 分钟内无需重复登录）
  useEffect(() => {
    if (!getAdminToken()) return;
    api.get('/api/admin/me', { admin: true })
      .then(() => nav('/admin', { replace: true }))
      .catch(() => {});
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('请输入账号和密码'); return; }
    setLoading(true);
    try {
      const r = await api.post('/api/admin/login', { username, password });
      setAdminSession(r.data.token, r.data.username);
      toast.success('欢迎回来');
      nav('/admin');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit} noValidate>
        <div className="logo"><IconLogo width="36" height="36" /><span style={{ fontSize: 20, fontWeight: 700 }}>拾光学院</span></div>
        <h1>管理后台</h1>
        <p className="sub">登录以管理课程与兑换码</p>

        <div className="field">
          <label htmlFor="username">账号</label>
          <input
            id="username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            placeholder="请输入管理员账号"
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
          {error && <div className="hint" style={{ color: 'var(--danger)' }}>{error}</div>}
        </div>

        <button className="btn lg" style={{ width: '100%' }} type="submit" disabled={loading}>
          {loading ? '登录中…' : '登录'} {!loading && <IconArrowRight width="16" height="16" />}
        </button>
      </form>
    </div>
  );
}
