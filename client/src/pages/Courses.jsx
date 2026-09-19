import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import { VideoCard, SkeletonGrid } from '../components/VideoCard.jsx';
import { api } from '../lib/api.js';
import { IconSearch } from '../components/Icons.jsx';

export default function Courses() {
  const [videos, setVideos] = useState(null);
  const [categories, setCategories] = useState([]);
  const [params, setParams] = useSearchParams();
  const activeCat = params.get('category') || '';
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/api/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setVideos(null);
    const url = activeCat ? `/api/videos?category=${activeCat}` : '/api/videos';
    api.get(url).then((r) => setVideos(r.data)).catch(() => setVideos([]));
  }, [activeCat]);

  const filtered = useMemo(() => {
    if (!videos) return null;
    const k = q.trim().toLowerCase();
    if (!k) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(k) || (v.description || '').toLowerCase().includes(k));
  }, [videos, q]);

  return (
    <>
      <section className="section" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="container">
          <Reveal>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-.03em', marginBottom: 10 }}>
              全部课程
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 17 }}>精选系列课程 · 兑换解锁后完整观看</p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="container">
          {/* 筛选栏 */}
          <Reveal>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 36 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className={`admin-tab ${!activeCat ? 'active' : ''}`}
                  onClick={() => setParams({})}
                >
                  全部
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`admin-tab ${activeCat === String(c.id) ? 'active' : ''}`}
                    onClick={() => setParams({ category: c.id })}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', position: 'relative', minWidth: 200, flex: 1, maxWidth: 300 }}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜索课程…"
                  style={{
                    width: '100%', padding: '11px 16px 11px 40px', borderRadius: 999,
                    border: '1px solid rgba(0,0,0,.08)', outline: 'none', fontSize: 14,
                    background: 'rgba(0,0,0,.03)', transition: 'all .3s var(--ease)',
                  }}
                  onFocus={(e) => { e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(0,113,227,.1)'; }}
                  onBlur={(e) => { e.target.style.background = 'rgba(0,0,0,.03)'; e.target.style.boxShadow = 'none'; }}
                />
                <IconSearch width="17" height="17" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              </div>
            </div>
          </Reveal>

          {/* 课程网格 */}
          {filtered === null ? (
            <SkeletonGrid n={6} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <IconSearch width="44" height="44" />
              <p>{q ? '没有找到匹配的课程' : '该分类下暂无课程'}</p>
            </div>
          ) : (
            <div className="grid-courses">
              {filtered.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
