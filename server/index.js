import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, ROOT, VIDEOS_DIR, PREVIEWS_DIR, COVERS_DIR } from './db.js';
import { hashPassword, verifyUnlockToken } from './auth.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------- 初始化：默认管理员 ---------- */
function ensureAdmin() {
  const count = db.prepare('SELECT COUNT(*) n FROM admin').get().n;
  if (count > 0) return;
  const username = process.env.ACADEMY_ADMIN_USER || 'admin';
  const password = process.env.ACADEMY_ADMIN_PASS || 'admin123456';
  const { salt, hash } = hashPassword(password);
  db.prepare('INSERT INTO admin (username, password_hash, salt) VALUES (?, ?, ?)').run(username, hash, salt);
  console.log(`\n[academy] 已创建默认管理员: ${username} / ${password}  （生产环境请务必修改）\n`);
}

/* ---------- 应用 ---------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// 基础日志（简单、无第三方依赖）
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 公开 API
app.use('/api', publicRouter);

// 管理 API
app.use('/api/admin', adminRouter);

/* ---------- 文件/视频流 ---------- */

// 封面公开访问
app.get('/api/files/cover/:filename', (req, res) => {
  const p = path.join(COVERS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(p)) return res.status(404).end();
  res.sendFile(p);
});

// 预览片段：公开（未解锁可看前 60 秒）
app.get('/api/videos/:id/preview', (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(Number(req.params.id));
  if (!v || !v.preview_path || !fs.existsSync(v.preview_path)) {
    return res.status(404).json({ ok: false, error: '预览暂不可用' });
  }
  res.sendFile(path.resolve(v.preview_path));
});

// 完整视频：需解锁 token（Bearer 或 ?token=）
app.get('/api/videos/:id/stream', (req, res) => {
  const v = db.prepare('SELECT * FROM videos WHERE id = ?').get(Number(req.params.id));
  if (!v || !v.video_path || !fs.existsSync(v.video_path)) {
    return res.status(404).json({ ok: false, error: '视频不存在' });
  }
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.query.token;
  if (!verifyUnlockToken(token, Number(req.params.id))) {
    return res.status(403).json({ ok: false, error: '未解锁，请先兑换' });
  }
  // Range 支持（拖动进度条）
  const stat = fs.statSync(v.video_path);
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = m?.[2] ? parseInt(m[2], 10) : stat.size - 1;
    res.status(206);
    res.set({
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    });
    fs.createReadStream(v.video_path, { start, end }).pipe(res);
  } else {
    res.set({ 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(v.video_path).pipe(res);
  }
});

/* ---------- 前端静态 ---------- */
const CLIENT_DIST = path.join(ROOT, 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

/* ---------- 启动 ---------- */
const PORT = Number(process.env.PORT || 3000);
ensureAdmin();

if (process.argv.includes('--init-only')) {
  console.log('[academy] 初始化完成。');
  process.exit(0);
}

app.listen(PORT, () => {
  console.log(`\n  [academy] 服务已启动: http://localhost:${PORT}`);
  console.log(`  [academy] 管理后台:   http://localhost:${PORT}/login\n`);
});
