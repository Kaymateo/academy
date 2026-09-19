import { useEffect, useRef, useState } from 'react';
import { api, fmtDuration, uploadVideo } from '../../lib/api.js';
import { useToast } from '../../components/Toast.jsx';
import { IconPlus, IconTrash, IconEdit, IconVideo } from '../../components/Icons.jsx';

export default function AdminVideos() {
  const toast = useToast();
  const [videos, setVideos] = useState(null);
  const [categories, setCategories] = useState([]);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null); // 编辑中的课程 id
  const [newCat, setNewCat] = useState('');
  const fileInputs = { video: useRef(null), cover: useRef(null) };

  const load = () => {
    api.get('/api/admin/videos', { admin: true }).then((r) => setVideos(r.data)).catch(() => {});
  };
  const loadCats = () => {
    api.get('/api/admin/categories', { admin: true }).then((r) => setCategories(r.data)).catch(() => {});
  };

  useEffect(() => { load(); loadCats(); }, []);

  const resetForm = () => {
    setTitle(''); setCategoryId(''); setDescription(''); setPublished(1);
    setVideoFile(null); setCoverFile(null); setEditing(null);
    if (fileInputs.video.current) fileInputs.video.current.value = '';
    if (fileInputs.cover.current) fileInputs.cover.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('请填写课程标题'); return; }
    if (!editing && !videoFile) { toast.error('请选择视频文件'); return; }

    if (editing) {
      try {
        await api.patch(`/api/admin/videos/${editing}`, {
          title: title.trim(), category_id: categoryId ? Number(categoryId) : null,
          description: description.trim(), published: Number(published),
        }, { admin: true });
        toast.success('课程信息已更新');
        resetForm(); load();
      } catch (err) { toast.error(err.message); }
      return;
    }

    const fd = new FormData();
    fd.append('video', videoFile);
    if (coverFile) fd.append('cover', coverFile);
    fd.append('title', title.trim());
    fd.append('category_id', categoryId || '');
    fd.append('description', description.trim());
    fd.append('published', String(published));
    setUploading(true);
    try {
      const r = await uploadVideo(fd);
      toast.success(r.data.message || '上传成功');
      resetForm(); load();
    } catch (err) { toast.error(err.message); } finally { setUploading(false); }
  };

  const startEdit = (v) => {
    setEditing(v.id);
    setTitle(v.title);
    setCategoryId(v.category_id ? String(v.category_id) : '');
    setDescription(v.description || '');
    setPublished(v.published);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (v) => {
    if (!window.confirm(`确定删除课程「${v.title}」？视频文件将一并删除。`)) return;
    try {
      await api.del(`/api/admin/videos/${v.id}`, { admin: true });
      toast.success('已删除');
      if (editing === v.id) resetForm();
      load();
    } catch (err) { toast.error(err.message); }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await api.post('/api/admin/categories', { name: newCat.trim() }, { admin: true });
      setNewCat('');
      loadCats();
      toast.success('分类已添加');
    } catch (err) { toast.error(err.message); }
  };

  const removeCategory = async (c) => {
    if (!window.confirm(`删除分类「${c.name}」？`)) return;
    try {
      await api.del(`/api/admin/categories/${c.id}`, { admin: true });
      loadCats(); toast.success('已删除');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      {/* 上传 / 编辑表单 */}
      <div className="panel">
        <div className="panel-head">
          <h3>{editing ? `编辑课程 #${editing}` : '上传新课程'}</h3>
          {editing && <button className="btn sm secondary" onClick={resetForm}>取消编辑</button>}
        </div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, columnGap: 24 }}>
            <div className="field">
              <label>课程标题 *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：零基础摄影入门" maxLength={80} />
            </div>
            <div className="field">
              <label>所属分类</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ flex: 1 }}>
                  <option value="">未分类</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="新分类"
                    style={{ width: 110, padding: '14px 12px', fontSize: 14 }}
                  />
                  <button type="button" className="btn sm secondary" onClick={addCategory}>添加</button>
                </div>
              </div>
            </div>
          </div>

          <div className="field">
            <label>课程简介</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简要介绍课程内容与适合人群…" maxLength={2000} />
          </div>

          {!editing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="field">
                <label>视频文件 *（mp4 / webm，最大 2GB）</label>
                <input
                  ref={fileInputs.video}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                />
                {videoFile && (
                  <div className="hint">已选择：{videoFile.name}（{(videoFile.size / 1024 / 1024).toFixed(1)} MB）</div>
                )}
              </div>
              <div className="field">
                <label>封面图片（可选）</label>
                <input
                  ref={fileInputs.cover}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                />
                <div className="hint">建议 16:9，未上传时自动使用渐变占位</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={Boolean(published)} onChange={(e) => setPublished(e.target.checked ? 1 : 0)} />
              立即上架（前台可见）
            </label>
            <button className="btn" type="submit" disabled={uploading}>
              <IconPlus width="16" height="16" />
              {uploading ? '上传处理中…（生成预览片段）' : editing ? '保存修改' : '上传课程'}
            </button>
          </div>
        </form>
      </div>

      {/* 课程列表 */}
      <div className="panel">
        <div className="panel-head">
          <h3>课程列表（{videos?.length ?? '…'}）</h3>
        </div>
        {videos === null ? (
          <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        ) : videos.length === 0 ? (
          <div className="empty-state"><IconVideo width="44" height="44" /><p>还没有课程，使用上方表单上传第一个吧</p></div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th><th>标题</th><th>分类</th><th>时长</th><th>预览</th><th>状态</th><th>发布时间</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--text-3)' }}>#{v.id}</td>
                    <td style={{ fontWeight: 500, maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                    </td>
                    <td>{v.category_name || '—'}</td>
                    <td>{fmtDuration(v.duration)}</td>
                    <td>
                      {v.preview_path ? (
                        <a href={`/api/videos/${v.id}/preview`} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>试看</a>
                      ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`pill ${v.published ? 'unused' : 'disabled'}`}>
                        {v.published ? '已上架' : '已下架'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{v.created_at.slice(0, 10)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" title="编辑" onClick={() => startEdit(v)}><IconEdit /></button>
                        <button className="icon-btn danger" title="删除" onClick={() => remove(v)}><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分类管理 */}
      <div className="panel">
        <div className="panel-head"><h3>分类管理</h3></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <span key={c.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f5f7fa', borderRadius: 999, padding: '6px 8px 6px 16px', fontSize: 13,
            }}>
              {c.name}
              <button className="icon-btn" title="删除分类" onClick={() => removeCategory(c)} style={{ width: 26, height: 26 }}>
                <IconTrash width="14" height="14" />
              </button>
            </span>
          ))}
          {categories.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>暂无分类，可在上传表单中直接添加</span>}
        </div>
      </div>
    </>
  );
}
