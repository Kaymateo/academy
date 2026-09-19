import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../lib/api.js';
import { setUnlockToken } from '../lib/unlock.js';
import { IconTicket, IconCheck, IconArrowRight } from '../components/Icons.jsx';

export default function Redeem() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();

  const courseId = params.get('course') || '';
  const [code, setCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { courseId, durationDays, expiresAt, message }
  const inputRef = useRef(null);

  // 预填课程信息
  useEffect(() => {
    if (courseId) {
      api.get(`/api/videos/${courseId}`)
        .then((r) => setCourseTitle(r.data.title))
        .catch(() => {});
    } else {
      setCourseTitle('');
    }
  }, [courseId]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // 输入自动格式化：字母数字自动大写，屏蔽非法字符
  const handleChange = (e) => {
    setError('');
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) parts.push(raw.slice(i, i + 4));
    setCode(parts.join('-').slice(0, 19));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    handleChange({ target: { value: text } });
  };

  const submit = async () => {
    const normalized = code.replace(/-/g, '');
    if (normalized.length < 12) {
      setError('请输入完整有效的兑换码');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/api/redeem', {
        code,
        courseId: courseId ? Number(courseId) : 0,
        device: navigator.userAgent.slice(0, 120),
      });
      const d = r.data;
      setUnlockToken(d.courseId, d.token); // 全站码存 0，单课程码存课程 id
      setResult(d);
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="section" style={{ paddingTop: 80, paddingBottom: 48 }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 640 }}>
          <Reveal>
            <div className="hero-badge" style={{ marginBottom: 20 }}>
              <IconTicket width="14" height="14" /> 兑换中心
            </div>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: 12 }}>
              兑换课程
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 17, marginBottom: 8 }}>
              输入兑换码，解锁你的专属课程
            </p>
            {courseTitle && (
              <p style={{ fontSize: 15, color: 'var(--link)' }}>
                当前将解锁：<strong>{courseTitle}</strong>
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8, paddingBottom: 120 }}>
        <div className="container">
          <Reveal>
            <div className="redeem-box">
              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="code">兑换码</label>
                <input
                  id="code"
                  ref={inputRef}
                  className={`code-input ${error ? 'error' : ''}`}
                  value={code}
                  onChange={handleChange}
                  onPaste={handlePaste}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="hint" style={{ textAlign: 'center' }}>
                  兑换码为 16 位字符，形如 A1B2-C3D4-E5F6-G7H8
                </div>
              </div>

              {courseId ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>
                  该兑换码将用于解锁所选课程
                </p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>
                  若兑换码绑定指定课程，请先在课程页面发起兑换
                </p>
              )}

              <button className="btn lg" style={{ width: '100%' }} onClick={submit} disabled={loading}>
                {loading ? '兑换中…' : '立即兑换'}
                {!loading && <IconArrowRight width="16" height="16" />}
              </button>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <Link to="/courses" style={{ fontSize: 13 }}>还没有兑换码？先看看课程 →</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 兑换成功弹窗 */}
      <Modal
        open={Boolean(result)}
        type="success"
        title="兑换成功"
        onClose={() => { setResult(null); nav('/courses'); }}
        actions={
          <button
            className="btn"
            style={{ marginTop: 18, width: '100%' }}
            onClick={() => {
              const target = result?.courseId && result.courseId !== 0
                ? `/watch/${result.courseId}`
                : (courseId ? `/watch/${courseId}` : '/courses');
              setResult(null);
              nav(target);
            }}
          >
            {result?.courseId || courseId ? '立即观看' : '前往课程列表'} <IconArrowRight width="16" height="16" />
          </button>
        }
      >
        {result && (
          <>
            <p>
              课程已解锁，有效期为 <strong>{result.durationDays} 天</strong>（至 {new Date(result.expiresAt).toLocaleDateString('zh-CN')}）。
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>解锁状态已保存到当前设备，可在有效期内反复观看。</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12,
              background: '#f5f7fa', borderRadius: 12, padding: '8px 16px', fontSize: 13, color: 'var(--text-2)',
            }}>
              <IconCheck width="14" height="14" /> 已解锁
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
