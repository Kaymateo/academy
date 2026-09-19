import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useToast } from '../../components/Toast.jsx';
import { IconPlus, IconDownload, IconTicket, IconSearch } from '../../components/Icons.jsx';

const PAGE_SIZE = 15;

export default function AdminCodes() {
  const toast = useToast();
  const [codes, setCodes] = useState({ list: [], total: 0, page: 1, summary: null });
  const [batches, setBatches] = useState([]);
  const [videos, setVideos] = useState([]);

  // 生成表单
  const [count, setCount] = useState(20);
  const [courseId, setCourseId] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [batch, setBatch] = useState('');
  const [generating, setGenerating] = useState(false);

  // 筛选
  const [fStatus, setFStatus] = useState('');
  const [fBatch, setFBatch] = useState('');
  const [fQ, setFQ] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const loadCodes = (p = page, status = fStatus, batch = fBatch, q = fQ) => {
    const qs = new URLSearchParams({ page: p, pageSize: PAGE_SIZE });
    if (status) qs.set('status', status);
    if (batch) qs.set('batch', batch);
    if (q) qs.set('q', q);
    api.get(`/api/admin/codes?${qs}`, { admin: true }).then((r) => setCodes(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/api/admin/codes/batches', { admin: true }).then((r) => setBatches(r.data)).catch(() => {});
    api.get('/api/admin/videos', { admin: true }).then((r) => setVideos(r.data)).catch(() => {});
  }, []);

  useEffect(() => { loadCodes(); /* eslint-disable-next-line */ }, [page, fStatus, fBatch, fQ]);

  const courseLabel = (id) => {
    if (!id) return '全站通用';
    const v = videos.find((x) => x.id === id);
    return v ? v.title : `课程#${id}`;
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/api/admin/codes/generate', {
        count: Number(count),
        courseId: courseId ? Number(courseId) : 0,
        durationDays: Number(durationDays),
        batch,
      }, { admin: true });
      toast.success(`成功生成 ${r.data.count} 个兑换码（批次 ${r.data.batch}）`);
      loadCodes(1); // 刷新
      api.get('/api/admin/codes/batches', { admin: true }).then((x) => setBatches(x.data)).catch(() => {});
    } catch (err) { toast.error(err.message); } finally { setGenerating(false); }
  };

  const toggle = async (c) => {
    const action = c.status === 'disabled' ? 'enable' : 'disable';
    try {
      await api.post(`/api/admin/codes/${c.id}/${action}`, {}, { admin: true });
      toast.success(action === 'disable' ? '已停用' : '已重新启用');
      loadCodes();
    } catch (err) { toast.error(err.message); }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (fStatus) qs.set('status', fStatus);
      if (fBatch) qs.set('batch', fBatch);
      if (fQ) qs.set('q', fQ);
      const res = await fetch(`/api/admin/codes/export?${qs}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('academy_admin_token')}` },
      });
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `兑换码_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('已导出 CSV');
    } catch (err) { toast.error(err.message); } finally { setExporting(false); }
  };

  const totalPages = Math.max(1, Math.ceil(codes.total / PAGE_SIZE));
  const { summary } = codes;

  return (
    <>
      {/* 批量生成 */}
      <div className="panel">
        <div className="panel-head"><h3>批量生成兑换码</h3></div>
        <div className="inline-form">
          <div className="field">
            <label>生成数量</label>
            <input type="number" min={1} max={5000} value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <div className="field">
            <label>对应课程</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">全站通用（解锁任意课程）</option>
              {videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
            </select>
          </div>
          <div className="field">
            <label>解锁时长（天）</label>
            <input type="number" min={1} max={3650} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 180 }}>
            <label>批次名称（可选）</label>
            <input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="如：第一期" />
          </div>
          <button className="btn" onClick={generate} disabled={generating} style={{ marginBottom: 4 }}>
            <IconPlus width="16" height="16" /> {generating ? '生成中…' : '生成'}
          </button>
          <button className="btn secondary" onClick={exportCsv} disabled={exporting} style={{ marginBottom: 4 }}>
            <IconDownload width="16" height="16" /> {exporting ? '导出中…' : '导出 CSV'}
          </button>
        </div>
        <div className="hint" style={{ marginTop: 10 }}>
          兑换码为 16 位随机字符，兑换后一次性失效并记录使用信息；单次最多生成 5000 个。
        </div>
      </div>

      {/* 筛选与列表 */}
      <div className="panel">
        <div className="panel-head">
          <h3>
            兑换码列表
            {summary && (
              <span style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 12, fontWeight: 400 }}>
                {summary.unused || 0} 未用 · {summary.used || 0} 已用 · {summary.disabled || 0} 停用
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(1); }}>
              <option value="">全部状态</option>
              <option value="unused">未使用</option>
              <option value="used">已使用</option>
              <option value="disabled">已停用</option>
            </select>
            <select value={fBatch} onChange={(e) => { setFBatch(e.target.value); setPage(1); }}>
              <option value="">全部批次</option>
              {batches.map((b) => <option key={b.batch} value={b.batch}>{b.batch}（{b.n}）</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <input
                value={fQ}
                onChange={(e) => { setFQ(e.target.value); setPage(1); }}
                placeholder="搜索兑换码"
                style={{ padding: '10px 14px 10px 36px', borderRadius: 999, border: '1px solid rgba(0,0,0,.08)', outline: 'none', fontSize: 13, width: 170 }}
              />
              <IconSearch width="15" height="15" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>兑换码</th><th>适用课程</th><th>时长</th><th>状态</th><th>批次</th><th>使用设备</th><th>到期时间</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {codes.list.map((c) => (
                <tr key={c.id}>
                  <td className="mono" style={{ fontWeight: 500 }}>{c.code}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {courseLabel(c.course_id)}
                  </td>
                  <td>{c.duration_days} 天</td>
                  <td>
                    <span className={`pill ${c.status}`}>
                      {c.status === 'unused' ? '未使用' : c.status === 'used' ? '已使用' : '已停用'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-3)' }}>{c.batch}</td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                    {c.device || '—'}
                  </td>
                  <td style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {c.expires_at ? c.expires_at.slice(0, 10) : '—'}
                  </td>
                  <td>
                    {c.status === 'unused' ? (
                      <button className="btn sm danger" style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(215,0,21,.3)' }} onClick={() => toggle(c)}>
                        停用
                      </button>
                    ) : c.status === 'disabled' ? (
                      <button className="btn sm" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => toggle(c)}>
                        重新启用
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>不可操作</span>
                    )}
                  </td>
                </tr>
              ))}
              {codes.list.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><IconTicket width="40" height="40" /><p>暂无兑换码，先在上方生成一批吧</p></div></td></tr>
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
    </>
  );
}
