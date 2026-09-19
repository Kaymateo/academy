import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate, timeAgo } from '../../lib/api.js';
import { IconVideo, IconTicket, IconGauge, IconArrowRight } from '../../components/Icons.jsx';

function StatCard({ icon, num, label, accent }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color: accent || 'var(--link)' }}>{icon}</span>
        <div className="lbl" style={{ marginTop: 0 }}>{label}</div>
      </div>
      <div className="num">{num}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/admin/stats', { admin: true }).then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => <div key={i} className="stat-card skeleton" style={{ height: 92, borderRadius: 18 }} />)}
      </div>
    );
  }

  const { videos, published, categories, codes, redemptions, todayRedeems, recentVideos, recentRedeems } = stats;

  return (
    <>
      <div className="stat-grid">
        <StatCard icon={<IconVideo width="18" height="18" />} num={videos} label={`课程总数（${published} 上架）`} />
        <StatCard icon={<IconTicket width="18" height="18" />} num={codes.total} label={`兑换码总量（${codes.unused} 未用 / ${codes.used} 已用 / ${codes.disabled} 停用）`} />
        <StatCard icon={<IconGauge width="18" height="18" />} num={redemptions} label={`累计兑换次数（今日 ${todayRedeems}）`} accent="var(--success)" />
        <StatCard icon={<IconGauge width="18" height="18" />} num={categories} label="分类数量" accent="var(--text-2)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="panel">
          <div className="panel-head">
            <h3>最新课程</h3>
            <Link to="/admin/videos" style={{ fontSize: 13 }}>管理课程 <IconArrowRight width="13" height="13" /></Link>
          </div>
          {recentVideos.length === 0 ? (
            <div className="empty-state"><p>还没有课程，去上传第一个吧</p></div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>标题</th><th>发布时间</th></tr></thead>
                <tbody>
                  {recentVideos.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 500 }}>{v.title}</td>
                      <td style={{ color: 'var(--text-3)' }}>{timeAgo(v.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>最近兑换</h3>
            <Link to="/admin/records" style={{ fontSize: 13 }}>全部记录 <IconArrowRight width="13" height="13" /></Link>
          </div>
          {recentRedeems.length === 0 ? (
            <div className="empty-state"><p>暂无兑换记录</p></div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>兑换码</th><th>课程</th><th>时间</th></tr></thead>
                <tbody>
                  {recentRedeems.map((r, i) => (
                    <tr key={i}>
                      <td className="mono">{r.code}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title || (r.course_id === 0 ? '全站通用' : `课程#${r.course_id}`)}
                      </td>
                      <td style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtDate(r.redeemed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
