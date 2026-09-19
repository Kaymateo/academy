import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import { api, fmtDuration, timeAgo } from '../lib/api.js';
import { getUnlockToken, setUnlockToken } from '../lib/unlock.js';
import { IconLock, IconTicket, IconArrowRight } from '../components/Icons.jsx';

export default function Watch() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef(null);

  // 加载课程 + 校验解锁状态
  useEffect(() => {
    let alive = true;
    setChecking(true);
    setVideo(null);

    api.get(`/api/videos/${id}`)
      .then(async (r) => {
        if (!alive) return;
        setVideo(r.data);
        // 服务端校验 token 有效性（本地 token 可能过期/被停用）
        const localToken = getUnlockToken(Number(id));
        if (!localToken) { setUnlocked(false); return; }
        try {
          const v = await api.post('/api/verify-unlock', { token: localToken, courseId: Number(id) });
          setUnlocked(v.data.valid);
        } catch { setUnlocked(false); }
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setChecking(false));

    return () => { alive = false; };
  }, [id]);

  const streamUrl = unlocked ? `/api/videos/${id}/stream?token=${encodeURIComponent(getUnlockToken(Number(id)))}` : null;

  if (checking) {
    return (
      <div className="watch-wrap">
        <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 24 }} />
        <div className="skeleton" style={{ height: 30, width: '55%', marginTop: 28, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 16, width: '35%', marginTop: 14, borderRadius: 8 }} />
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div className="watch-wrap">
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          <IconLock width="44" height="44" />
          <p style={{ fontSize: 17, marginBottom: 20 }}>课程不存在或已下架</p>
          <Link to="/courses" className="btn">返回课程列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="watch-wrap">
      {/* 播放器 */}
      <Reveal>
        <div className="player">
          {unlocked ? (
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              autoPlay
              playsInline
              poster={video.cover_path || undefined}
            />
          ) : showPreview ? (
            <>
              <video
                ref={videoRef}
                src={`/api/videos/${id}/preview`}
                controls
                autoPlay
                playsInline
                poster={video.cover_path || undefined}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, padding: '14px 18px',
                background: 'linear-gradient(180deg, rgba(0,0,0,.72), transparent)',
                color: '#fff', fontSize: 13,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <IconLock width="13" height="13" /> 试看模式 · 前 60 秒
                </span>
                <Link to={`/redeem?course=${id}`} className="btn sm" style={{ padding: '7px 16px' }}>
                  <IconTicket width="13" height="13" /> 兑换完整课程
                </Link>
              </div>
            </>
          ) : (
            <div className="lock-overlay">
              <div className="lock-icon"><IconLock /></div>
              <h3>课程已锁定</h3>
              <p>本课程需要兑换解锁码后才能观看完整内容。可以先免费试看前 60 秒。</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
                <button className="btn ghost" onClick={() => setShowPreview(true)}>
                  试看 60 秒
                </button>
                <Link to={`/redeem?course=${id}`} className="btn lg">
                  <IconTicket width="18" height="18" /> 兑换解锁
                </Link>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* 课程信息 */}
      <Reveal delay={1}>
        <div style={{ padding: '36px 8px 0', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {video.category_name && <span className="course-cat" style={{ marginBottom: 0 }}>{video.category_name}</span>}
            {video.duration > 0 && (
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>
                {fmtDuration(video.duration)} · 发布于 {timeAgo(video.created_at)}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3.4vw, 36px)', fontWeight: 700, letterSpacing: '-.02em', marginBottom: 18 }}>
            {video.title}
          </h1>
          {video.description && (
            <p style={{ color: 'var(--text-2)', fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {video.description}
            </p>
          )}

          <div style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {unlocked ? (
              <span className="btn sm" style={{ background: 'var(--success)', cursor: 'default' }}>
                已解锁 · 畅享完整课程
              </span>
            ) : (
              <>
                <Link to={`/redeem?course=${id}`} className="btn">
                  <IconTicket width="16" height="16" /> 兑换本课程
                </Link>
                <Link to="/courses" className="btn secondary">浏览更多课程</Link>
              </>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
