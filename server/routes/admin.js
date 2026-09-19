import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import { db, VIDEOS_DIR, COVERS_DIR, PREVIEWS_DIR } from '../db.js';
import { hashPassword, verifyPassword, createAdminToken, verifyAdminToken } from '../auth.js';
import { probeDuration, makePreview } from '../media.js';

export const adminRouter = Router();

/* ---------- 鉴权 ---------- */

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyAdminToken(token);
  if (!payload) return res.status(401).json({ ok: false, error: '未登录或会话已过期' });
  req.admin = payload;
  next();
}

const COOKIE_EXEMPT = ['/api/admin/login'];

/* ---------- 登录 ---------- */

adminRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const row = db.prepare('SELECT * FROM admin WHERE username = ?').get(String(username || '').trim());
  if (!row || !verifyPassword(String(password || ''), row.salt, row.password_hash)) {
    return res.status(401).json({ ok: false, error: '账号或密码错误' });
  }
  res.json({ ok: true, data: { token: createAdminToken(row.username), username: row.username } });
});

adminRouter.get('/me', requireAdmin, (req, res) => {
  res.json({ ok: true, data: { username: req.admin.u } });
});

/* ---------- 分类 ---------- */

adminRouter.get('/categories', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT id, name, sort FROM categories ORDER BY sort, id').all();
  res.json({ ok: true, data: rows });
});

adminRouter.post('/categories', requireAdmin, (req, res) => {
  const { name, sort } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ ok: false, error: '分类名不能为空' });
  try {
    const r = db.prepare('INSERT INTO categories (name, sort) VALUES (?, ?)').run(name.trim(), Number(sort) || 0);
    res.json({ ok: true, data: { id: r.lastInsertRowid } });
  } catch {
    res.status(409).json({ ok: false, error: '分类已存在' });
  }
});

adminRouter.delete('/categories/:id', requireAdmin, (req, res) => {
  const used = db.prepare('SELECT COUNT(*) n FROM videos WHERE category_id = ?').get(Number(req.params.id)).n;
  if (used > 0) return res.status(400).json({ ok: false, error: `该分类下还有 ${used} 个课程，无法删除` });
  db.prepare('DELETE FROM categories WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

/* ---------- 视频上传管理 ---------- */

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, file, cb) => cb(null, file.fieldname === 'cover' ? COVERS_DIR : VIDEOS_DIR),
    filename: (_req, file, cb) => {
      const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || 'bin';
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB 单文件
});

adminRouter.get('/videos', requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT v.*, c.name AS category_name
                           FROM videos v LEFT JOIN categories c ON c.id = v.category_id
                           ORDER BY v.created_at DESC`).all();
  res.json({ ok: true, data: rows });
});

adminRouter.post('/videos', requireAdmin, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const { title, category_id, description, published } = req.body || {};
  if (!title?.trim()) {
    cleanupFiles(req.files);
    return res.status(400).json({ ok: false, error: '课程标题不能为空' });
  }
  if (!req.files?.video?.[0]) {
    cleanupFiles(req.files);
    return res.status(400).json({ ok: false, error: '请选择视频文件' });
  }

  const videoFile = req.files.video[0];
  const coverFile = req.files.cover?.[0];

  // 先插入拿到 id（预览切片命名需要）
  const insert = db.prepare(`INSERT INTO videos (title, category_id, description, video_path, cover_path, published)
                             VALUES (?, ?, ?, ?, ?, ?)`);
  const info = insert.run(
    title.trim(),
    Number(category_id) || null,
    String(description || '').trim(),
    videoFile.path,
    coverFile ? coverFile.path : null,
    Number(published === undefined ? 1 : published),
  );
  const id = info.lastInsertRowid;

  const [duration, previewPath] = await Promise.all([
    probeDuration(videoFile.path),
    makePreview(id, videoFile.path),
  ]);

  db.prepare('UPDATE videos SET duration = ?, preview_path = ? WHERE id = ?').run(duration, previewPath, id);

  res.json({
    ok: true,
    data: {
      id,
      duration,
      previewPath: previewPath ? `/api/videos/${id}/preview` : null,
      message: '课程上传成功',
    },
  });
});

function cleanupFiles(files) {
  for (const list of Object.values(files || {})) {
    for (const f of list || []) {
      try { fs.unlinkSync(f.path); } catch { /* ignore */ }
    }
  }
}

adminRouter.patch('/videos/:id', requireAdmin, (req, res) => {
  const { title, category_id, description, published } = req.body || {};
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ ok: false, error: '课程不存在' });

  db.prepare(`UPDATE videos SET
                title = COALESCE(?, title),
                category_id = COALESCE(?, category_id),
                description = COALESCE(?, description),
                published = COALESCE(?, published)
              WHERE id = ?`).run(
    title?.trim() || null,
    category_id === undefined || category_id === null ? null : Number(category_id),
    description === undefined ? null : String(description).trim(),
    published === undefined ? null : Number(published),
    id,
  );
  res.json({ ok: true, message: '已保存' });
});

adminRouter.delete('/videos/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  if (!v) return res.status(404).json({ ok: false, error: '课程不存在' });
  db.prepare('DELETE FROM videos WHERE id = ?').run(id);
  for (const p of [v.video_path, v.preview_path, v.cover_path]) {
    if (p && fs.existsSync(p)) { try { fs.unlinkSync(p); } catch { /* ignore */ } }
  }
  res.json({ ok: true, message: '已删除' });
});

/* ---------- 兑换码 ---------- */

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉 0/O/1/I
function genCode() {
  let s = '';
  for (let i = 0; i < 16; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12)}`;
}

adminRouter.post('/codes/generate', requireAdmin, (req, res) => {
  const { count, courseId, durationDays, batch } = req.body || {};
  const n = Math.min(Math.max(Number(count) || 1, 1), 5000);
  const course = Number(courseId) || 0;
  const days = Math.min(Math.max(Number(durationDays) || 30, 1), 3650);
  const batchName = String(batch || '').trim() || `B${Date.now().toString().slice(-6)}`;

  const insert = db.prepare('INSERT INTO codes (code, course_id, duration_days, batch) VALUES (?, ?, ?, ?)');
  const tx = db.transaction(() => {
    const codes = [];
    for (let i = 0; i < n; i++) {
      let code;
      let tries = 0;
      do {
        code = genCode();
        tries++;
      } while (db.prepare('SELECT 1 FROM codes WHERE code = ?').get(code) && tries < 10);
      insert.run(code, course, days, batchName);
      codes.push(code);
    }
    return codes;
  });

  const codes = tx();
  res.json({ ok: true, data: { batch: batchName, count: codes.length, codes } });
});

adminRouter.get('/codes', requireAdmin, (req, res) => {
  const { status, batch, courseId, q, page = 1, pageSize = 20 } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (batch) { where.push('batch = ?'); params.push(batch); }
  if (courseId) { where.push('course_id = ?'); params.push(Number(courseId)); }
  if (q) { where.push('code LIKE ?'); params.push(`%${String(q).toUpperCase()}%`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) n FROM codes ${w}`).get(...params).n;
  const list = db.prepare(`SELECT * FROM codes ${w} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const summary = db.prepare(`SELECT
    SUM(status='unused') AS unused, SUM(status='used') AS used, SUM(status='disabled') AS disabled
    FROM codes ${w}`).get(...params);

  res.json({ ok: true, data: { total, page: Number(page), pageSize: Number(pageSize), list, summary } });
});

adminRouter.get('/codes/batches', requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT batch, COUNT(*) n, SUM(status='unused') unused,
                                  SUM(status='used') used, MAX(created_at) created_at
                           FROM codes GROUP BY batch ORDER BY created_at DESC`).all();
  res.json({ ok: true, data: rows });
});

adminRouter.get('/codes/export', requireAdmin, (req, res) => {
  const { status, batch, courseId } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (batch) { where.push('batch = ?'); params.push(batch); }
  if (courseId) { where.push('course_id = ?'); params.push(Number(courseId)); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT code, course_id, duration_days, status, device, used_at, expires_at, batch, created_at
                           FROM codes ${w} ORDER BY id`).all(...params);

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['兑换码', '适用课程ID', '时长(天)', '状态', '使用设备', '使用时间', '到期时间', '批次', '创建时间'];
  const lines = rows.map(r => [r.code, r.course_id, r.duration_days,
    r.status === 'unused' ? '未使用' : r.status === 'used' ? '已使用' : '已停用',
    r.device, r.used_at, r.expires_at, r.batch, r.created_at].map(esc).join(','));
  const csv = '\uFEFF' + [head.map(esc).join(','), ...lines].join('\n'); // BOM 让 Excel 正确识别中文

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="codes_${Date.now()}.csv"`);
  res.send(csv);
});

adminRouter.post('/codes/:id/disable', requireAdmin, (req, res) => {
  const r = db.prepare(`UPDATE codes SET status='disabled' WHERE id=? AND status='unused'`)
    .run(Number(req.params.id));
  if (r.changes === 0) {
    return res.status(400).json({ ok: false, error: '仅未使用的兑换码可以停用' });
  }
  res.json({ ok: true, message: '已停用' });
});

adminRouter.post('/codes/:id/enable', requireAdmin, (req, res) => {
  const r = db.prepare(`UPDATE codes SET status = CASE WHEN status='disabled' THEN 'unused' ELSE status END
                        WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true, message: '已启用' });
});

/* ---------- 兑换记录 ---------- */

adminRouter.get('/redemptions', requireAdmin, (req, res) => {
  const { q, page = 1, pageSize = 20 } = req.query;
  const where = [];
  const params = [];
  if (q) { where.push('(code LIKE ? OR device LIKE ?)'); params.push(`%${String(q).toUpperCase()}%`, `%${q}%`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) n FROM redemptions ${w}`).get(...params).n;
  const list = db.prepare(`SELECT * FROM redemptions ${w} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  res.json({ ok: true, data: { total, page: Number(page), pageSize: Number(pageSize), list } });
});

/* ---------- 统计面板 ---------- */

adminRouter.get('/stats', requireAdmin, (_req, res) => {
  const videos = db.prepare('SELECT COUNT(*) n FROM videos').get().n;
  const published = db.prepare('SELECT COUNT(*) n FROM videos WHERE published = 1').get().n;
  const categories = db.prepare('SELECT COUNT(*) n FROM categories').get().n;
  const codes = db.prepare(`SELECT COUNT(*) n, SUM(status='unused') unused,
                                   SUM(status='used') used, SUM(status='disabled') disabled
                            FROM codes`).get();
  const redemptions = db.prepare('SELECT COUNT(*) n FROM redemptions').get().n;
  const todayRedeems = db.prepare(`SELECT COUNT(*) n FROM redemptions
                                   WHERE date(redeemed_at) = date('now')`).get().n;
  const recentVideos = db.prepare(`SELECT id, title, created_at FROM videos
                                   ORDER BY created_at DESC LIMIT 5`).all();
  const recentRedeems = db.prepare(`SELECT r.code, r.course_id, r.device, r.redeemed_at, v.title
                                    FROM redemptions r LEFT JOIN videos v ON v.id = r.course_id
                                    ORDER BY r.id DESC LIMIT 8`).all();

  res.json({ ok: true, data: {
    videos, published, categories,
    codes: { total: codes.n || 0, unused: codes.unused || 0, used: codes.used || 0, disabled: codes.disabled || 0 },
    redemptions, todayRedeems, recentVideos, recentRedeems,
  } });
});
