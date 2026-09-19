import { useEffect, useState } from 'react';
import { api, fmtDate } from '../../lib/api.js';
import { IconSearch, IconKey } from '../../components/Icons.jsx';

const PAGE_SIZE = 15;

export default function AdminRecords() {
  const [data, setData] = useState({ list: [], total: 0, page: 1 });
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = (p = page, keyword = q) => {
    const qs = new URLSearchParams({ page: p, pageSize: PAGE_SIZE });
    if (keyword) qs.set('q', keyword);
    api.get(`/api/admin/redemptions?${qs}`, { admin: true }).then((r) => setData(r.data)).catch(() => {});
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>兑换记录（共 {data.total} 条）</h3>
        <div style={{ position: 'relative' }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="搜索兑换码 / 设备"
            style={{ padding: '10px 14px 10px 36px', borderRadius: 999, border: '1px solid rgba(0,0,0,.08)', outline: 'none', fontSize: 13, width: 200 }}
          />
          <IconSearch width="15" height="15" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        </div>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>ID</th><th>兑换码</th><th>适用课程</th><th>使用设备</th><th>IP</th><th>解锁到期</th><th>兑换时间</th>
            </tr>
          </thead>
          <tbody>
            {data.list.map((r) => (
              <tr key={r.id}>
                <td style={{ color: 'var(--text-3)' }}>{r.id}</td>
                <td className="mono" style={{ fontWeight: 500 }}>{r.code}</td>
                <td>{r.course_id === 0 ? '全站通用' : `课程#${r.course_id}`}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>
                  {r.device || '—'}
                </td>
                <td className="mono" style={{ color: 'var(--text-3)' }}>{r.ip || '—'}</td>
                <td style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{r.unlocked_until?.slice(0, 10) || '—'}</td>
                <td style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtDate(r.redeemed_at)}</td>
              </tr>
            ))}
            {data.list.length === 0 && (
              <tr><td colSpan={7}><div className="empty-state"><IconKey width="40" height="40" /><p>暂无兑换记录</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn sm secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
          <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-2)' }}>{page} / {totalPages}</span>
          <button className="btn sm secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
        </div>
      )}
    </div>
  );
}
