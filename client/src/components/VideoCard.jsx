import { useNavigate } from 'react-router-dom';
import { IconPlay, IconLock } from './Icons.jsx';
import { fmtDuration } from '../lib/api.js';
import { hasLocalUnlock } from '../lib/unlock.js';

export function VideoCard({ video, index = 0 }) {
  const nav = useNavigate();
  const unlocked = hasLocalUnlock(video.id);

  return (
    <div
      className="course-card"
      style={{ animation: `card-in .6s var(--ease) ${index * 60}ms both` }}
      onClick={() => nav(`/watch/${video.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && nav(`/watch/${video.id}`)}
    >
      <div className="course-thumb">
        {video.cover_path
          ? <img src={video.cover_path} alt={video.title} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa0aa' }}>
              <IconPlay width="40" height="40" />
            </div>}
        <div className="play-badge"><span><IconPlay /></span></div>
        {video.duration > 0 && <span className="course-dur">{fmtDuration(video.duration)}</span>}
        {!unlocked && (
          <span style={{
            position: 'absolute', left: 12, top: 12,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 11,
            padding: '3px 10px', borderRadius: 999, backdropFilter: 'blur(4px)',
          }}>
            <IconLock width="11" height="11" /> 需兑换
          </span>
        )}
      </div>
      <div className="course-body">
        {video.category_name && <div className="course-cat">{video.category_name}</div>}
        <h3>{video.title}</h3>
        {video.description && <p>{video.description}</p>}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton skel-card">
      <div className="skel-thumb" />
      <div className="skel-line tall" />
      <div className="skel-line short" />
      <div className="skel-line" />
    </div>
  );
}

export function SkeletonGrid({ n = 6 }) {
  return (
    <div className="grid-courses">
      {Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

/** 卡片入场动画 keyframes */
export const cardInStyle = `
@keyframes card-in {
  from { opacity: 0; transform: translateY(22px) scale(.98); }
  to { opacity: 1; transform: none; }
}`;
